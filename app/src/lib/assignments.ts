// Assignments Mia gives a couple, based on what they shared. Saved on this device.
export type Assignment = { id: string; text: string; topic: string; createdAt: string; doneAt?: string; sessionId?: string; sharedAt?: string };
const KEY = 'marriage-mode:assignments';
export function loadAssignments(): Assignment[] { try { return JSON.parse(localStorage.getItem(KEY) || '[]') as Assignment[]; } catch { return []; } }
function store(a: Assignment[]) { try { localStorage.setItem(KEY, JSON.stringify(a.slice(0, 100))); } catch { /* full */ } }
export function addAssignment(text: string, topic: string, sessionId?: string): Assignment | null {
  const t = text.trim().replace(/\s+/g, ' ').slice(0, 400); if (t.length < 12) return null;
  const all = loadAssignments(); if (all.some((a) => !a.doneAt && a.text === t)) return null;
  const a = { id: `a-${Date.now()}`, text: t, topic, createdAt: new Date().toISOString(), sessionId };
  store([a, ...all]); return a;
}
export function toggleAssignment(id: string) { store(loadAssignments().map((a) => (a.id === id ? { ...a, doneAt: a.doneAt ? undefined : new Date().toISOString() } : a))); }
export function markShared(id: string) { store(loadAssignments().map((a) => (a.id === id ? { ...a, sharedAt: new Date().toISOString() } : a))); }
export function removeAssignment(id: string) { store(loadAssignments().filter((a) => a.id !== id)); }
// The AI ends answers with "Your assignment: ..." (or "Tu tarea: ..."); pull that sentence out.
export function extractAssignment(reply: string): string | null {
  const m = reply.match(/(?:your assignment(?: this week)?|this week'?s assignment|tu tarea(?: de esta semana)?)\s*[:\-–]\s*([^\n]+)/i);
  return m ? m[1].trim() : null;
}
