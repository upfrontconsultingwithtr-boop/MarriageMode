// Browser-side readers for the user's own files. Everything runs on this device; nothing is uploaded.
import { readExport } from '../follows.ts';
import { scanInteractions } from '../interactions.ts';
import { scanFile } from '../scan.ts';
import { PLATFORMS } from '../catalog.ts';
import { sweepInbox, sweepSocial, sweepDevice, parseDemoSocial, parseDevice, relOf, canSeeOf, type Flag, type Known } from './sweep.ts';
import { SOCIAL, type SocialId } from './platforms.ts';

export type Kind = 'social' | 'inbox' | 'device';
export interface SweepResult { flags: Flag[]; dating: { id: string; name: string; evidence: string }[]; matches: string[]; note?: string }

/** Inbox / billing export: auto-discovers dating accounts (with the evidence line) and past matches. */
export async function readInbox(name: string, text: string | null, file?: File, onP: (m: string) => void = () => {}): Promise<SweepResult> {
  if (text !== null) { const r = sweepInbox({ file: name, text }); return { flags: r.flags, dating: r.hits.map((h) => ({ id: h.platformId, name: h.name, evidence: r.evidence[h.platformId] })), matches: r.matches }; }
  const hits = await scanFile(file!, onP); // .zip downloads: name matches only
  return { flags: [], dating: hits.map((h) => ({ id: h.platformId, name: h.name, evidence: `${h.count} mentions in ${h.files.join(', ')}` })), matches: [] };
}

export async function readSocial(name: string, text: string | null, file: File | undefined, k: Known, onP: (m: string) => void = () => {}): Promise<SweepResult> {
  if (text !== null && text.includes('"marriage-mode-demo-social"')) return { flags: parseDemoSocial(text, name).flatMap((d) => sweepSocial(d, k)), dating: [], matches: [] };
  if (!file) throw new Error('unsupported');
  const raw: { path: string; text: string }[] = [];
  const accts = await readExport(file, onP, raw);
  const byPlat = new Map<SocialId, ReturnType<typeof toPeople>>();
  function toPeople() { return { people: [] as Parameters<typeof sweepSocial>[0]['people'], groups: [] as { name: string; kind: 'group' | 'page' | 'follow' }[] }; }
  for (const a of accts) {
    const pid = (a.platform === 'other' ? 'facebook' : a.platform) as SocialId; if (!SOCIAL[pid]) continue;
    const b = byPlat.get(pid) ?? toPeople(); byPlat.set(pid, b);
    if (a.kind === 'group') { b.groups.push({ name: a.handle, kind: 'group' }); continue; }
    const ex = b.people.find((p) => p.handle === a.handle) ?? { handle: a.handle, likes: [], comments: [], dms: [], views: [], storyViews: [] };
    if (!b.people.includes(ex)) b.people.push(ex);
    if (a.youFollow || a.kind === 'you follow') ex.youFollow = true; if (a.followsYou || a.kind === 'follows you') ex.followsYou = true;
    if (a.closeFriend || a.kind === 'close friend') ex.closeFriend = true; if (a.friend || a.kind === 'friend') ex.friend = true;
    b.groups.push({ name: a.handle, kind: 'follow' });
  }
  const flags: Flag[] = [];
  for (const [platform, b] of byPlat) flags.push(...sweepSocial({ platform, file: name, people: b.people, groups: b.groups, posts: [] }, k));
  // Interactions from the same download: counts since 90 days ago, with the export's own reasons.
  const since = Date.now() - 90 * 86400e3; const known = new Set<string>();
  for (const p of scanInteractions(raw, since, known)) if (p.reasons.length) {
    const plat = (raw.find((r) => /instagram|your_instagram/i.test(r.path)) ? 'instagram' : 'facebook') as SocialId;
    const rel = relOf(byPlat.get(plat)?.people.find((x) => x.handle.toLowerCase() === p.key) ?? { handle: p.who, likes: [], comments: [], dms: [], views: [], storyViews: [] });
    flags.push({ id: `ri-${p.key}`, who: p.who, handle: p.who, platform: plat, category: p.likes + p.stories > p.comments.length + p.messages ? 'reactions' : 'interactions', risque: true,
      why: `Since ${new Date(since).toISOString().slice(0, 10)}: ${p.reasons.join('; ')}.`, whyEs: `Desde ${new Date(since).toISOString().slice(0, 10)}: ${p.reasons.join('; ')}.`,
      source: `${SOCIAL[plat].name} export (${name})`, evidence: `${p.likes} likes, ${p.stories} story likes, ${p.comments.length} comments, ${p.messages} messages from you${p.flirty[0] ? `; e.g. “${p.flirty[0].slice(0, 60)}”` : ''}`,
      access: { rel, canSee: canSeeOf(plat, rel, undefined) }, link: SOCIAL[plat].profile(p.who) });
  }
  return { flags, dating: [], matches: [], note: accts.length ? undefined : 'No follow or friend lists were found in this file.' };
}

export function readDevice(name: string, text: string, k: Known): SweepResult { return { flags: sweepDevice(parseDevice(text, name), k), dating: [], matches: [] }; }

export const datingName = (id: string) => PLATFORMS.find((p) => p.id === id)?.name ?? id;
