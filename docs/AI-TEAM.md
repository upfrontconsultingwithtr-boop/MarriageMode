# Marriage Mode AI team

Seven custom expert agents live in `.claude/agents/`. They run free on the
existing Claude plan and follow every rule in CLAUDE.md (truth only, no
spending, trust and safety, lean usage, the Hub).

| Agent | Role |
|---|---|
| chief-of-staff | Plans the week, picks the top 3 actions, delegates, updates HUB.md |
| product-engineer | Builds, fixes, tests and publishes the app, site and database |
| growth-marketer | Free growth: SEO, social scripts, counselor and partner outreach drafts |
| trust-safety-counsel | Reviews every feature and message for privacy, safety and compliance |
| finance-ops | Pricing, free-tier limits, costs, the money gate |
| customer-success | User and partner replies, FAQ, feedback into the backlog |
| insights-analyst | Real numbers, the 30-day test, research, investor updates |

**How to use:** in any Claude Code session on this repo, say for example
"have the growth-marketer write next week's posts" or "chief-of-staff, run the weekly cycle".

**Later (backlog F5):** a weekly scheduled chief-of-staff run, once there is
enough work and usage room for it.

## Extra free AI sources (on the list, not urgent)

The team runs on Claude today, which is enough. If more capacity is ever
needed, these have free tiers at the time of writing (check limits before
use; each needs a free sign-up by Tiffany and goes in HUB.md as dummy steps):

| Source | Free use | Good for |
|---|---|---|
| GitHub Actions | Free minutes on public repos | Scheduled jobs that need no AI: link checks, catalog checks, reports |
| Google AI Studio (Gemini API) | Free tier with rate limits | Drafting, summarizing, bulk content |
| Groq | Free tier with rate limits | Fast, cheap open-model tasks |
| Hugging Face | Free inference for many open models | Classification, embeddings for search |
| Ollama (on a home computer) | Free, runs open models locally | Private drafting, no limits beyond the computer |

Rule: no customer data goes to any of these; they help the team, never the
product's core (see CLAUDE.md "the product stands on its own").
