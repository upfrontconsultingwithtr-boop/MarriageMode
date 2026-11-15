# Design research: how the best comparable sites are built (Nov 2026)

Sources were mostly 2026 reviews and roundups; many are written by vendors
(marked). Findings are combined with design judgment and kept honest:
patterns only, no copying of any company's look or content.

## Who we studied
| Category | Companies | Why |
|---|---|---|
| Couples apps | Paired, Flamme, Between, Cupla, Connected | Same audience (committed couples) |
| Data-removal services | Incogni, DeleteMe, Optery | Closest product shape: "find accounts, remove them, show progress" |
| Best SaaS sites | Vercel, Clerk, Linear-style product sites | State of the art for landing pages |

## What they do well
1. **Status for every item (Incogni, Optery).** Dashboards show a completion
   percentage plus per-item badges such as Completed, In progress, Rejected, and
   update continuously instead of sending periodic reports. Optery adds proof of
   each removal. → Our dashboard: a status card per dating app (Not started, In
   progress, Closed) and a dated "proof" timeline.
2. **Small daily habits (Paired).** Daily questions, quizzes, gentle reminders
   and private sharing keep couples coming back. → A "next best step" card that
   always shows the one thing to do now; milestones; the private share card.
3. **Try it on the page (Vercel, Clerk).** The strongest 2026 sites replace
   "book a demo" with an interactive demo in the hero. → Our hero has a
   working mini-audit: tap apps, watch the score move.
4. **Linear flow for single products.** Reviewers note bento grids suit
   multi-product companies; single-product tools do better with a clear story
   built around the demo. → One story from top to bottom: problem → try it →
   how it works → privacy → questions → start.
5. **Restrained motion, dark mode with glass.** Common among high performers;
   motion should carry meaning (progress, completion), not decoration.
6. **Social proof near the top.** We have no customers yet, and we never invent
   any. → We use honest proof instead: facts you can check (29 apps, nothing
   uploaded, no account, free).

## Where competitors fall short (our opening)
- Couples apps focus on fun prompts; none help close the digital past.
- Data-removal services cost money and handle brokers, not dating accounts.
- Partner-monitoring apps exist and erode trust; Marriage Mode's
  self-led, consent-first stance is the difference, so it is said plainly.

## Decisions for the redesign
| Area | Decision |
|---|---|
| Hero | Live mini-audit with real scoring, halo graphic behind it |
| Trust | Checkable facts strip under the hero; privacy section with plain promises |
| Story | Problem cards → 3-step how it works → dashboard preview → privacy → FAQ → Couple Mode |
| FAQ | Native accordion (works without JavaScript, helps search) |
| Dashboard | App shell: progress rings, next best step, per-app status cards with progress bars, milestones, dated timeline, printable report, celebration at 100% |
| Mobile | Bottom tab bar in the dashboard; all tap targets 44px or larger |
| Motion | Only for progress and completion; off under "reduce motion" |

## Sources
- [Incogni review and dashboard (Gizmodo)](https://gizmodo.com/best-data-removal-service/incogni)
- [Optery vs. Incogni (Security.org)](https://www.security.org/data-removal/optery-vs-incogni/)
- [Best data removal services (Security.org)](https://www.security.org/data-removal/best)
- [Data removal benchmarks 2026 (OfflistMe, vendor)](https://www.offlist.me/blog/data-removal-service-benchmarks-2026)
- [7 best couple apps 2026 (Habi, vendor)](https://habi.app/insights/best-couple-apps/)
- [Best couples apps 2026 (Connected, vendor)](https://connectedcouples.app/blog/best-couples-apps-2026)
- [Best couples apps for iPhone 2026 (iOSHacker)](https://ioshacker.com/apps/best-couples-apps-for-iphone)
- [10 SaaS landing page trends 2026 (SaaSFrame)](https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples)
- [Landing page design trends (SaaSHero, vendor)](https://www.saashero.net/design/top-landing-page-design-trends/)
- [Bento grids and when not to use them (Pravin Kumar)](https://www.pravinkumar.co/blog/bento-grids-b2b-saas-homepage-design-trend-2026)
- [Best SaaS homepage examples 2026 (Veza Digital)](https://vezadigital.com/post/best-saas-homepage-design-examples)
