// Honest scoring: a dating account is closed only when ALL 4 steps are done.
import { ACCT_STEPS, type Account, type AcctStep } from './store.ts';
import { PLATFORMS } from '../catalog.ts';

export type AcctStatus = 'open' | 'progress' | 'closed';
export const doneCount = (a: Account) => ACCT_STEPS.filter((k) => a.steps[k]).length;
export const status = (a: Account): AcctStatus => { const n = doneCount(a); return n === 4 ? 'closed' : n === 0 ? 'open' : 'progress'; };
export const remaining = (a: Account): AcctStep[] => ACCT_STEPS.filter((k) => !a.steps[k]);

/** Tick or untick a step; records the verified-closed date the moment all 4 are done, clears it if one is unticked. */
export function tick(a: Account, step: AcctStep, on: boolean, now = new Date()): Account {
  const n: Account = { ...a, steps: { ...a.steps, [step]: on } };
  if (status(n) === 'closed') n.closedAt = a.closedAt ?? now.toISOString(); else delete n.closedAt;
  return n;
}

/** Score 0-100 = share of accounts fully closed. Partial progress never counts. */
export function score(accts: Account[]): { score: number; closed: number; total: number; inProgress: number } {
  const total = accts.length; const closed = accts.filter((a) => status(a) === 'closed').length;
  const inProgress = accts.filter((a) => status(a) === 'progress').length;
  return { score: total ? Math.round((closed / total) * 100) : 0, closed, total, inProgress };
}

export function accountFor(id: string, source?: string, evidence?: string): Account {
  const p = PLATFORMS.find((x) => x.id === id);
  return { id, name: p?.name ?? id, steps: {}, source, evidence };
}
