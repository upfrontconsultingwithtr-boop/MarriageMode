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
| HubSpot, Canva, Monday.com, Metricool | CRM, design, boards, social scheduling | Connector | ✅ Connected |
| Supabase | Database for synced accounts | Secure key (personal access token) | ⏳ Waiting for key |
| GoatCounter (upfront-with-tr) | Visitor numbers | Secure key (API token), optional | Not yet |
| Payhip | Selling the Clean Slate Kit | Tiffany's sign-in (no Claude access) | Tiffany |
| Stripe | Not used (Payhip instead) | — | — |

Rule for every session: when a new service is needed, connect it by connector or
secure key (request_credential), add a row here, and put any sign-up Tiffany must
do in the hub as dummy steps.
