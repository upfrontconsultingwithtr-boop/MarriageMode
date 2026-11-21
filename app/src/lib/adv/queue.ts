// Review → backup → submit-ready queue. Nothing is removed silently: the user taps Submit/Confirm
// on the platform's own screen. Batches of 5 with a pause, pause/resume, undo steps.
import type { Flag, Category } from './sweep.ts';
import { SOCIAL, type SocialId } from './platforms.ts';

export type Action = 'unfollow' | 'remove follower' | 'unlike' | 'leave group' | 'delete' | 'block' | 'mute';
export type Mode = 'Automated' | 'Guided' | 'Manual';
export interface Backup { id: string; flagId: string; who: string; platform: string; category: Category; reason: string; date: string }
export interface QueueItem { id: string; flagId: string; who: string; platform: string; action: Action; reason: string; link: string; confirmText: string; mode: Mode; backupId: string; state: 'queued' | 'done' | 'undone'; doneAt?: string; undo: string; batch?: number }

export const BATCH = 5;
export const PAUSE_MS = 4000;

export function actionFor(f: Flag): Action {
  if (f.category === 'posts') return 'delete';
  if (f.category === 'reactions') return 'unlike';
  if (f.category === 'followers') return 'remove follower';
  if (f.category === 'contacts' || f.category === 'calls' || f.category === 'texts') return 'block';
  if (f.category === 'viewers') return 'block';
  if (f.category === 'email') return 'delete';
  if (/group|página|page/i.test(f.evidence) && f.category !== 'friends') return 'leave group';
  if (f.category === 'interactions') return 'mute';
  return 'unfollow';
}
/** Honest labels: no platform lets a third-party tool bulk-unfollow, so nothing social is Automated. */
export function modeFor(f: Flag): Mode {
  if (f.platform === 'device' || f.platform === 'email') return 'Manual';
  if (f.platform === 'solo') return 'Manual';
  return 'Guided';
}
function linkFor(f: Flag, a: Action): string {
  if (f.platform === 'email') return 'https://mail.google.com/mail/u/0/#search/' + encodeURIComponent(f.who);
  if (f.platform === 'device' || f.platform === 'solo') return f.link ?? '';
  const s = SOCIAL[f.platform as SocialId]; if (!s) return f.link ?? '';
  if (a === 'unfollow' || a === 'remove follower' || a === 'block' || a === 'mute') return f.link ?? s.screens.unfollow; // the person's own profile: the button is on that screen
  if (a === 'leave group') return s.screens.groups;
  if (a === 'unlike' || a === 'delete') return s.screens.activity;
  return f.link ?? s.screens.unfollow;
}
const CONFIRM: Record<Action, string> = { unfollow: 'Unfollow', 'remove follower': 'Remove', unlike: 'Unlike', 'leave group': 'Leave group', delete: 'Delete', block: 'Block', mute: 'Mute' };
const UNDO: Record<Action, string> = { unfollow: 'Open their profile and tap Follow again.', 'remove follower': 'They can follow you again; you cannot re-add them yourself.', unlike: 'Open the post and tap Like again.', 'leave group': 'Search the group and tap Join (private groups need approval).', delete: 'Most platforms keep deleted posts in “Recently deleted” for 30 days: restore it there.', block: 'Settings → Blocked → Unblock.', mute: 'Open their profile → Muted → turn off.' };

export function backupOf(f: Flag, now = new Date()): Backup { return { id: `b-${f.id}`, flagId: f.id, who: f.who, platform: f.platform, category: f.category, reason: f.why, date: now.toISOString() }; }

/** Adds selected flags to the queue. Refuses any flag without a saved backup record. */
export function enqueue(queue: QueueItem[], backups: Backup[], flags: Flag[]): { queue: QueueItem[]; refused: string[] } {
  const refused: string[] = []; const q = [...queue];
  for (const f of flags) {
    const b = backups.find((x) => x.flagId === f.id); if (!b) { refused.push(f.id); continue; }
    if (q.some((x) => x.flagId === f.id && x.state === 'queued')) continue;
    const action = actionFor(f); const plat = f.platform === 'device' ? 'your phone' : f.platform === 'email' ? 'your email' : SOCIAL[f.platform as SocialId]?.name ?? f.platform;
    q.push({ id: `q-${f.id}`, flagId: f.id, who: f.who, platform: plat, action, reason: f.why, link: linkFor(f, action), confirmText: `${plat} will ask: “${CONFIRM[action]}?” Tap ${CONFIRM[action]} to finish.`, mode: modeFor(f), backupId: b.id, state: 'queued', undo: UNDO[action] });
  }
  return { queue: q, refused };
}
/** The next batch: at most 5 queued items. */
export const nextBatch = (q: QueueItem[]) => q.filter((x) => x.state === 'queued').slice(0, BATCH);
/** Confirm a batch after the user tapped Submit on each platform screen. Only these items change. */
export function confirmBatch(q: QueueItem[], ids: string[], batchNo: number, now = new Date()): QueueItem[] {
  const set = new Set(ids.slice(0, BATCH));
  return q.map((x) => (set.has(x.id) && x.state === 'queued' ? { ...x, state: 'done', doneAt: now.toISOString(), batch: batchNo } : x));
}
export const undoItem = (q: QueueItem[], id: string): QueueItem[] => q.map((x) => (x.id === id && x.state === 'done' ? { ...x, state: 'undone' } : x));
