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
