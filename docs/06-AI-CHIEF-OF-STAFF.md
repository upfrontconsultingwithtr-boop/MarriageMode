# 06 · AI Chief of Staff Architecture ("Marriage Mode AI")

## Goal

An executive team on call: answers questions about the company from its own
records, drafts plans and documents, and keeps memory in the database, not
in chat history.

## Components

```
 Founder / team ──► Command Center chat ──► Edge Function: ai-router
                                               │ 1. auth + org + permission (ai.use)
                                               │ 2. spend check vs ops.settings.ai_monthly_cap_usd
                                               │ 3. retrieve context (below)
                                               │ 4. pick model + call
                                               │ 5. log to ops.ai_messages (tokens, cost)
                                               ▼
                         Claude (primary)  ·  GPT (fallback)  ·  small model for cheap jobs
```

**Context assembly (RAG), per question:**
1. **Memories** (`ops.memories`): current decisions, goals and facts not
   superseded. Always included, so the AI never contradicts a decision.
2. **Knowledge** (`ops.knowledge_chunks`): top 8 chunks by vector similarity,
   filtered to documents the asker may read (same RLS as the UI).
3. **Live state**: open p0/p1 tasks, latest KPI snapshot, this week's risks.
4. **Agent persona** prompt (CEO advisor, CTO, CMO… as asked).

**Write-back:** when the founder states a decision ("we'll price Couple at
$14.99"), the AI proposes a `memories` row. It is saved only after a click
to confirm, and the older memory gets `superseded_by`. This gives the AI a
long-term memory with a clear record of who decided what.

**Ingestion:** a `catalog-sync`-style job embeds every changed document
(chunks of about 800 tokens, 100 overlap) into `knowledge_chunks`. The repo's
`docs/` folder is the first source.

## Agents (one router, several personas)

| Agent | Job | Runs |
|---|---|---|
| Chief of Staff | Daily brief: what changed, the top 3 actions, what needs the founder | Daily (folds into the LLC's Upfront Operator run) |
| Product | Turns feedback into backlog items with acceptance criteria | On request |
| Growth | Drafts posts, SEO pages and outreach; reads analytics | Weekly |
| Engineering | Reviews PRs, writes tests, triages bugs | On PR |
| Investor relations | Monthly update from real KPIs only | Monthly |

## Guardrails

- Truth only: answers cite the source document or table; if no source exists the AI says "no record" instead of guessing.
- No customer personal data in prompts: the ops AI sees aggregates, never `app.*` rows.
- Spend cap defaults to $0 (off). The founder sets the cap (Decisions #4).
- Actions that send, publish, pay or delete need a human click.

## Customer coach (separate)

Same router, separate persona and tables (`app.ai_chats`). It has a safety
system prompt: supportive, non-clinical, no diagnosis, escalates abuse signals
to the Hotline, never helps anyone monitor a partner. It sees audit data only
if `settings.coach_can_see_audit` is on.

## Costs (free first)

pgvector inside Supabase (free); embeddings with an open-source model run in
a GitHub Action (free) or a low-cost API after approval; chat calls are the
only real cost and are capped.
