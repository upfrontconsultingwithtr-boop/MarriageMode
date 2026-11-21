# Marriage Mode Advanced: return package (preview only, nothing live)

Built 2026-11-21 from "Marriage Mode: Claude Build Instructions" (Muse handoff) plus Tiffany's chat direction.
Marriage Mode by Upfront Consulting with Tiff & Reco LLC.

## 1. Preview link
Firebase preview channel (free, expires in 30 days, noindex). Exact URL is printed by the
"Marriage Mode Advanced - private preview" workflow run and recorded in HUB.md and the hub.
Pages: `/advanced/` (marketing page), `/advanced/app/` (the product), `/advanced/solo/` (free Solo Search).
The full existing site is included and unchanged; the live GitHub Pages site was not touched.

## 2. Files
- Logic: `app/src/lib/adv/` (store, accounts, learn, platforms, sweep, demo, queue, solo, mia, report, io)
- Screens: `app/src/app/advanced/` (Landing, Sims, Orbits, app/AdvApp, app/Sections, app/ui)
- Tests: `app/src/lib/advanced.test.ts` (acceptance tests 1-10)
- Preview publishing: `.github/workflows/advanced-preview.yml`

## 3. Acceptance checks (all run in a real browser on the built site, plus unit tests)
| # | Result | What was actually tested |
|---|---|---|
| 1 | Pass | Tinder: 1 step ticked shows "In progress", score unchanged; all 4 ticked shows "Closed · verified" + date, score rises. "clear" keeps Wipe disabled; CLEAR wipes; reload returns to fresh intake. |
| 2 | Pass | 6 lessons open, mark read; worksheet saves A and B separately, locks each, comparison highlights a deliberate difference. |
| 3 | Pass | Demo inbox finds exactly Tinder, Hinge, Bumble, OkCupid, each with an evidence line. Every flag shows why + source. Mom, dentist, coach, bank, aunt, friend, PTA stay unflagged. |
| 4 | Pass | Ex with 12 likes in 14 days, risque group, risque follow and past match all flag as Risque with pattern + source; family/friends flag nothing. |
| 5 | Pass | Single + mass select; "Add to queue" disabled until backup saved; batch shows exactly 5 with action, reason, deep link, Guided/Manual label; confirm completes those 5 then pauses; Undo/restore offered. |
| 6 | Pass | No email: locked. Invalid email: locked + error. Valid email, no tick: locked. Both: unlocked. Send flow shows partner email + exact content before the confirm tap. |
| 7 | Pass | Demo identifiers (email, username, phone, name+city, photo, other) produce 88 exact public searches; Found adds to Review with source "Solo Search"; Nothing found saves and adds nothing; no partner email asked. |
| 8 | Pass | Relationship + can-see shown (close friend: posts, stories, reels, full profile; Snapchat friend incl. location); most-access-first sort; Taylor Night (no access data) shows "Unknown - check in app" with a working profile link. |
| 9 | Pass | After closing Tinder, "What should I do next?" names the score, Tinder and gives one next step; Spanish replies in Spanish; AI-not-a-therapist + 911, 988, 1-800-799-7233 visible. |
| 10 | Pass | Verified-closed date in app and report; turning a section off removes it from the send and the shared download; "we both did it" shows only sections both shared; monthly re-check flags a reappearing app. |

## 4. Blocker list
- **Muse v2 preview (`marriage-mode-advanced`) and `marriage-mode-advanced-blueprint.pdf`:** not available to Claude. Built on the existing Marriage Mode code instead. Needed: share the blueprint PDF if anything in it should be added.
- **Mia hosted inference (Ruling 4):** the document says default to hosted for the preview, but hosted inference costs money and sends customer messages to an outside service. Built behind one switch; on-device is the default and fully works; hosted stays off. Needed: Tiffany's ruling + exact cost.
- **Simple footer:** the document asked for a minimal footer; Tiffany asked in chat to keep the existing site's style and functions, so the existing site footer is kept.
- **Real-export coverage:** real Instagram/Facebook/TikTok downloads are read for follows, friends, groups, likes, comments and messages (counts since 90 days ago). Story viewers, profile searches and post captions are read from the demo format; real-format parsers for those are a follow-up. Labelled honestly in the product (every flag shows its source).
- **Automated actions:** none are labelled Automated, because no platform lets an outside tool unfollow or delete in bulk. All social items are Guided; device and email items are Manual.

## 5. Rulings list (Tiffany's decisions, unchanged)
1 Approve the Social Sweep · 2 Submit-ready queue · 3 Risque wording · 4 Mia processing (hosted vs on-device) ·
5 Who the "human" is (currently links to the existing "Talk to a real counselor" page) · 6 Faith / values framing ·
7 Who reviews the Spanish · 8 Claude details · 9 Disclaimer wording · 10 Partner email required ·
11 Solo Search scope (built: all free public sources incl. reverse photo; excluded: people-search / home-address data brokers) ·
12 Access-level display + Pinterest vs Reddit (Reddit is in slot 9; one editable list in `app/src/lib/adv/platforms.ts`).

## 6. Client instruction sheet (also inside the product as the Start checklist)
1. Open Marriage Mode and complete the 1-minute intake, including the partner disclaimer and partner email.
2. Choose Human, AI, or Hybrid support.
3. Complete the 6 Learn topics and the boundaries worksheet.
4. Connect or export each platform, email, and device source, one at a time, following the on-screen export steps.
5. Run the Sweep, review every flag with its why and source, and check access levels.
6. Select individually or by mass select, confirm the backup, and work the submit-ready queue in batches of 5.
7. Verify proof, download the Clean Slate report, share the switched-on sections with your partner, and set the monthly re-check.
