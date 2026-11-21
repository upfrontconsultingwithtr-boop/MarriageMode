/* eslint-disable @typescript-eslint/no-explicit-any */
// The Social Sweep: parses the user's OWN exports on the device and flags what needs review.
// Every flag carries who, category, why (plain language) and source (file + evidence line).
// Hard limits: only the user's own exports; no logins, no other people's accounts, no uploads.
// Texts and calls are read as metadata only (who, when); message content is never read or kept.
import type { SocialId } from './platforms.ts';
import { SOCIAL } from './platforms.ts';
import { scanText, type Hit } from '../scan.ts';

export type Category = 'friends' | 'followers' | 'interactions' | 'posts' | 'reactions' | 'contacts' | 'calls' | 'texts' | 'email' | 'dating' | 'viewers' | 'risque';
export const CATEGORIES: Category[] = ['friends', 'followers', 'interactions', 'posts', 'reactions', 'contacts', 'calls', 'texts', 'email', 'dating', 'viewers', 'risque'];
export const CAT_LABEL: Record<Category, [string, string]> = {
  friends: ['Friends', 'Amistades'], followers: ['Followers', 'Seguidores'], interactions: ['Interactions', 'Interacciones'], posts: ['Posts', 'Publicaciones'],
  reactions: ['Reactions / likes', 'Reacciones / me gusta'], contacts: ['Contacts', 'Contactos'], calls: ['Calls', 'Llamadas'], texts: ['Texts', 'Mensajes de texto'],
  email: ['Email', 'Correo'], dating: ['Dating accounts', 'Cuentas de citas'], viewers: ['Profile viewers', 'Quién vio tu perfil'], risque: ['Risque', 'Riesgoso'],
};

export type Rel = 'close friend' | 'mutual' | 'friend' | 'follower' | 'restricted' | 'following' | 'not following back' | 'muted' | 'blocked';
export type See = 'posts' | 'stories' | 'reels' | 'full profile' | 'location';
/** rel/canSee undefined = not in the export = "Unknown - check in app". Never guessed. */
export interface Access { rel?: Rel; canSee?: See[] }
export type Source = SocialId | 'email' | 'device' | 'solo';
export interface Flag {
  id: string; who: string; handle?: string; platform: Source; category: Category; risque: boolean;
  why: string; whyEs: string; source: string; evidence: string; access?: Access; link?: string;
}

// ---------- normalized input ----------
export interface PersonAct {
  handle: string; name?: string;
  youFollow?: boolean; followsYou?: boolean; friend?: boolean; closeFriend?: boolean; blocked?: boolean; muted?: boolean; restricted?: boolean; locationShared?: boolean;
  likes: number[]; comments: { at: number; text: string }[]; dms: number[]; views: number[]; storyViews: number[];
}
export interface SocialData { platform: SocialId; file: string; accountPrivate?: boolean; people: PersonAct[]; groups: { name: string; kind: 'group' | 'page' | 'follow' }[]; posts: { at: number; caption: string; tags: string[] }[] }
export interface DeviceData { file: string; contacts: { name: string; phone: string }[]; calls: { number: string; at: number }[]; texts: { number: string; at: number }[] }
export interface InboxData { file: string; text: string }
export interface Known { exes: string[]; pastMatches: string[] }

