# 03 · Database Schema

The SQL is in `supabase/migrations/0001_init.sql`. It was loaded into
PostgreSQL 16 with pgvector on 2026-11-15, and
`supabase/tests/rls_isolation.sql` passed all 16 checks.

## Two schemas, two trust models

| Schema | Holds | Who owns a row | Isolation |
|---|---|---|---|
| `app` | Customer product data | One person (`user_id = auth.uid()`) | Owner-only RLS; couple sharing through explicit `couple_shares` rows |
| `ops` | The company's Command Center | An organization (`org_id`) | Members read, permission-gated writes, server-resolved org |
| `private` | Security-definer helper functions | — | Not exposed through the API |

## Required areas → tables

| Required | Tables |
|---|---|
| Users | `auth.users` (Supabase), `app.profiles` |
| Teams | `ops.teams`, `ops.team_members` |
| Organizations | `ops.organizations`, `ops.members` |
| Projects | `ops.projects` (kind: product, marketing, sprint, release, investor) |
| Tasks | `ops.tasks` (type: task, feature, bug, chore, risk) |
| Messages | `ops.messages` |
| AI Chats | `app.ai_chats`/`app.ai_messages` (coach), `ops.ai_chats`/`ops.ai_messages` (Chief of Staff) |
| Permissions | `ops.roles`, `ops.permissions`, `ops.role_permissions`; `private.has_permission()` |
| Documents | `ops.documents` (visibility org / executive / founder) |
| Knowledge Base | `ops.knowledge_chunks` (pgvector, HNSW index), `ops.memories` |
| Analytics | `ops.analytics_events`, `ops.kpi_snapshots` |
| Subscriptions | `app.subscriptions` (written only by the Stripe webhook) |
| Notifications | `app.notifications`, `ops.notifications` |
| Settings | `app.settings`, `ops.settings` (incl. AI monthly cap, default 0 = off) |
| Integrations | `app.integrations`, `ops.integrations` (tokens in Supabase Vault, never in rows) |
| Audit Logs | `ops.audit_logs`: append-only, written by triggers on sensitive tables |

Product tables: `app.platforms` (catalog), `app.audits`, `app.audit_items`,
`app.reflections`, `app.couples`, `app.couple_members`, `app.couple_invites`,
`app.couple_shares`, `app.couple_goals`, `app.waitlist`.

## Key relationships

```
auth.users 1─1 app.profiles, app.settings
auth.users 1─* app.audits 1─* app.audit_items *─1 app.platforms
app.couples 1─2 app.couple_members ─ auth.users
app.couples 1─* app.couple_shares (owner picks each one)   1─* app.couple_goals
ops.organizations 1─* ops.members *─1 ops.roles *─* ops.permissions
ops.organizations 1─* ops.projects 1─* ops.tasks 1─* ops.messages
ops.documents 1─* ops.knowledge_chunks   ops.memories (superseded_by chain)
```

## Security features in the schema

- RLS enabled on every table; tables with no policy (`app.waitlist`,
  `app.couple_invites`) are reachable only by the server.
- Invite tokens stored as SHA-256 hashes; accepting your own invite is refused.
- Any couple member can end the couple; nobody can re-activate it from the client.
- A partner never reads the other's `audits`, even while linked (tested).
- `has_permission()` is scoped to the organization being acted on (the fix the
  COS database needed on 2026-11-08 is built in from day one).
- Investors read KPIs only; founder-visibility documents are hidden from them (tested).

## Running it

```bash
supabase start                      # local Postgres in Docker
supabase db reset                   # applies migrations
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_isolation.sql
```
In Supabase settings, add `app` and `ops` to **Exposed schemas** for the API.
