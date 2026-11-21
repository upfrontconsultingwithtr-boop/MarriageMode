// Verified proof + the mutual partner report. Each partner shares ONLY the sections they switch on;
// nothing is sent without the user seeing the exact content and tapping confirm. There is no screen
// that shows a partner's unshared data, and no way to look at a partner without their own opt-in.
import type { AdvState, Share } from './store.ts';
import { status, score } from './accounts.ts';
import { CATEGORIES, CAT_LABEL, sweepInbox } from './sweep.ts';

export interface Report { name: string; date: string; score?: number; closed?: { name: string; closedAt: string }[]; sweep?: { category: string; flagged: number; cleared: number }[]; queue?: { done: number; total: number } }

export function buildReport(s: AdvState, share: Share | 'all', now = new Date()): Report {
  const on = (k: keyof Share) => share === 'all' || share[k];
  const r: Report = { name: s.intake?.name || 'Partner', date: now.toISOString().slice(0, 10) };
  if (on('score')) r.score = score(s.accounts).score;
  if (on('accounts')) r.closed = s.accounts.filter((a) => status(a) === 'closed').map((a) => ({ name: a.name, closedAt: (a.closedAt ?? '').slice(0, 10) }));
  if (on('sweep')) { const done = new Set(s.queue.filter((q) => q.state === 'done').map((q) => q.flagId)); r.sweep = CATEGORIES.map((c) => { const f = s.flags.filter((x) => x.category === c || (c === 'risque' && x.risque)); return { category: CAT_LABEL[c][0], flagged: f.length, cleared: f.filter((x) => done.has(x.id)).length }; }).filter((x) => x.flagged); }
  if (on('queue')) r.queue = { done: s.queue.filter((q) => q.state === 'done').length, total: s.queue.filter((q) => q.state !== 'undone').length };
  return r;
}

/** The exact text that will be sent: shown in full before the confirm tap. */
export function reportText(r: Report, es = false): string {
  const L: string[] = [es ? `Resumen Clean Slate de ${r.name} (${r.date}) · Marriage Mode` : `${r.name}'s Clean Slate summary (${r.date}) · Marriage Mode`];
  if (r.score !== undefined) L.push(es ? `Puntuación: ${r.score}/100` : `Score: ${r.score}/100`);
  if (r.closed) L.push(es ? `Cuentas cerradas y verificadas (4 de 4 pasos): ${r.closed.length ? r.closed.map((c) => `${c.name} (${c.closedAt})`).join(', ') : 'ninguna aún'}` : `Accounts verified closed (all 4 steps): ${r.closed.length ? r.closed.map((c) => `${c.name} (${c.closedAt})`).join(', ') : 'none yet'}`);
  if (r.sweep) L.push(es ? `Revisión: ${r.sweep.map((x) => `${x.category} ${x.cleared}/${x.flagged}`).join('; ') || 'sin elementos'}` : `Sweep (cleared/flagged): ${r.sweep.map((x) => `${x.category} ${x.cleared}/${x.flagged}`).join('; ') || 'nothing flagged'}`);
  if (r.queue) L.push(es ? `Cola completada: ${r.queue.done} de ${r.queue.total}` : `Queue completed: ${r.queue.done} of ${r.queue.total}`);
  if (L.length === 1) L.push(es ? '(No elegiste compartir ninguna sección.)' : '(You chose not to share any sections.)');
  return L.join('\n');
}

const b64 = (s: string) => { const b = new TextEncoder().encode(s); let x = ''; b.forEach((c) => (x += String.fromCharCode(c))); return btoa(x).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));
/** Shared report lives in the link's #fragment: browsers never send it to any server. */
export const encodeReport = (r: Report) => b64(JSON.stringify({ v: 1, ...r }));
export function decodeReport(hash: string): Report | null {
  try { const j = JSON.parse(unb64(hash.replace(/^#?p=/, '').replace(/^#/, ''))); if (j?.v !== 1) return null;
    return { name: String(j.name ?? '').slice(0, 40), date: String(j.date ?? '').slice(0, 10), score: typeof j.score === 'number' ? Math.max(0, Math.min(100, j.score)) : undefined,
      closed: Array.isArray(j.closed) ? j.closed.slice(0, 40).map((c: { name: string; closedAt: string }) => ({ name: String(c.name).slice(0, 40), closedAt: String(c.closedAt).slice(0, 10) })) : undefined,
      sweep: Array.isArray(j.sweep) ? j.sweep.slice(0, 12).map((x: { category: string; flagged: number; cleared: number }) => ({ category: String(x.category).slice(0, 30), flagged: +x.flagged || 0, cleared: +x.cleared || 0 })) : undefined,
      queue: j.queue ? { done: +j.queue.done || 0, total: +j.queue.total || 0 } : undefined };
  } catch { return null; }
}

/** "We both did it": only sections BOTH partners chose to share appear side by side. */
export function bothView(mine: Report, theirs: Report) {
  const rows: { key: string; me: string; them: string }[] = [];
  if (mine.score !== undefined && theirs.score !== undefined) rows.push({ key: 'Score', me: `${mine.score}/100`, them: `${theirs.score}/100` });
  if (mine.closed && theirs.closed) rows.push({ key: 'Accounts closed', me: String(mine.closed.length), them: String(theirs.closed.length) });
  if (mine.sweep && theirs.sweep) rows.push({ key: 'Sweep cleared', me: `${mine.sweep.reduce((a, x) => a + x.cleared, 0)}/${mine.sweep.reduce((a, x) => a + x.flagged, 0)}`, them: `${theirs.sweep.reduce((a, x) => a + x.cleared, 0)}/${theirs.sweep.reduce((a, x) => a + x.flagged, 0)}` });
  if (mine.queue && theirs.queue) rows.push({ key: 'Queue done', me: `${mine.queue.done}/${mine.queue.total}`, them: `${theirs.queue.done}/${theirs.queue.total}` });
  const todo: string[] = [];
  if (theirs.closed && mine.closed && theirs.closed.length > mine.closed.length) todo.push(`${theirs.name} has closed ${theirs.closed.length} accounts: your turn to close yours.`);
  if (theirs.queue && mine.queue && theirs.queue.done > mine.queue.done) todo.push(`${theirs.name} has completed ${theirs.queue.done} queue items: your turn to work your queue.`);
  return { rows, todo };
}

/** Monthly re-check: next date = 30 days after the last check (or after the first verified close). */
export function nextRecheck(s: AdvState): string {
  const base = s.lastCheck ?? s.accounts.map((a) => a.closedAt).filter(Boolean).sort()[0];
  const d = base ? new Date(Date.parse(base) + 30 * 86400e3) : new Date(Date.now() + 30 * 86400e3);
  return d.toISOString().slice(0, 10);
}
/** Re-runs discovery against the closed list: anything closed that shows up again is flagged. */
export function recheck(s: AdvState, inboxText: string, file = 'new export'): { reappeared: { id: string; name: string; evidence: string }[] } {
  const r = sweepInbox({ file, text: inboxText }); const closed = s.accounts.filter((a) => status(a) === 'closed');
  return { reappeared: closed.filter((a) => r.hits.some((h) => h.platformId === a.id)).map((a) => ({ id: a.id, name: a.name, evidence: r.evidence[a.id] ?? '' })) };
}
