# AI Relationship Coach: product plan (founder request 2026-11-15)

Tiffany asked for: an AI relationship coach and an AI "counselor" option;
sessions with couples by email, chat and phone; and a top-tier add-on where
the couple video-chats live with an AI that looks and sounds like a real
person and has expert, doctor-level knowledge.

## Guardrails (non-negotiable)
1. **Always clearly AI.** The coach can have a human-like face and voice, but every
   screen, call and video says it's an AI. It never claims to be a person.
2. **Coach, not therapist or doctor.** It never claims a license, degree or
   "doctor" title, never diagnoses, and never calls itself therapy. Some U.S.
   states restrict AI giving therapy or mental-health treatment (Illinois passed
   such a law in 2025, and others are following), and app stores and payment
   processors watch this closely. Name: "AI Relationship Coach". The words
   "counselor" and "therapist" are reserved for licensed humans.
3. **A real human when it matters.** Every tier offers a hand-off to licensed
   human counselors (the Practitioner network, doc 15). Crisis and abuse signals
   always lead to the Hotline (1-800-799-7233) and 911 first.
4. **Consent and privacy.** Couple sessions need both people to join themselves.
   No recording without both saying yes. Session notes stay private to the couple.
5. **It's an add-on.** The free audit and Couple Mode keep working without AI
   (CLAUDE.md: the product stands on its own).

## Tiers
| Tier | What | How it runs | Running cost |
|---|---|---|---|
| Coach chat | Text chat about communication, boundaries, trust | Claude API | Pay per use |
| Couple sessions | Guided 30-min sessions for both partners by chat or email | Claude API + scheduled emails | Pay per use |
| Voice sessions | Phone or in-app voice call with the coach | Voice AI service (speech in/out) | Per minute |
| Live video (top tier) | Live video with a lifelike, clearly-AI coach | Real-time avatar video service | Per minute, the highest |

## Money (founder decision, per CLAUDE.md)
None of these can run free: every AI chat, call minute and video minute is
billed by the provider. Before anything is switched on, Claude gets current
exact prices from each provider, sets each add-on's price above its cost, and
asks Tiffany to approve a monthly spending cap. Free parts available now: the
written coaching guides, and the conversation cards in the Clean Slate Kit.

## Build order
1. Coach chat (lowest cost, proves demand) → 2. Couple sessions → 3. Voice → 4. Live video.
