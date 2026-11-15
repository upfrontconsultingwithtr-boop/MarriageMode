// Privacy-friendly event counts (GoatCounter: no cookies, no personal data).
// Never pass app names, emails or anything a user typed.
type GC = { count?: (o: { path: string; title?: string; event: boolean }) => void };
const sent = new Set<string>();
export function track(event: string) {
  if (typeof window === 'undefined' || sent.has(event)) return;
  try { if (JSON.parse(localStorage.getItem('marriage-mode:prefs') || '{}').analytics === false) return; } catch { /* ignore */ }
  const gc = (window as unknown as { goatcounter?: GC }).goatcounter;
  if (!gc?.count) return;
  sent.add(event);
  try { gc.count({ path: event, title: event, event: true }); } catch { /* counting must never break the app */ }
}
