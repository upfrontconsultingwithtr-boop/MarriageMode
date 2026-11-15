// Coaching session transcripts, saved on the customer's own device so they can look back.
export type CoachMsg = { role: 'user' | 'assistant'; content: string };
export type Session = { id: string; startedAt: string; updatedAt: string; mode: 'ai' | 'lite'; lang: 'en' | 'es'; msgs: CoachMsg[]; format?: 'text' | 'voice' | 'video'; parts?: { key: string; kind: 'video' | 'voice'; mime: string; at: string }[] };
const KEY = 'marriage-mode:coach-sessions';

export function loadSessions(): Session[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as Session[]; } catch { return []; }
}
export function saveSession(s: Session) {
  if (s.msgs.filter((m) => m.role === 'user').length === 0) return; // nothing said yet
  const all = loadSessions().filter((x) => x.id !== s.id);
  all.unshift({ ...s, updatedAt: new Date().toISOString() });
  try { localStorage.setItem(KEY, JSON.stringify(all.slice(0, 60))); } catch { /* storage full */ }
}
export function deleteSession(id: string) {
  const s = loadSessions().find((x) => x.id === id);
  if (s?.parts?.length) void import('./recorder').then((r) => s.parts!.forEach((p) => r.delBlob(p.key)));
  try { localStorage.setItem(KEY, JSON.stringify(loadSessions().filter((x) => x.id !== id))); } catch { /* none */ }
}
export function transcriptText(s: Session): string {
  const d = new Date(s.startedAt).toLocaleString();
  return [`Marriage Mode coaching session with Mia (AI coach) · ${d}`, '', ...s.msgs.map((m) => `${m.role === 'user' ? 'You' : 'Mia'}: ${m.content}`), '', 'Marriage Mode by Upfront Consulting with Tiff & Reco LLC. Mia is an AI, not a counselor.'].join('\n');
}
