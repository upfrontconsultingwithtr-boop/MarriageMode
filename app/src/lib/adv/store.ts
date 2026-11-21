// Marriage Mode Advanced: all state lives on this device (localStorage). Nothing is uploaded.
import type { Flag } from './sweep.ts';
import type { QueueItem, Backup } from './queue.ts';
import type { Worksheet } from './learn.ts';

export type Stage = 'dating' | 'engaged' | 'newlywed' | 'married' | 'rebuilding';
export type Support = 'human' | 'ai' | 'hybrid';
export type Lang = 'en' | 'es';
export type AcctStep = 'delete' | 'billing' | 'app' | 'emails';
export const ACCT_STEPS: AcctStep[] = ['delete', 'billing', 'app', 'emails'];

export interface Intake { stage: Stage; lang: Lang; support: Support; partnerEmail: string; ack: boolean; ackAt?: string; name?: string }
export interface Account { id: string; name: string; steps: Partial<Record<AcctStep, boolean>>; closedAt?: string; source?: string; evidence?: string }
export interface SoloSearch { id: string; idType: string; value: string; site: string; url: string; result?: 'found' | 'none'; note?: string; link?: string; at?: string }
export interface Share { score: boolean; accounts: boolean; sweep: boolean; queue: boolean }
export interface SentLog { to: string; at: string; content: string }
export interface MiaMsg { role: 'user' | 'mia'; text: string; at: string }

export interface AdvState {
  v: 1;
  intake?: Intake;
  accounts: Account[];
  learnRead: Record<string, boolean>;
  worksheet: Worksheet;
  flags: Flag[];
  sources: string[];
  queue: QueueItem[];
  backups: Backup[];
  solo: SoloSearch[];
  share: Share;
  sent: SentLog[];
  mia: MiaMsg[];
  miaProvider: 'device' | 'hosted';
  lastCheck?: string;
  checklist: Record<string, boolean>;
  exes: string;
  matches: string[];
}

export const fresh = (): AdvState => ({ v: 1, accounts: [], learnRead: {}, worksheet: { a: {}, b: {} }, flags: [], sources: [], queue: [], backups: [], solo: [], share: { score: false, accounts: false, sweep: false, queue: false }, sent: [], mia: [], miaProvider: 'device', checklist: {}, exes: '', matches: [] });

export const KEY = 'mm-advanced-v1';
export const LANG_KEY = 'mm-advanced-lang';

export function load(): AdvState {
  try { const s = JSON.parse(localStorage.getItem(KEY) ?? 'null'); if (s?.v === 1) return { ...fresh(), ...s }; } catch { /* fresh */ }
  return fresh();
}
export function save(s: AdvState) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage full or blocked */ } }

/** Clear Data: the user must type CLEAR exactly. */
export const canWipe = (typed: string) => typed === 'CLEAR';
export function wipe(typed: string): boolean {
  if (!canWipe(typed)) return false;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  return true;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const validEmail = (e: string) => EMAIL_RE.test(e.trim());
/** The Sweep stays locked until a valid partner email AND the user's own acknowledgement tick. */
export function sweepLock(i?: Partial<Intake>): string[] {
  const why: string[] = [];
  if (!i?.partnerEmail?.trim()) why.push('email-missing');
  else if (!validEmail(i.partnerEmail)) why.push('email-invalid');
  if (!i?.ack) why.push('ack-missing');
  return why;
}
