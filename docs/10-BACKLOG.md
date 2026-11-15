# 10 · Development Backlog

Points: 1 = hours, 3 = a day, 5 = two to three days, 8 = a week.
Status: ✅ done · ▶ next · ○ later.

## Epic A · Free audit (MVP)
| ID | Story | Pts | Status |
|---|---|---|---|
| A1 | As a user I pick every dating platform I used from a searchable catalog | 3 | ✅ |
| A2 | I add a platform not in the catalog | 1 | ✅ |
| A3 | I get delete / cancel / remove / unsubscribe steps per platform with billing links | 3 | ✅ |
| A4 | I tick steps and see Cleanup Progress and Digital Organization Score | 3 | ✅ |
| A5 | My progress survives a reload, stored only on my device | 1 | ✅ |
| A6 | One tap searches my Gmail for dating senders; copyable query for other mail | 2 | ✅ |
| A7 | I copy or share a summary that names no apps | 2 | ✅ |
| A8 | Unit tests for steps and scores | 2 | ✅ |
| A9 | Landing page, waitlist (Netlify Forms), privacy and safety pages | 3 | ✅ |
| A10 | Per-platform SEO guide pages generated from the catalog | 5 | ✅ |
| A13 | Printable Digital Boundaries worksheet + counselor email | 3 | ✅ |
| A11 | Privacy-safe counts (GoatCounter: visits, audit started/half/complete, share, Gmail search, waitlist) | 2 | ✅ |
| A12 | Spanish translation | 5 | ○ |

## Epic B · Accounts and payments
| B1 | Supabase Auth: magic link, Google, Apple, passkeys | 5 | ▶ |
| B2 | Upload local audit to account on first sign-in (with consent) | 3 | ▶ |
| B3 | Stripe Checkout for Cleanup Pass; webhook writes `app.subscriptions` | 5 | ▶ |
| B4 | Customer Portal: cancel, invoices | 2 | ○ |
| B5 | Export my data (JSON) and delete my account | 3 | ▶ |

## Epic C · Discovery
| C1 | Takeout / Facebook data-file scanner in a Web Worker; never uploads | 8 | ○ |
| C2 | Catalog in `app.platforms`, monthly re-verify job | 3 | ○ |
| C3 | Gmail read-only header scan (after Google review) | 8 | ○ |
| C4 | Watch mode alerts for new dating signups | 5 | ○ |

## Epic D · Couple Mode
| D1 | Create invite link (hashed token, 7-day expiry) | 3 | ✅ (DB) |
| D2 | Accept invite on own signed-in device | 3 | ✅ (DB) |
| D3 | Pick items to share; partner view of shared items only (link edition, no server) | 5 | ✅ |
| D4 | Shared goals | 3 | ✅ |
| D5 | Instant unlink + quick-exit button | 2 | ✅ |
| D6 | Safety resources inside Couple Mode | 1 | ✅ |

## Epic E · Coach
| E1 | Written guidance library | 3 | ✅ (v0 in Talk & share) |
| E2 | ai-router Edge Function with cap + logging | 5 | ○ |
| E3 | Coach chat with safety prompt + red-team test set | 8 | ○ |

## Epic F · Command Center and AI Chief of Staff
| F1 | `ops` schema + RLS + tests | 5 | ✅ |
| F2 | Marriage Mode view in Command Center HQ (doc 04) | 5 | ○ |
| F3 | Docs ingestion → `knowledge_chunks` | 5 | ○ |
| F4 | Chief of Staff chat with memories | 8 | ○ |
| F5 | AI team: 7 custom agents in .claude/agents (done); weekly scheduled chief-of-staff run (later) | 3 | ✅ / ○ |

## Epic G · Platform
| G1 | GitHub Actions CI: typecheck, unit tests, build, RLS test | 3 | ✅ |
| G2 | Security headers (CSP, HSTS…) | 1 | ✅ |
| G3 | Supabase keep-alive workflow | 1 | ○ |
| G4 | Error monitoring (free tier) | 2 | ○ |

## Enterprise (H)
| H1 | Practitioner accounts, branded invite links | 8 | ○ |
| H2 | Organization admin, bulk invites | 8 | ○ |
| H3 | SSO (SAML) | 8 | ○ |
