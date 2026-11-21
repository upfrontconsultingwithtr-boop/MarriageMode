# Trust and Safety (binding product rules)

Marriage Mode deals with intimate relationships, where tools for "trust" can
become tools for control. These rules are what keep the product sellable,
allowed in the app stores and safe for users. Changing any of them is a
founder decision recorded in writing.

## The five hard rules

1. **Only your own accounts.** Every audit runs on the signed-in user's own
   accounts and devices, by that user. No feature takes input about another
   person's accounts.
2. **No surveillance data, ever.** No location, message content, call logs,
   screen time, browsing history, keystrokes or photos, on any plan.
3. **Sharing is opt-in, item by item.** In Couple Mode nothing is shared by
   default. The person who did the work picks what the partner sees.
4. **Leaving is instant.** Either partner can unlink at once. The other is told
   only "sharing ended", with no reason and no countdown.
5. **No covert mode.** The app never hides its icon, its notifications or itself.

## Couple Mode, link edition (live 2026-11-15)

The couple space lives in the link's #fragment, which browsers never send to
any server: no accounts, no database. Each card shows only what its owner
ticked (nothing by default). Either person stops by not sending updates and
removing it from their device; a Quick exit button leaves instantly. Limits,
stated on the page: anyone holding the link can read it, so it is sent only
to the partner. The synced-account version (database tables already built)
comes later.

## Web self-search (live 2026-11-15)

Users add their **own** usernames and emails; the dashboard builds web
searches that open in their own browser (free, nothing sent to us), and they
mark findings. Safeguards: a "these are mine" confirmation before anything can
be added; no phone-number web searches (people-search sites are data brokers
and a stalking risk); phone sign-ups are checked by logging in to each app,
which only the phone's owner can complete.

## Deletion requests (live 2026-11-15)

The app writes a formal privacy deletion request for each app the user picked;
the user sends it from their own email or the company's privacy form. The app
never asks for or stores dating-app passwords and never logs in on anyone's
behalf (that would break those apps' terms and put accounts at risk). Email
buttons are added only for privacy addresses confirmed on the company's own
site. A "done for you" authorized-agent service waits on legal review
(DECISIONS-NEEDED #12).

## Founder decision 2026-11-21: Marriage Mode Advanced (preview)

Recorded at Tiffany's written direction (build handoff, 2026-11-21, plus chat).
- **Partner disclaimer and required partner email.** The Sweep stays locked until a valid partner
  email is entered and the user ticks "I understand my results will go to my partner." Nothing is
  sent until the user sees the exact content and taps confirm; sharing is per-section and off by default.
- **Free Solo Search (exception to rule 1).** For someone whose partner will not join, Solo Search
  builds public searches (search engines, public social, dating and forum pages, username checkers,
  reverse photo look-up) from identifiers the user enters, including a partner's. Public only, opened
  in the user's own browser, nothing sent to us. It never uses breached or leaked data, never opens
  private accounts, never bypasses a login, and never links people-search / home-address data
  brokers (safety: someone may have moved away to be safe). Hotline shown on the tab.
- **Device sweep reads metadata only.** Calls and texts are read as who and when; message content
  is never read or stored.

## Customer portal (preview, 2026-11-21)

Marriage Mode customers sign in on a separate portal site (never the customer website): email +
password (10+ characters), email link, or Google. Security levels: 4 Company Admin Access (all;
the database refuses to remove the last one), 3 Manager, 2 Coach / Support (assigned customers
only), 1 Customer (own dashboard only); enforced by row-level security (migration 0014, tested in
`supabase/tests/rls_isolation.sql`). Cleanup tools and exports stay on the device. A customer's
dashboard reaches the team only if they tap "Share my results", and it holds numbers and to-dos only
(never exports, reviewed names or messages); "Stop sharing and remove" deletes it at once. Mia's AI
runs on the customer's own device (free); chats never leave it. Crisis numbers sit above the chat.

## Partner on file (Tiffany, 2026-11-21, migration 0015)

When the company already has a customer's partner email (today only the two founders), the intake
fills it in and the customer only ticks the acknowledgement. Paired partners can see each other's
shared dashboard (numbers and to-dos only). The founder pair has auto-share on, consistent with the
intake disclaimer "your results will go to your partner", and the dashboard says so plainly. Each
person can read only their own pairing row.

## Coercion safeguards

- Couple invites can be accepted only on the invitee's own signed-in device.
- A "Is someone pressuring you to use this?" link sits in Settings and in the
  coach, with the National Domestic Violence Hotline: 1-800-799-7233,
  text START to 88788, thehotline.org.
- A quick-exit button on every Couple Mode screen.
- The AI coach is told to watch for signs of coercion (demands for passwords,
  monitoring, threats) and to respond with safety resources, not compliance.

## Marketing rules

- Never use "catch a cheater", "spy", "track", "monitor your partner" or
  similar, in ads, SEO keywords, app store text or influencer briefs.
- Never imply the product proves faithfulness. It proves cleanup steps the
  user says they took.
- No fake testimonials or invented numbers (company rule: truth only).

## App store fit

Apple App Store Review Guideline 5.1 and Google Play's stalkerware and
user-data policies reject apps that collect data on someone else without
clear, ongoing consent. Rules 1–5 keep Marriage Mode clearly outside those
categories. Describe it in store listings as a "personal digital cleanup and
relationship goals" app.

## Data handling

- Free audit: stored only in the browser (localStorage). Clearing the browser
  removes it.
- Accounts: minimum data; export and full delete from Settings; deletion
  completes within 30 days, including backups.
- No sale of data, no ad networks, no data brokers.
- Third-party tokens (P2 integrations) encrypted with Supabase Vault and
  revocable from Settings.