// ---------- rules (stated, so every flag can show its reason) ----------
export const RULES = {
  repeatLikes: { n: 10, days: 14 },      // 10+ likes/reactions on one person within 14 days
  comments: { n: 5, days: 30 },          // 5+ comments on one person within 30 days, or any flirty comment
  lateNight: { n: 3, days: 30 },         // 3+ messages/calls/texts between 11pm and 4am with one person within 30 days
  frequentDm: { n: 20, days: 30 },       // 20+ DMs/texts with one person within 30 days
  repeatViews: { n: 3 },                 // you searched for / opened one person's profile 3+ times
};
const DAY = 86400e3;
export const FLIRTY = /(sexy|\bhot\b|so hot|gorgeous|stunning|babe|baby girl|cutie|miss you|thinking of you|\bwyd\b|\bhmu\b|dm me|you up|come over|drinks sometime|you'?re fine|marry me|🔥|😍|😘|🥵|💋|😏|🍑|🍆|💦|👅|guapa|guapo|hermosa|mamacita|papacito|te extraño|bebé)/i;
const RISKY = /(hookup|hook up|singles|dating|sugar ?(baby|daddy|momma)|onlyfans|fansly|nsfw|\bxxx\b|escort|swinger|affair|flirt|\bfwb\b|one ?night|thirst|spicy|18\+|adult only|erotic|cougar|\bmilf\b|tinder|bumble|hinge|feeld|grindr|ashley ?madison|seeking)/i;
/** Ordinary contacts never flagged by frequency rules (family, medical, banking, school, services). */
export const BENIGN = /\b(mom|mum|mama|mother|dad|papa|father|grandma|grandpa|abuela|abuelo|nana|aunt|auntie|tia|tía|uncle|tio|tío|sister|brother|hermana|hermano|son|daughter|hijo|hija|cousin|dr\.?|doctor|dentist|dental|clinic|hospital|pharmacy|bank|credit union|school|elementary|teacher|coach|church|pastor|daycare|insurance|plumber|mechanic|landlord|work|office|boss)\b/i;
const LATE = (t: number) => { const h = new Date(t).getHours(); return h >= 23 || h < 4; };
const maxIn = (ts: number[], days: number) => { const s = [...ts].sort((a, b) => a - b); let best = 0; for (let i = 0, j = 0; i < s.length; i++) { while (s[i] - s[j] > days * DAY) j++; best = Math.max(best, i - j + 1); } return best; };
const fmt = (t: number) => new Date(t).toISOString().slice(0, 10);
const span = (ts: number[]) => { const s = [...ts].sort((a, b) => a - b); return s.length ? `${fmt(s[0])} to ${fmt(s[s.length - 1])}` : ''; };
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
function knownAs(k: Known, ...ids: (string | undefined)[]): 'ex' | 'match' | null {
  const hay = ids.filter(Boolean).map((x) => norm(x!));
  const hit = (list: string[]) => list.map(norm).filter((n) => n.length >= 3).some((n) => hay.some((h) => h.includes(n) || n.includes(h) && h.length >= 5));
  return hit(k.exes) ? 'ex' : hit(k.pastMatches) ? 'match' : null;
}

// ---------- access levels ----------
export function relOf(p: PersonAct): Rel | undefined {
  if (p.blocked) return 'blocked'; if (p.muted) return 'muted'; if (p.restricted) return 'restricted';
  if (p.closeFriend) return 'close friend'; if (p.friend) return 'friend';
  if (p.youFollow && p.followsYou) return 'mutual';
  if (p.followsYou) return 'follower';
  if (p.youFollow && p.followsYou === false) return 'not following back';
  if (p.youFollow) return 'following';
  return undefined;
}
export function canSeeOf(platform: SocialId, rel: Rel | undefined, accountPrivate: boolean | undefined, locationShared?: boolean): See[] | undefined {
  if (!rel) return undefined;
  if (rel === 'blocked') return [];
  const loc: See[] = locationShared ? ['location'] : [];
  if (platform === 'snapchat') return rel === 'friend' || rel === 'mutual' || rel === 'close friend' ? ['stories', 'full profile', ...loc] : [...loc];
  if (accountPrivate === undefined) return undefined; // privacy setting not in export: unknown
  const sees = rel === 'close friend' || rel === 'mutual' || rel === 'friend' || rel === 'follower' || rel === 'restricted' || rel === 'muted';
  if (accountPrivate) return sees ? ['posts', 'stories', 'reels', 'full profile', ...loc] : [...loc];
  return ['posts', 'stories', 'reels', 'full profile', ...loc];
}
const RANK: Record<string, number> = { 'close friend': 7, mutual: 6, friend: 6, follower: 5, restricted: 4, following: 3, 'not following back': 3, muted: 1, blocked: 0 };
/** "Most access first": close friend / mutual with story access, then follower-only, then blocked / muted; unknown last. */
export function accessRank(a?: Access): number { if (!a?.rel) return -1; return (RANK[a.rel] ?? 2) * 10 + (a.canSee?.includes('stories') ? 3 : 0) + (a.canSee?.length ?? 0) * 0.1; }
export const sortMostAccess = (fl: Flag[]) => [...fl].sort((x, y) => accessRank(y.access) - accessRank(x.access));

// ---------- the sweep ----------
let seq = 0; const fid = (s: string) => `${s}-${++seq}`;

export function sweepSocial(d: SocialData, k: Known): Flag[] {
  const out: Flag[] = []; const P = SOCIAL[d.platform]; const src = `${P.name} export (${d.file})`;
  for (const p of d.people) {
    const who = p.name || `@${p.handle}`; const rel = relOf(p);
    const access: Access = { rel, canSee: canSeeOf(d.platform, rel, d.accountPrivate, p.locationShared) };
    const base = { who, handle: p.handle, platform: d.platform as Source, access, link: P.profile(p.handle), source: src };
    const kind = knownAs(k, p.handle, p.name); const benign = BENIGN.test(`${p.name ?? ''} ${p.handle}`);
    if (kind) {
      const label = kind === 'ex' ? ['an ex you listed', 'una expareja que anotaste'] : ['a past dating match', 'un match de citas anterior'];
      const cat: Category = p.friend || p.closeFriend ? 'friends' : p.followsYou && !p.youFollow ? 'followers' : p.youFollow || p.followsYou ? (p.followsYou ? 'followers' : 'friends') : 'interactions';
      if (rel && rel !== 'blocked') out.push({ ...base, id: fid('k'), category: cat, risque: true, why: `${who} is ${label[0]} and is still connected to you (${rel}).`, whyEs: `${who} es ${label[1]} y sigue conectada contigo (${rel}).`, evidence: `${P.name} connections list: @${p.handle} — ${rel}` });
    }
    const likeMax = maxIn(p.likes, RULES.repeatLikes.days);
    if (likeMax >= RULES.repeatLikes.n && !benign) out.push({ ...base, id: fid('l'), category: 'reactions', risque: true, why: `You liked ${who}'s posts ${likeMax} times in ${RULES.repeatLikes.days} days${kind ? ` (${kind === 'ex' ? 'an ex' : 'a past match'})` : ''}.`, whyEs: `Diste me gusta a ${who} ${likeMax} veces en ${RULES.repeatLikes.days} días.`, evidence: `${P.name} likes: ${p.likes.length} likes of @${p.handle}, ${span(p.likes)}` });
    const flirty = p.comments.filter((c) => FLIRTY.test(c.text)); const cMax = maxIn(p.comments.map((c) => c.at), RULES.comments.days);
    if (flirty.length) out.push({ ...base, id: fid('c'), category: 'interactions', risque: true, why: `Flirty comment${flirty.length > 1 ? 's' : ''} from you to ${who}: “${flirty[0].text.slice(0, 80)}”.`, whyEs: `Comentario coqueto tuyo a ${who}: “${flirty[0].text.slice(0, 80)}”.`, evidence: `${P.name} comments: ${fmt(flirty[0].at)} “${flirty[0].text.slice(0, 80)}”` });
    else if (cMax >= RULES.comments.n && !benign) out.push({ ...base, id: fid('c'), category: 'interactions', risque: true, why: `You commented on ${who}'s posts ${cMax} times in ${RULES.comments.days} days.`, whyEs: `Comentaste ${cMax} veces en publicaciones de ${who} en ${RULES.comments.days} días.`, evidence: `${P.name} comments: ${p.comments.length} comments to @${p.handle}, ${span(p.comments.map((c) => c.at))}` });
    const late = p.dms.filter(LATE); const lateMax = maxIn(late, RULES.lateNight.days); const dmMax = maxIn(p.dms, RULES.frequentDm.days);
    if (!benign && (lateMax >= RULES.lateNight.n || dmMax >= RULES.frequentDm.n)) out.push({ ...base, id: fid('d'), category: 'interactions', risque: true, why: lateMax >= RULES.lateNight.n ? `${lateMax} late-night DMs (11pm–4am) with ${who} in ${RULES.lateNight.days} days.` : `${dmMax} DMs with ${who} in ${RULES.frequentDm.days} days.`, whyEs: lateMax >= RULES.lateNight.n ? `${lateMax} mensajes directos de madrugada (11pm–4am) con ${who} en ${RULES.lateNight.days} días.` : `${dmMax} mensajes directos con ${who} en ${RULES.frequentDm.days} días.`, evidence: `${P.name} messages: ${p.dms.length} messages with @${p.handle}${late.length ? `, ${late.length} late at night` : ''}, ${span(p.dms)}` });
    if (p.views.length >= RULES.repeatViews.n) out.push({ ...base, id: fid('v'), category: 'interactions', risque: true, why: `You searched for or opened ${who}'s profile ${p.views.length} times.`, whyEs: `Buscaste o abriste el perfil de ${who} ${p.views.length} veces.`, evidence: `${P.name} profile searches: @${p.handle} ×${p.views.length}, ${span(p.views)}` });
    if (p.storyViews.length && kind) out.push({ ...base, id: fid('sv'), category: 'viewers', risque: false, why: `${who} (${kind === 'ex' ? 'an ex' : 'a past match'}) viewed your stories ${p.storyViews.length} times. Story viewers are the only viewer data ${P.name} shows.`, whyEs: `${who} vio tus historias ${p.storyViews.length} veces. Quién ve tus historias es el único dato de visitas que muestra ${P.name}.`, evidence: `${P.name} story viewers: @${p.handle} ×${p.storyViews.length}, ${span(p.storyViews)}` });
  }
  for (const g of d.groups) if (RISKY.test(g.name)) {
    const kindWord = g.kind === 'group' ? ['group', 'grupo'] : g.kind === 'page' ? ['page', 'página'] : ['account you follow', 'cuenta que sigues'];
    out.push({ id: fid('g'), who: g.name, platform: d.platform, category: g.kind === 'follow' ? 'friends' : 'interactions', risque: true, why: `Risque ${kindWord[0]}: “${g.name}” is about dating, hookups or sexual content.`, whyEs: `${kindWord[1]} riesgoso: “${g.name}” trata de citas, encuentros o contenido sexual.`, source: src, evidence: `${P.name} ${g.kind === 'follow' ? 'following' : g.kind + 's'} list: “${g.name}”`, link: g.kind === 'group' ? P.screens.groups : P.screens.unfollow, access: undefined });
  }
  for (const po of d.posts) {
    const tagKnown = po.tags.find((t) => knownAs(k, t)); const fl = FLIRTY.test(po.caption) || /\b(single|available|soltera?o?)\b/i.test(po.caption);
    if (tagKnown || fl) out.push({ id: fid('p'), who: tagKnown ? `@${tagKnown}` : 'Your post', handle: tagKnown, platform: d.platform, category: 'posts', risque: true, why: tagKnown ? `Your post tags @${tagKnown} (${knownAs(k, tagKnown) === 'ex' ? 'an ex' : 'a past match'}).` : `Your post caption reads as flirty or single: “${po.caption.slice(0, 80)}”.`, whyEs: tagKnown ? `Tu publicación etiqueta a @${tagKnown}.` : `El texto de tu publicación suena coqueto o soltero: “${po.caption.slice(0, 80)}”.`, source: src, evidence: `${P.name} posts: ${fmt(po.at)} “${po.caption.slice(0, 80)}”${po.tags.length ? ` tags: ${po.tags.join(', ')}` : ''}`, link: P.screens.activity });
  }
  return out;
}

export function sweepDevice(d: DeviceData, k: Known): Flag[] {
  const out: Flag[] = []; const src = `Device export (${d.file})`;
  const digits = (s: string) => s.replace(/\D/g, '').slice(-10);
  const byNum = new Map(d.contacts.map((c) => [digits(c.phone), c.name]));
  for (const c of d.contacts) {
    const kind = knownAs(k, c.name); const app = c.name.match(RISKY);
    if (kind || app) out.push({ id: fid('ct'), who: c.name, platform: 'device', category: 'contacts', risque: true, why: kind ? `Saved contact “${c.name}” is ${kind === 'ex' ? 'an ex you listed' : 'a past dating match'}.` : `Saved contact “${c.name}” mentions ${app![0]}.`, whyEs: kind ? `El contacto “${c.name}” es ${kind === 'ex' ? 'una expareja' : 'un match anterior'}.` : `El contacto “${c.name}” menciona ${app![0]}.`, source: src, evidence: `contacts: ${c.name} · ${c.phone}` });
  }
  const group = (list: { number: string; at: number }[]) => { const m = new Map<string, number[]>(); for (const x of list) { const n = digits(x.number); m.set(n, [...(m.get(n) ?? []), x.at]); } return m; };
  for (const [kind, list, cat] of [['calls', d.calls, 'calls'], ['texts', d.texts, 'texts']] as const) {
    for (const [num, ts] of group(list)) {
      const name = byNum.get(num) ?? `Unsaved number …${num.slice(-4)}`; if (BENIGN.test(name)) continue;
      const late = ts.filter(LATE); const lateMax = maxIn(late, RULES.lateNight.days); const known = knownAs(k, name); const freq = maxIn(ts, RULES.frequentDm.days);
      if (lateMax >= RULES.lateNight.n || freq >= RULES.frequentDm.n || (known && ts.length)) {
        const w = kind === 'calls' ? ['calls', 'llamadas'] : ['texts', 'mensajes'];
        out.push({ id: fid(cat), who: name, platform: 'device', category: cat, risque: true,
          why: lateMax >= RULES.lateNight.n ? `${lateMax} late-night ${w[0]} (11pm–4am) with ${name} in ${RULES.lateNight.days} days.` : known ? `${ts.length} ${w[0]} with ${name} (${known === 'ex' ? 'an ex' : 'a past match'}).` : `${freq} ${w[0]} with ${name} in ${RULES.frequentDm.days} days.`,
          whyEs: lateMax >= RULES.lateNight.n ? `${lateMax} ${w[1]} de madrugada (11pm–4am) con ${name} en ${RULES.lateNight.days} días.` : `${ts.length} ${w[1]} con ${name}.`,
          source: src, evidence: `${kind} log (time and number only, no content): ${ts.length} with …${num.slice(-4)}, ${late.length} late at night, ${span(ts)}` });
      }
    }
  }
  return out;
}

/** Dating-account auto-discovery + past matches + dating email, from an inbox / billing export. */
export function sweepInbox(d: InboxData): { hits: Hit[]; matches: string[]; flags: Flag[]; evidence: Record<string, string> } {
  const acc = new Map<string, Hit>(); scanText(d.text, d.file, acc);
  const hits = [...acc.values()].sort((a, b) => b.count - a.count);
  const lines = d.text.split(/\r?\n/); const evidence: Record<string, string> = {}; const flags: Flag[] = [];
  for (const h of hits) {
    const re = new RegExp(`(${[h.name, ...(PLAT_DOMAINS[h.platformId] ?? [])].map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'i');
    const ln = lines.findIndex((l) => re.test(l)); evidence[h.platformId] = ln >= 0 ? `line ${ln + 1}: ${lines[ln].trim().slice(0, 120)}` : `${h.count} mentions`;
    flags.push({ id: fid('e'), who: h.name, platform: 'email', category: 'email', risque: true, why: `${h.count} email${h.count > 1 ? 's' : ''} from or about ${h.name} in your inbox.`, whyEs: `${h.count} correo(s) de ${h.name} en tu bandeja.`, source: `Inbox export (${d.file})`, evidence: evidence[h.platformId] });
  }
  const matches = [...new Set([...d.text.matchAll(/(?:it'?s a match!?\s*(?:you and|with)|matched with|new match(?: with)?:?)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)?)/gi)].map((m) => m[1]))];
  return { hits, matches, flags, evidence };
}
import { PLATFORMS } from '../catalog.ts';
const PLAT_DOMAINS: Record<string, string[]> = Object.fromEntries(PLATFORMS.map((p) => [p.id, [p.domain, ...p.emailDomains].filter(Boolean) as string[]]));

// ---------- parsers for the user's files ----------
export function parseDemoSocial(text: string, file: string): SocialData[] {
  const j = JSON.parse(text); if (j?.format !== 'marriage-mode-demo-social') throw new Error('format');
  const t = (x: string | number) => (typeof x === 'number' ? x : Date.parse(x));
  return (j.platforms as Record<string, unknown>[]).map((p: any) => ({
    platform: p.platform, file, accountPrivate: p.account_private,
    people: (p.people ?? []).map((x: any) => ({ handle: x.handle, name: x.name, youFollow: x.you_follow, followsYou: x.follows_you, friend: x.friend, closeFriend: x.close_friend, blocked: x.blocked, muted: x.muted, restricted: x.restricted, locationShared: x.location_shared,
      likes: (x.likes ?? []).map(t), comments: (x.comments ?? []).map((c: any) => ({ at: t(c.at), text: String(c.text ?? '') })), dms: (x.messages ?? []).map(t), views: (x.profile_searches ?? []).map(t), storyViews: (x.story_views ?? []).map(t) })),
    groups: p.groups ?? [], posts: (p.posts ?? []).map((po: any) => ({ at: t(po.at), caption: String(po.caption ?? ''), tags: po.tags ?? [] })),
  }));
}
export function parseDevice(text: string, file: string): DeviceData {
  const d: DeviceData = { file, contacts: [], calls: [], texts: [] };
  const t = text.trim();
  if (t.startsWith('{')) { const j = JSON.parse(t); const ts = (x: string | number) => (typeof x === 'number' ? x : Date.parse(x));
    d.contacts = (j.contacts ?? []).map((c: any) => ({ name: String(c.name), phone: String(c.phone) }));
    d.calls = (j.calls ?? []).map((c: any) => ({ number: String(c.number), at: ts(c.at) })); d.texts = (j.texts ?? []).map((c: any) => ({ number: String(c.number), at: ts(c.at) })); return d; }
  if (/BEGIN:VCARD/i.test(t)) { for (const card of t.split(/END:VCARD/i)) { const fn = card.match(/^FN[^:]*:(.+)$/im)?.[1]?.trim(); const tel = card.match(/^TEL[^:]*:(.+)$/im)?.[1]?.trim(); if (fn && tel) d.contacts.push({ name: fn, phone: tel }); } return d; }
  // "SMS Backup & Restore" XML (Android): <sms address date .../> and <call number date contact_name .../>. Bodies are ignored.
  for (const m of t.matchAll(/<sms\b[^>]*?address="([^"]+)"[^>]*?date="(\d+)"/g)) d.texts.push({ number: m[1], at: +m[2] });
  for (const m of t.matchAll(/<call\b[^>]*?number="([^"]+)"[^>]*?date="(\d+)"/g)) d.calls.push({ number: m[1], at: +m[2] });
  for (const m of t.matchAll(/(?:contact_name|name)="([^"(]+?)"[^>]*?(?:address|number)="([^"]+)"|(?:address|number)="([^"]+)"[^>]*?contact_name="([^"(]+?)"/g)) { const name = (m[1] ?? m[4] ?? '').trim(); const ph = m[2] ?? m[3]; if (name && name !== '(Unknown)' && !d.contacts.some((c) => c.phone === ph)) d.contacts.push({ name, phone: ph }); }
  return d;
}
