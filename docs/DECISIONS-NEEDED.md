# Decisions needed from the founder

Everything else moves forward without you. These need your yes because they
involve money, legal status, accounts or the brand rule. None blocks the MVP.

| # | Decision | Why | Cost | Recommendation |
|---|---|---|---|---|
| 1 | **Brand:** OK to show "Marriage Mode by Upfront Consulting with Tiff & Reco LLC"? | Company rule §4 says one brand, no new names. This keeps the LLC name on everything. | $0 | Yes. Revisit a separate brand after the test passes. |
| 2 | **Trademark ®** for "Marriage Mode" | Using ™ is free and needs no filing. Registering with the USPTO costs a filing fee per class. Run a free search at tmsearch.uspto.gov first: if someone already uses a similar name for apps, rename before spending anything. | USPTO fee per class (check uspto.gov for the current amount) | Search now (free). File only after the 30-day test passes. |
| 3 | **Domain** (e.g. marriagemode.app) | A free `.netlify.app` address works for the test. | About $10–$20 a year, depending on registrar | Wait for the test result. |
| 4 | **Paid AI for the coach** (Claude API) | Every coach conversation costs money per use. | Usage-based; set a monthly cap | Turn on after the first paying customers; cap at an amount you choose. |
| 5 | **Google restricted-scope review** for Gmail scanning | Required to read Gmail through the API; includes a yearly paid security assessment by an outside firm. | Hundreds to thousands of dollars a year (get a quote) | Not before $3k monthly revenue. The free Gmail search link covers the MVP. |
| 6 | **Apple Developer Program** (iPhone app) | Needed to publish in the App Store. | $99 a year | Not yet; the web app installs on phones for free. |
| 7 | **Google Play developer account** | Needed for the Play Store. | $25 one time | Not yet. |
| 8 | **Stripe account** | Needed to take payments. Stripe charges per transaction, no monthly fee. Signing up needs your identity check. | Per-transaction fees only | Open it when the waitlist passes 50. |
| 9 | **Privacy policy and terms review** by a lawyer | We drafted them; a relationship-data product should have a legal read. | Lawyer's fee | Before taking the first payment. |
| 10 | **Hosting** | **2026-11-15: moved to GitHub Pages** (free, no monthly limit for public repos) at https://upfrontconsultingwithtr-boop.github.io/MarriageMode/ via `.github/workflows/pages.yml`, because the Netlify free plan paused the project after its monthly limit. Earlier: Live at https://marriagemode.netlify.app from Tiffany's personal Netlify account (free plan), linked to this repo with a read-only deploy key; builds from branch `claude/nice-einstein-h76zzg` using the root `netlify.toml`. The empty `marriage-mode` project in the business Netlify team is unused. | $0 | Turn on form detection in that project (Project configuration → Forms) so waitlist signups are saved. |
| 11 | **AI Coach add-ons** (chat, couple sessions, voice, live video) | Founder wants them (2026-11-15). Each costs money per use or per minute from the AI provider. See docs/AI-COACH-PLAN.md. | Exact prices gathered before launch | Start with Coach chat under a small monthly cap you choose. |
