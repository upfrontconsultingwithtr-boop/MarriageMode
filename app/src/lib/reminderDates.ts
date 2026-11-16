// Pure: which days need a reminder. Dates only, never app names.
import type { AuditState } from './audit';

const DAY = 86400000;
const ymd = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// Follow-up day for each deletion request still waiting, plus the next monthly re-check.
export function dueDates(s: AuditState, now = Date.now()): string[] {
  const out = new Set<string>();
  for (const [app, sent] of Object.entries(s.requests ?? {})) if (sent && !s.replied?.[app]) out.add(ymd(Math.max(Date.parse(sent) + 30 * DAY, now)));
  const last = (s.recheckedAt ?? []).at(-1) ?? s.startedAt;
  if (last) out.add(ymd(Math.max(Date.parse(last) + 30 * DAY, now)));
  return [...out].sort().slice(0, 40);
}

