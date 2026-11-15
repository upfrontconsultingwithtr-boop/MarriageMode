# 12 · MVP Build Plan

## Scope: answer one question

**Will people use a free, private cleanup audit, and leave an email for
Couple Mode?** Test: 30 days, free channels only. Pass if 50 waitlist
signups and 200 audits started; fail if fewer than 15 signups.

## Built (2026-11-15)

| Item | Where | Verified |
|---|---|---|
| Landing page, waitlist, privacy, safety | `app/src/app/` | Built; phone-width screenshot, no sideways scroll, no console errors |
| Free audit: picker, checklist, scores, email check, share | `app/src/app/audit/AuditApp.tsx` | Clicked through in Chromium; progress persists across reload |
| Audit engine + catalog (29 platforms) | `app/src/lib/` | 8 unit tests pass |
| Production schema + RLS | `supabase/migrations/0001_init.sql` | Loaded into Postgres 16 + pgvector |
| RLS isolation test | `supabase/tests/rls_isolation.sql` | 16/16 checks pass |
| Security headers | `app/netlify.toml` | — |
| CI | `.github/workflows/ci.yml` | Runs on push |

## Run it

```bash
cd app && npm install
npm run dev          # http://localhost:3000
npm test             # unit tests
npm run build        # static site in app/out
```

## Next two weeks

| Day | Work |
|---|---|
| 1–2 | Publish on Netlify; turn on form notifications to the business inbox |
| 3–5 | A10: generate 29 "how to delete [platform]" pages from the catalog |
| 6–7 | A11: privacy-safe analytics (counts only) so the test can be measured |
| 8–10 | Counselor worksheet PDF; 10 counselor emails (drafts for founder to send) |
| 11–14 | Read results; adjust the headline if audit starts < 30% of visitors |

## Not in the MVP (on purpose)

Accounts, payments, Couple Mode UI, AI coach, Command Center UI. None are
needed to answer the test question.
