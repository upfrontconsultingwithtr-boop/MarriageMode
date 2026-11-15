// Audit engine: pure functions, shared by the browser app and (later) the server.
import { PLATFORMS, type Platform } from './catalog.ts';

export type StepKind = 'delete_profile' | 'cancel_billing' | 'delete_app' | 'stop_emails' | 'social' | 'contacts';

export interface Step {
  id: string;
  kind: StepKind;
  platformId?: string;
  group?: string;            // platform name the step belongs to
  label: string;
  detail?: string;
}

export interface AuditState {
  platformIds: string[];
  custom: string[];          // platforms the user typed in
  done: Record<string, boolean>;
  doneAt?: Record<string, string>;   // ISO time each step was ticked (for the timeline)
  startedAt?: string;
}

export const EMPTY_STATE: AuditState = { platformIds: [], custom: [], done: {}, doneAt: {} };

export const GENERAL_STEPS: Step[] = [
  { id: 'g:contacts', kind: 'contacts', label: 'Review phone contacts saved from dating apps', detail: 'Delete or rename numbers you no longer need. Your call, your list.' },
  { id: 'g:threads', kind: 'social', label: 'Archive or delete old dating-related chat threads', detail: 'Text messages, WhatsApp, Instagram and Snapchat DMs.' },
  { id: 'g:follows', kind: 'social', label: 'Review follows, "close friends" and hidden lists', detail: 'Unfollow or mute anything that no longer fits the relationship you are building.' },
  { id: 'g:passwords', kind: 'social', label: 'Search your password manager for dating sites', detail: 'Saved logins reveal accounts you forgot. Close each one, then delete the saved login.' },
  { id: 'g:bank', kind: 'social', label: 'Check 3 months of card statements for dating charges', detail: 'Look for app store charges and names like the platforms above.' },
  { id: 'g:email2', kind: 'social', label: 'Check any second or old email addresses', detail: 'Run the email check below in every inbox you have used.' },
];

function platformById(id: string): Platform | undefined {
  return PLATFORMS.find((p) => p.id === id);
}

export function buildSteps(state: Pick<AuditState, 'platformIds' | 'custom'>): Step[] {
  const steps: Step[] = [];
  const add = (key: string, name: string, p?: Platform) => {
    steps.push({ id: `${key}:delete`, kind: 'delete_profile', platformId: p?.id, group: name, label: `Delete your ${name} account`, detail: p?.deletePath });
    if (!p || p.billing.length > 0)
      steps.push({ id: `${key}:billing`, kind: 'cancel_billing', platformId: p?.id, group: name, label: `Cancel any ${name} subscription`, detail: 'Deleting the app does not stop billing. Cancel it where you paid.' });
    if (!p || p.id !== 'fbdating')
      steps.push({ id: `${key}:app`, kind: 'delete_app', platformId: p?.id, group: name, label: `Remove the ${name} app from every device` });
    if (!p || p.emailDomains.length > 0)
      steps.push({ id: `${key}:email`, kind: 'stop_emails', platformId: p?.id, group: name, label: `Unsubscribe from ${name} emails`, detail: 'Open one email and use the unsubscribe link at the bottom.' });
  };
  for (const id of state.platformIds) {
    const p = platformById(id);
    if (p) add(p.id, p.name, p);
  }
  for (const name of state.custom) add(`custom-${slug(name)}`, name);
  return [...steps, ...GENERAL_STEPS];
}

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export interface Scores {
  progress: number;          // Cleanup Progress, 0–100
  organization: number;      // Digital Organization Score, 0–100
  doneCount: number;
  total: number;
  accountsClosed: number;
  accountsTotal: number;
}

// Weights from the PRD (TRU-2): accounts 50, billing 20, emails 15, social & contacts 15.
const WEIGHTS: { kinds: StepKind[]; w: number }[] = [
  { kinds: ['delete_profile', 'delete_app'], w: 50 },
  { kinds: ['cancel_billing'], w: 20 },
  { kinds: ['stop_emails'], w: 15 },
  { kinds: ['social', 'contacts'], w: 15 },
];

export function score(steps: Step[], done: Record<string, boolean>): Scores {
  const total = steps.length;
  const doneCount = steps.filter((s) => done[s.id]).length;
  let weighted = 0, weightUsed = 0;
  for (const { kinds, w } of WEIGHTS) {
    const group = steps.filter((s) => kinds.includes(s.kind));
    if (group.length === 0) continue;
    weightUsed += w;
    weighted += (w * group.filter((s) => done[s.id]).length) / group.length;
  }
  const accounts = steps.filter((s) => s.kind === 'delete_profile');
  return {
    progress: total ? Math.round((100 * doneCount) / total) : 0,
    organization: weightUsed ? Math.round((100 * weighted) / weightUsed) : 0,
    doneCount, total,
    accountsClosed: accounts.filter((s) => done[s.id]).length,
    accountsTotal: accounts.length,
  };
}

export function emailDomainsFor(platformIds: string[]): string[] {
  const chosen = platformIds.length ? platformIds.map(platformById).filter(Boolean) as Platform[] : PLATFORMS;
  return [...new Set(chosen.flatMap((p) => p.emailDomains))];
}

export function gmailQuery(domains: string[]): string {
  return `from:(${domains.join(' OR ')})`;
}

export function gmailSearchUrl(domains: string[]): string {
  return 'https://mail.google.com/mail/u/0/#search/' + encodeURIComponent(gmailQuery(domains));
}

export function shareSummary(s: Scores, date = new Date()): string {
  const d = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const lines = [`My Marriage Mode cleanup, as of ${d}:`];
  if (s.accountsTotal) lines.push(`• Closed ${s.accountsClosed} of ${s.accountsTotal} dating accounts`);
  lines.push(`• Finished ${s.doneCount} of ${s.total} cleanup steps (${s.progress}%)`);
  lines.push('I did this because our relationship matters to me. ❤');
  return lines.join('\n');
}
