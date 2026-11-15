# Marriage Mode lead generation plan (free)

Marriage Mode by Upfront Consulting with Tiff & Reco LLC. Built 2026-11-15.
Rules: free tools only, truth only, no "catch/spy/track/cheater" wording, opt-in only.

## The engine
1. **Capture.** `/partners/` page: counselors, clergy, coaches and wedding pros sign up free
   and get their partner kit on screen at once (worksheet, engagement checklist,
   a ready message for couples). Leads land in `app.leads` (insert-only; only the
   service role can read). Claude pulls new leads into the hub each session.
2. **Attract.** 57 "delete / cancel [app]" guides (search), the home page value
   section, Spanish pages, weekly social posts through Metricool (approved in the hub).
3. **Reach out (2 a day, by hand, from Tiffany's Gmail).** The 3 drafts in Gmail
   (counselors, churches, wedding planners). Point every email at the partner page:
   https://upfrontconsultingwithtr-boop.github.io/MarriageMode/partners/
4. **Follow up.** Day 4: one short nudge. Day 10: last note. Then stop.
5. **Measure.** GoatCounter events: `partner-lead`, `audit-started`, `audit-complete`.

## Where to find partners (public, free)
| Source | Who | How |
|---|---|---|
| prepare-enrich.com/facilitator-finder | Certified premarital facilitators | Search your city, note practice website contact page |
| Local church websites | Pastors running premarital classes | Search "premarital class" + city |
| Wedding vendor directories (The Knot, WeddingWire) | Planners, officiants, venues | Business contact pages only |
| Therapist directories (e.g. Psychology Today) | Couples counselors | Use the practice's own contact form |
| Bridal shows and local wedding Facebook groups | Engaged couples, vendors | Post the free audit (follow each group's rules) |

Use only business contact details people publish for business. Never buy lists.
Business emails must include a mailing address and an easy opt-out (CAN-SPAM).

## Weekly rhythm (about 30 minutes)
- Mon: approve the week's post in the hub.
- Daily: send 2 partner emails, log replies in the hub.
- Fri: Claude reports new leads, partner sign-ups and audits in the hub.

## Targets for the 30-day test (to measure, not promises)
- 40 partner emails sent, 10 replies, 5 partner sign-ups.
- Each partner shares with at least 3 couples.

Test rows in `app.leads` with source `deploy-check` or name `Claude test` are Claude's own checks.
