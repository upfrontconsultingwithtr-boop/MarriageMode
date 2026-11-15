# 04 · Founder Dashboard Design

**Where it lives:** a "Marriage Mode" view inside the existing Command
Center HQ (`upfront-ai-team-cloud/command-center-web`), not a new app.
**Rule:** every number shows its source and "as of" time. A number with no
source shows "—", never an estimate.

## Layout (desktop; stacks to one column on phone)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Marriage Mode · Founder view                       as of Nov 15, 7:02 AM  ⟳  │
├──────────────┬──────────────┬──────────────┬──────────────┬──────────────────┤
│ MRR          │ Paying users │ Waitlist     │ Audits       │ Test status      │
│ $0           │ 0            │ —            │ started / done│ Day 1 of 30     │
│ Stripe       │ Stripe       │ Netlify Forms│ PostHog      │ pass = 50 signups│
├──────────────┴──────────────┴──────────────┴──────────────┴──────────────────┤
│ Funnel (last 30 days)                                                        │
│ Visitors ──► Audit started ──► Checklist ≥50% ──► Waitlist/Paid              │
├────────────────────────────────────┬─────────────────────────────────────────┤
│ Top 3 priorities this week         │ Risks (owner, next step)                │
│ 1. …  (owner · due)                │ ▲ App store policy  · Claude · monitor  │
│ 2. …                               │ ▲ Free-tier pause    · Claude · keepalive│
│ 3. …                               │                                         │
├────────────────────────────────────┼─────────────────────────────────────────┤
│ Product progress                   │ Needs you (one-tap)                     │
│ MVP ████████░░ 80%  Couple ░░ 0%   │ □ Trademark search result to review     │
│ Next release: v0.2 Takeout scanner │ □ Approve Stripe sign-up                │
├────────────────────────────────────┴─────────────────────────────────────────┤
│ AI Chief of Staff: "Ask about Marriage Mode…"                       [ Ask ] │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Widgets and data sources

| Widget | Source | Refresh |
|---|---|---|
| MRR, paying users, churn | Stripe → `ops.kpi_snapshots` (metric `mrr_usd`) | Stripe webhook + daily |
| Waitlist | Netlify Forms count → `kpi_snapshots` | Daily |
| Audits started/finished | PostHog events `audit_started`, `audit_50`, `audit_100` | Daily |
| Test status | `ventures/PIPELINE.md` pass/fail line | Weekly (Venture Builder) |
| Priorities, risks | `ops.tasks` where type in (task, risk), priority p0/p1 | Live |
| Product progress | `ops.projects` kind = release, % of tasks done | Live |
| Needs you | `ops.tasks` assigned to founder with label `needs-owner` | Live |

## Interaction rules

- Click any number to see the raw rows behind it.
- Red only for a real problem (risk overdue, metric dropped >20% week over week).
- Phone first: the five tiles and "Needs you" must fit above the fold on a 390px screen.
