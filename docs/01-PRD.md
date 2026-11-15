# 01 · Product Requirements Document (PRD)

**Product:** Marriage Mode, by Upfront Consulting with Tiff & Reco LLC
**Version:** 1.0 · 2026-11-15 · **Owner:** Founder

## 1. Problem

When people commit to one partner (exclusive, engaged, married), their
digital life often doesn't change with them. Old dating profiles stay live
and keep showing up in searches. Dating subscriptions keep billing. Match and
"someone liked you" emails keep arriving. Old flirtations stay one tap away.
Each one is a small trust risk, and when a partner finds one it can start a
painful conversation. Nobody offers a simple, private way to close this
chapter completely.

Public context (verify before investor use): Pew Research Center (2023) found
3 in 10 U.S. adults have used a dating site or app. The CDC counted about
2.07 million U.S. marriages in 2022.

## 2. Who it's for

| Persona | Situation | Job to be done |
|---|---|---|
| **The Committer** (primary) | Just became exclusive or engaged; 25–40; used 2–5 dating apps | "Close my dating chapter completely so nothing old surprises us." |
| **The Couple** | Engaged or newly married, want shared goals | "Show each other we've both done it, without checking each other's phones." |
| **The Rebuilder** | Rebuilding trust after a breach, often with a counselor | "Give my partner proof I've cleaned up, on my terms." |
| **The Professional** (B2B) | Premarital counselor, pastor, relationship coach | "Give my couples a structured digital-boundaries exercise." |

**Not for:** watching a partner, checking someone else's accounts, or any
use without the account owner's own participation. See `TRUST-AND-SAFETY.md`.

## 3. Product principles

1. **Self-led.** You audit your own life. We never audit someone else.
2. **Private by default.** Free audits run on the device. Nothing is uploaded
   unless the user creates an account and chooses to sync.
3. **Proof, not surveillance.** A partner gets the summary you choose to share.
4. **Honest about limits.** We guide steps we can't automate and never claim a
   deletion we can't confirm.
5. **Kind tone.** No shame, no "cheater" language.

## 4. Features and requirements

Priority: **P0** = MVP, **P1** = Production v1, **P2** = later.

### 4.1 Digital Relationship Audit
| ID | Requirement | Pri |
|---|---|---|
| AUD-1 | Pick every dating platform ever used from a searchable catalog (30+ at launch, updated monthly; users can add any platform by name). | P0 |
| AUD-2 | For each platform, show cleanup steps: delete profile, cancel billing (App Store, Google Play, web), delete the app, stop emails, request data deletion. | P0 |
| AUD-3 | Email check: one tap opens the user's own Gmail search for mail from known dating senders. Copyable search text for Outlook and Yahoo. | P0 |
| AUD-4 | Social and contacts checklist: old matches in contacts, DM threads, "close friends" lists, follows the user chooses to review. | P0 |
| AUD-5 | Upload a data-download file (Google Takeout, Facebook "Download your information") and scan it **in the browser** for dating-related signups. | P1 |
| AUD-6 | Gmail API read-only scan of sender headers, once the Google restricted-scope review is passed (see Decisions). | P2 |
| AUD-7 | Watch mode: a weekly reminder to re-check; on P2, alerts when a new dating signup email arrives. | P1/P2 |

### 4.2 Dating App Discovery
| ID | Requirement | Pri |
|---|---|---|
| DIS-1 | Catalog fields: name, category, web domain, email sender domains, in-app delete path, billing channels, last verified date. | P0 |
| DIS-2 | Catalog stored as data, not code, so new platforms ship without an app release. | P0 |
| DIS-3 | "Did I ever sign up?" helper: email-search queries plus password-manager tip (search the saved logins list). | P0 |
| DIS-4 | Monthly catalog review job; steps older than 90 days marked "re-verify". | P1 |

### 4.3 Trust Dashboard
| ID | Requirement | Pri |
|---|---|---|
| TRU-1 | **Cleanup Progress**: finished steps ÷ total steps. | P0 |
| TRU-2 | **Digital Organization Score** (0–100): weighted by platforms closed (50), billing cancelled (20), emails stopped (15), social checklist done (15). | P0 |
| TRU-3 | **Relationship Readiness reflection**: a private questionnaire on boundaries and goals. Shown as reflection notes, never as a grade of the person. | P1 |
| TRU-4 | Activity timeline of the user's own cleanup actions. | P1 |

Language rule: scores describe the cleanup, never the person's worth or
faithfulness.

### 4.4 Relationship Cleanup Center
| ID | Requirement | Pri |
|---|---|---|
| CLN-1 | Step-by-step checklists with deep links to the right settings pages. | P0 |
| CLN-2 | Archive, block and unfollow guidance per platform (user acts in the platform). | P0 |
| CLN-3 | Automated actions only via approved, documented provider APIs with explicit per-action consent; every action logged. | P2 |

### 4.5 AI Relationship Coach
| ID | Requirement | Pri |
|---|---|---|
| COA-1 | Written guidance: how to talk about digital boundaries, scripts for "I closed my accounts" conversations. | P0 |
| COA-2 | Conversational coach (Claude) with a safety policy: supportive, non-clinical, refers to licensed help and to the Hotline for abuse signals. | P1 (needs AI spend approval) |
| COA-3 | Coach never sees cleanup data unless the user turns that on. | P1 |

### 4.6 Couple Mode
| ID | Requirement | Pri |
|---|---|---|
| CPL-1 | Share card: user builds a summary ("I closed 5 of 5 dating accounts on Nov 15") and shares it however they want. No account needed. | P0 |
| CPL-2 | Linked couple space: both accept an invite; shared goals and a shared checklist. | P1 |
| CPL-3 | Each person controls exactly what is shared, item by item; default is nothing. | P1 |
| CPL-4 | Either person can unlink instantly with no notice period; unlink ends all sharing. | P1 |
| CPL-5 | No location, message content, screen time or browsing data ever, in any plan. | P0 (rule) |

## 5. Non-functional requirements

- **Security:** OAuth, passkeys and magic links through Supabase Auth; no
  passwords stored by us; row-level security on every table; encryption in
  transit (TLS) and at rest; tokens for third-party APIs encrypted in the
  database vault. See `02-SYSTEM-ARCHITECTURE.md` §6.
- **Privacy:** data minimization; the free audit stores data only in the
  browser; one-tap export and delete account; no selling or sharing data,
  no ad trackers. Analytics are counts of events, never content.
- **Accessibility:** WCAG 2.2 AA; works on a 360px-wide phone.
- **Performance:** first page under 2 seconds on 4G.
- **Reliability:** 99.5% uptime target for paid features.

## 6. Success metrics

| Stage | North-star and key metrics |
|---|---|
| MVP test (30 days) | **Pass if:** 200 visitors start an audit and 50 join the waitlist, from free channels only. Fail if under 15 waitlist signups. |
| Launch | Audit completion rate ≥ 40%; free → paid ≥ 4%; 30-day paid retention ≥ 70% |
| Year 1 | North star: **completed cleanups per month** |

## 7. Out of scope (permanently)

Monitoring another person, reading another person's messages, location
tracking, covert install, "catch a cheater" features or marketing.
