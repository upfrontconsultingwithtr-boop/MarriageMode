# 13 · Production Build Plan

Starts only after the MVP test passes (doc 12).

## 1. Sprints (two weeks each)

| Sprint | Goal | Backlog |
|---|---|---|
| S1 | Accounts | B1, B2, B5, G3; Supabase project created by founder (sign-in is hers) |
| S2 | Payments | B3, B4; Stripe account (Decision #8); pricing page; terms reviewed (Decision #9) |
| S3 | Discovery | C1 data-file scanner; C2 catalog in DB |
| S4 | Couple beta | D3–D6; safety review of every screen against `TRUST-AND-SAFETY.md` |
| S5 | Couple GA + analytics | Couple billing; funnel dashboards |
| S6 | Practitioner | H1; pilot counselors |
| S7 | Coach | E2, E3 after AI spend approval |
| S8 | Command Center | F2–F4 |

## 2. Definition of done (every story)

Typecheck + unit tests + RLS test green in CI · works at 390px · keyboard
accessible · no new personal data without a privacy-page update · reviewed
against the trust rules.

## 3. Environments and release

Feature branch → PR → Netlify deploy preview + CI → merge to `main` →
production deploy. Database changes ship only as numbered migrations;
never edit production by hand. Releases tagged `v0.x` with notes in `CHANGELOG.md`.

## 4. Security checklist before taking payments

- [ ] RLS test covers every table (CI fails otherwise)
- [ ] Service role key only in Edge Function secrets
- [ ] Stripe webhook signature verified
- [ ] Rate limits on auth and invites
- [ ] Dependency scanning (Dependabot) and secret scanning on
- [ ] Backups: Supabase daily (paid plan) or a nightly `pg_dump` via GitHub Action to private storage (free)
- [ ] Privacy policy and terms reviewed by a lawyer

## 5. Incident response

1. Detect (error alerts, user report). 2. Contain: rotate keys, disable the
feature flag. 3. Assess what data was affected. 4. Notify the founder within
1 hour, and users and regulators as the law requires (state breach laws).
5. Write it up in `docs/incidents/` within 5 days.

## 6. Scale triggers (when free stops being enough)

| Signal | Move | Cost decision |
|---|---|---|
| Supabase free limits (database size, users) near 80% | Supabase Pro | Founder |
| Netlify bandwidth near limit | Netlify Pro or Firebase | Founder |
| > 1,000 coach chats/month | Review the cap and model mix | Founder |
