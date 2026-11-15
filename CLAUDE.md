# Marriage Mode: rules for every Claude session

Company-wide rules come from `upfront-ai-team-cloud/CLAUDE.md` (standing permission,
no spending without Tiffany's yes, truth only, never delete: archive).

- Product name is **"Marriage Mode"** (two words) in all customer-facing text,
  always with "by Upfront Consulting with Tiff & Reco LLC". Never "MarriageMode" in copy.
- `docs/TRUST-AND-SAFETY.md` is binding: self-led only, no surveillance features,
  opt-in sharing, instant unlink. Never use "catch/spy/track/cheater" wording.
- Every schema change ships as a new migration plus a passing `supabase/tests/rls_isolation.sql`.
- Paid steps go to `docs/DECISIONS-NEEDED.md` with the exact cost.

## Standing rule: lean usage, same quality (Tiffany, 2026-11-15)
- Use as few tokens and tool calls as the job allows: read only what's needed,
  batch commands, skip repeat checks, no long explanations or re-summaries.
- Replies to Tiffany: short, plain, step-by-step only when she must act.
- Never trade away quality to save usage: still test, verify live results and
  tell the truth about anything not done.

## Standing permission: decide and act for Tiffany (2026-11-15)
Do and decide everything on Tiffany's behalf without asking first: build, fix,
design, commit, push, publish to free hosts, keep records current. Pick the
best option and tell her what was done.
Only stop for: spending money (ask with the exact amount), legal signatures,
identity checks and account sign-ins, and steps Claude Code's own safety checks
block. For those, give her the shortest one-tap steps.

## Standing rule: the Hub (Tiffany, 2026-11-15)
`HUB.md` is Tiffany's hub. Every step she must do goes in its to-do list as
"dummy" instructions: one action per line, the exact link, the exact button
words, which account to use, and what to tell Claude when done. Remove a step
once it's done and add a line to the Done log. Send her the HUB link, not long chat steps.

## Standing rule: the product stands on its own (Tiffany, 2026-11-15)
Customers must never need Claude, an AI account, a paid app or any special
tool for Marriage Mode to work. Everything runs in a normal phone or computer
browser, free, with no sign-up for the core audit. Any future AI feature runs
on our side (capped, approved spend) and the product still works if it's off.
