# 02 · System Architecture

## 1. Shape of the system

```
                  ┌──────────────────────────── Users (phone / desktop browser, PWA) ───────────────┐
                  │                                                                                 │
   Free audit ────┤  Next.js app (static export, TypeScript, Tailwind)                              │
   runs in the    │   • Audit engine + catalog (runs in browser, localStorage)                      │
   browser only   │   • Takeout / data-file scanner (Web Worker, file never uploaded)  [P1]         │
                  └───────────────┬─────────────────────────────────────────────────────────────────┘
                                  │ only when the user signs in and opts to sync
                                  ▼
   ┌────────────────────────── Supabase (Postgres + Auth + Storage + Edge Functions) ──────────────┐
   │  Auth: magic link, Google/Apple OAuth, passkeys (WebAuthn)                                    │
   │  Postgres + RLS: app schema (users, audits, couples...) + ops schema (tasks, docs, KPIs...)   │
   │  pgvector: knowledge_chunks for AI memory (RAG)                                               │
   │  Vault: encrypted third-party tokens                                                          │
   │  Edge Functions: stripe-webhook · ai-router · catalog-sync · digest · gmail-scan [P2]         │
   └───────┬───────────────────┬──────────────────────┬──────────────────────┬────────────────────┘
           │                   │                      │                      │
        Stripe            AI providers           PostHog (counts only)   Command Center HQ +
     (payments)       (Claude primary, GPT        no content, no PII     COS (existing LLC systems)
                       fallback, via ai-router)
```

## 2. Choices and reasons

| Layer | Choice | Why (free first) |
|---|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind, static export | Fast, SEO-friendly, deploys free anywhere |
| Hosting | **Netlify free** (MVP) → Netlify or Firebase Hosting | Vercel's free Hobby plan is non-commercial only. Netlify free allows commercial use and includes Forms. The LLC already runs both. |
| Auth | **Supabase Auth** | Free tier, OAuth + magic links + passkeys, already used by COS. Clerk and Auth.js would duplicate it. |
| Database | Supabase Postgres + RLS | Free tier; the LLC's COS already runs on it |
| Vector search | pgvector inside the same Postgres | No separate paid vector database |
| AI | Claude via an `ai-router` Edge Function; GPT as fallback | One place for keys, caps, logging and model routing |
| Payments | Stripe Checkout + Customer Portal | No monthly fee; hosted pages keep card data off our servers |
| Analytics | PostHog cloud free tier, events only | Funnel analytics without content |
| CI/CD | GitHub Actions: lint, typecheck, build, RLS isolation tests, deploy | Free for this repo |
| Containers | Docker Compose for local Supabase (`supabase start`) | Same stack locally |

**Free-tier risk:** Supabase free projects pause after 7 days without
traffic. The LLC already fixed this for COS with a GitHub Actions keep-alive;
copy that workflow here.

## 3. Front-end modules

```
app/src/
  app/            routes: /, /audit, /dashboard, /couple, /coach, /privacy
  components/     Card, Checklist, ScoreRing, PlatformPicker, ShareCard...
  lib/catalog.ts  dating platform catalog (data)
  lib/audit.ts    step generation + scoring (pure functions, unit-tested)
  lib/store.ts    localStorage persistence (sync adapter added in P1)
```

The audit engine is pure functions: `buildSteps(platforms)` and
`score(steps, done)`. The same code runs in the browser (free tier) and in an
Edge Function (synced accounts), so scores always match.

## 4. Data flow: free audit (MVP)

1. User picks platforms → `buildSteps` creates the checklist.
2. User ticks steps → state saved to `localStorage` only.
3. Scores recompute on every tick.
4. Share card renders a text summary the user copies or sends.
5. Nothing is sent to any server. PostHog (P1) gets only event names such as
   `audit_started`, never platform names.

## 5. Data flow: synced account (P1)

1. Sign in → Supabase session (JWT, httpOnly refresh).
2. Local audit is uploaded once, with consent, to `audits` / `audit_items`.
3. RLS limits every row to `auth.uid()`. Couple-shared rows are readable by
   the partner only through `couple_shares` entries the owner created.

## 6. Security architecture

| Control | Implementation |
|---|---|
| No stored passwords | Magic links, OAuth, passkeys only. |
| Least privilege | RLS on every table; service role key only inside Edge Functions. |
| Tenant isolation (ops side) | `org_id` on every ops table, resolved on the server from the user's membership, never from the client. CI test signs in as tenant A and must get zero rows from tenant B. |
| RBAC | `roles` + `permissions` + `role_permissions`; checks through the `has_permission(org, perm)` SQL function. |
| Secrets | Supabase Vault for third-party tokens; GitHub Actions secrets for deploy keys; no secrets in the repo. |
| Transport and headers | TLS everywhere; CSP, HSTS, X-Frame-Options DENY, Referrer-Policy (see `app/netlify.toml`). |
| Audit trail | `audit_logs` append-only (no UPDATE/DELETE policy), written by triggers. |
| AI safety | `ai-router` strips personal data before calls, enforces monthly spend caps, logs model, tokens and cost. |
| Provider rules | Integrations use only official OAuth flows and documented APIs; nothing scrapes or signs in as the user. |
| Incident response | See `13-PRODUCTION-BUILD-PLAN.md` §5. |

## 7. Environments

| Env | Frontend | Database |
|---|---|---|
| local | `npm run dev` | `supabase start` (Docker) |
| preview | Netlify deploy previews per PR | Supabase branch or staging project |
| production | Netlify production | Supabase production project |
