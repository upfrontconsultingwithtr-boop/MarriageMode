# Marriage Mode accounts and how Claude connects (no passwords here, ever)

Claude never stores or asks for passwords. Each account is connected once:
a **connector** (signed in once in claude.ai) or a **secure key** (pasted once into
the Claude Code secure form; Claude never sees it; the environment's proxy adds it
to requests). Tiffany keeps her own passwords in the iPad Passwords app.

| Account | Used for | How Claude connects | Status |
|---|---|---|---|
| GitHub (upfrontconsultingwithtr-boop) | Code, site publishing (GitHub Pages) | Connector | ✅ Connected |
| Gmail (business) | Drafts for outreach, reading replies | Connector | ✅ Connected |
| Google Drive | Documents | Connector | ✅ Connected |
| Netlify | Old paused copy only | Connector (business team) | ✅ Connected (not used) |
| Metricool (brand: Upfront Consulting with Tiff & Reco, id 7491123) | Social posts: Facebook, Instagram, LinkedIn, TikTok, Bluesky, YouTube, Google Business Profile | Connector | ✅ Connected (correct account, 2026-11-15) |
| HubSpot, Canva, Monday.com | CRM, design, boards | Connector | ✅ Connected |
| Supabase (org: Upfront Businesses & Head Quarters) | Database for synced accounts: project `marriage-mode` (free); `cos-core` is the separate COS | Secure key (personal access token) | ✅ Connected; kept awake by .github/workflows/supabase-keepalive.yml |
| GoatCounter (upfront-with-tr) | Visitor numbers | Secure key (API token), optional | Not yet |
| Payhip | Selling the Clean Slate Kit | Tiffany's sign-in (no Claude access) | Tiffany |
| Stripe | Not used (Payhip instead) | — | — |

Rule for every session: when a new service is needed, connect it by connector or
secure key (request_credential), add a row here, and put any sign-up Tiffany must
do in the hub as dummy steps.
