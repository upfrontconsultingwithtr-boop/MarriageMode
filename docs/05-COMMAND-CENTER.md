# 05 · Marriage Mode Command Center Design

## Decision: extend, don't rebuild

The master document asks for one platform that replaces Notion, ClickUp
and Monday. The LLC already has:

- **Command Center HQ** (Firebase), the owners' daily view.
- **COS** (Supabase `cos-core`), the CRM with organizations, roles, events and RLS.
- **Monday.com, HubSpot, Google Drive** connectors in Claude sessions.

Building a fourth tool would take months and earn nothing. The Command
Center is therefore **a set of views over the `ops` schema** (doc 03), shown
inside Command Center HQ, with Claude doing the data entry. Moving the
`ops` tables into `cos-core` later is a straight copy because both use
`org_id` + RLS.

## Modules

| Module | What it shows | Built from | Phase |
|---|---|---|---|
| Founder Dashboard | Doc 04 | `kpi_snapshots`, `tasks` | MVP |
| Operations Center | Teams, tasks board (Backlog → Done), SOP library, research notes | `teams`, `tasks`, `documents(kind=sop/research)` | P1 |
| Development Hub | Features, bugs, sprints, releases, milestones | `projects(kind=sprint/release)`, `tasks(type=feature/bug)`; GitHub issues sync | P1 |
| Marketing Command Center | Content calendar, campaigns, SEO keywords, referral stats, launch checklist | `projects(kind=marketing)`, `tasks`, Metricool + HubSpot connectors | P1 |
| Investor Center | KPI history, forecast vs actual, investor updates (monthly) | `kpi_snapshots`, `documents(kind=…)`; investor role = `kpi.read` only | P2 |
| Knowledge Hub | Search every doc, decision and memory | `documents`, `knowledge_chunks`, `memories` | P1 |
| AI Chief of Staff | Chat + daily brief | Doc 06 | P1 |

## Roles (default permissions, editable per org)

| Role | Permissions |
|---|---|
| Founder | `*` |
| Admin | members.manage, roles.manage, team.manage, integrations.manage, audit.read, billing.manage, + all write |
| Executive | projects/tasks/docs/messages write, docs.executive, kpi.read, ai.use, memory.write |
| Developer | tasks.write, messages.write, docs.write, ai.use |
| Marketing | projects.write, tasks.write, messages.write, docs.write, ai.use |
| Support | tasks.write, messages.write, ai.use |
| Advisor | kpi.read, ai.use (read everything at org visibility) |
| Investor | kpi.read only |

## Screens (wireframes in doc 11)

1. Home = Founder Dashboard. 2. Board (tasks, filter by team/project/type).
3. Docs (tree + search). 4. Releases timeline. 5. Marketing calendar.
6. Investor (read-only KPIs and updates). 7. Settings (members, roles, integrations, AI cap).
