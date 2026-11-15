// A short summary of the customer's social review, kept on this device, so Mia can
// go over the results with them (and their partner) in a coaching session.
export type ReviewSummary = { at: string; since?: string; flaggedFollows: number; removed: number; riskyInteractions: number; reasons: string[] };
const KEY = 'marriage-mode:review-summary';
export function saveReview(s: ReviewSummary) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* full */ } }
export function loadReview(): ReviewSummary | null { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } }
export function reviewContext(r: ReviewSummary | null): string {
  if (!r) return '';
  return `\n\nThis session is to go over their social media review (their own accounts, done by choice), possibly together with their partner. Summary: ${r.flaggedFollows} follows/friends flagged (${r.removed} already removed), ${r.riskyInteractions} interactions flagged since ${r.since ?? 'their relationship began'}. Main reasons: ${r.reasons.slice(0, 5).join('; ') || 'none'}. Guide a calm, blame-free conversation: thank them for their honesty, help the partner share how they feel, help them agree on digital boundaries going forward, and give a small assignment. Never shame either person.`;
}
