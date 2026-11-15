# Marriage Mode: founder brief (read this first)

Marriage Mode, a product of Upfront Consulting with Tiff & Reco LLC.

**Name (founder, 2026-11-15):** "Marriage Mode", two words, on everything
customers see. The repo and code identifiers stay `MarriageMode` / `marriage-mode`.
Written 2026-11-15 from the founder's master build document. These pages
are the plan of record until a newer founder decision replaces them.

## What I changed in the idea, and why

The master document is strong on vision. Six parts of it would sink the
company if built as written, so the plan below changes them.

| # | As written | Problem | What we do instead |
|---|---|---|---|
| 1 | The app "analyzes installed applications", social follows and conversations | iPhones do not let any app list other apps. Google Play restricts the permission that lists them. Dating apps have no public APIs for closing accounts. Instagram, Facebook and X do not let outside apps unfollow or remove contacts for you. | **Guided, self-led cleanup.** A catalog of dating platforms with the exact steps to close each one, cancel billing and stop emails. The user does each step and ticks it off. Automation only where a provider offers an approved API. |
| 2 | Couple Mode with "transparency metrics" and "activity overview" | This is one feature away from partner surveillance (stalkerware). Apple and Google remove those apps, and it can enable coercive control. One news story ends the brand. | **Consent by design.** Each person runs their own audit. A partner sees only the summary the user chooses to share. No location, no message reading, no remote access, no covert mode, and either person can leave instantly. See `TRUST-AND-SAFETY.md`. |
| 3 | Reading email subscriptions through account access | Reading Gmail through Google's API needs a "restricted scope" review, including a paid outside security assessment every year. | **MVP:** a one-tap Gmail search the user opens in their own inbox. No access is granted and nothing is read by us. **Later:** add the API once revenue pays for the review. |
| 4 | Build a Command Center that rivals Notion, ClickUp and Monday | A second software company inside the first. Months of work, zero customer value. The LLC already runs **Command Center HQ** (Firebase) and the **COS** CRM (Supabase). | **Reuse.** Add Marriage Mode as a business line in COS and a Marriage Mode view in Command Center HQ. Build only the Founder Dashboard numbers. |
| 5 | Vercel hosting, Clerk or Auth.js, paid AI calls | Vercel's free Hobby plan is for non-commercial use only. Clerk duplicates Supabase Auth. Every AI call costs money. | Netlify or Firebase free hosting (commercial use allowed), Supabase Auth (free, already in use), AI coach starts as written guidance and turns on paid AI only after approval. |
| 6 | A separate brand, "Marriage Mode" | The company rule is one brand, no spin-offs (`upfront-ai-team-cloud/master/MASTER-COMMAND-FILE.md` §4). | Shown as **"Marriage Mode by Upfront Consulting with Tiff & Reco LLC"** until you decide otherwise. Using ™ costs nothing; registering ® costs money (see Decisions). |

## What exists now (built 2026-11-15)

- `app/`: a working MVP. A landing page, a private self-audit that runs
  in the browser (nothing leaves the device), Cleanup Progress and Digital
  Organization scores, a Gmail search link, a share-a-summary card for
  Couple Mode, and a waitlist form.
- `supabase/migrations/0001_init.sql`: the full production schema (all
  16 required areas), with row-level security on every table.
- `docs/01` to `docs/15`: the 15 deliverables from the master document.

## Decisions only you can make

See `DECISIONS-NEEDED.md`. None of them block the MVP.

## Document index

| # | Document |
|---|---|
| 01 | [Product Requirements (PRD)](01-PRD.md) |
| 02 | [System Architecture](02-SYSTEM-ARCHITECTURE.md) |
| 03 | [Database Schema](03-DATABASE-SCHEMA.md) (SQL in `supabase/migrations/`) |
| 04 | [Founder Dashboard Design](04-FOUNDER-DASHBOARD.md) |
| 05 | [Command Center Design](05-COMMAND-CENTER.md) |
| 06 | [AI Chief of Staff Architecture](06-AI-CHIEF-OF-STAFF.md) |
| 07 | [12-Month Roadmap](07-ROADMAP.md) |
| 08 | [Investor Pitch Deck](08-PITCH-DECK.md) |
| 09 | [Marketing and Launch Strategy](09-MARKETING-LAUNCH.md) |
| 10 | [Development Backlog](10-BACKLOG.md) |
| 11 | [Wireframes](11-WIREFRAMES.md) |
| 12 | [MVP Build Plan](12-MVP-BUILD-PLAN.md) |
| 13 | [Production Build Plan](13-PRODUCTION-BUILD-PLAN.md) |
| 14 | [Monetization Plan](14-MONETIZATION.md) |
| 15 | [Enterprise Expansion Plan](15-ENTERPRISE.md) |
| — | [Trust and Safety](TRUST-AND-SAFETY.md) |
| — | [Decisions Needed](DECISIONS-NEEDED.md) |
