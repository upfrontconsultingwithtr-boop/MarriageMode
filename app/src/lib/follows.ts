// Social follow review: reads the customer's OWN data download from Instagram, Facebook
// or TikTok on their device (nothing uploaded), lists who they follow / are friends with,
// and flags accounts that may put the relationship at risk: people they name (like exes)
// and dating, hookup or adult accounts. The customer decides; we only suggest.
export type Platform = 'instagram' | 'threads' | 'facebook' | 'tiktok' | 'snapchat' | 'youtube' | 'x' | 'linkedin' | 'reddit' | 'other';
export type Account = { key: string; platform: Platform; handle: string; url: string; kind: string; reasons: string[]; likely?: boolean; youFollow?: boolean; followsYou?: boolean; closeFriend?: boolean; friend?: boolean; since?: number };

const FILES = /(follow|friend|close_friend|connections|following|fans|group|subscriptions|subscribed|threads)/i;
// Accounts, influencers and groups that promote dating, hookups or sexual content.
const RISKY = ['r4r', 'gonewild', 'datingapps', 'datingcoach', 'datingadvice', 'pickupartist', 'seduction', 'rizz', 'thirsttrap', 'thirst', 'lingerie', 'bikinimodel', 'hotgirls', 'hotguys', 'hookups', 'meetsingles', 'singlesgroup', 'swipe', 'onenight', 'adult', 'erotic', 'sexy', 'playboy', 'playmate', 'stripper', 'strip_club', 'cougar', 'milf', 'dilf', 'fwb', 'dating', 'singles', 'hookup', 'hook_up', 'onlyfans', 'fansly', 'sugarbaby', 'sugar_baby', 'sugardaddy', 'sugar_daddy', 'sugarmomma', 'nsfw', 'xxx', 'escort', 'camgirl', 'fling', 'tinder', 'bumble', 'hinge', 'feeld', 'grindr', 'swinger', 'swingers', 'flirt', 'affair', 'ashleymadison', 'seeking', '18plus', 'spicy'];

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9_. ]/g, ' ').replace(/\s+/g, ' ').trim();

function platformOf(path: string, href = ''): Platform {
  const s = (path + ' ' + href).toLowerCase();
  if (s.includes('threads.net') || /(^|\/)threads?[\/_]/.test(path.toLowerCase())) return 'threads';
  if (s.includes('instagram')) return 'instagram';
  if (s.includes('snapchat') || s.includes('snap')) return 'snapchat';
  if (s.includes('youtube')) return 'youtube';
  if (s.includes('twitter') || s.includes('x.com') || /following\.js$/.test(path)) return 'x';
  if (s.includes('linkedin') || /connections\.csv$/i.test(path)) return 'linkedin';
  if (s.includes('reddit') || s.includes('subreddit')) return 'reddit';
  if (s.includes('tiktok')) return 'tiktok';
  if (s.includes('facebook') || s.includes('friends_v2') || s.includes('your_friends')) return 'facebook';
  return 'other';
}
function kindOf(path: string): string {
  const p = (path.split('/').pop() || path).toLowerCase();
  if (p.includes('group')) return 'group';
  if (p.includes('close_friend')) return 'close friend';
  if ((p.includes('follower') || p.includes('fans')) && !p.includes('following')) return 'follows you';
  if (p.includes('friend')) return 'friend';
  return 'you follow';
}
export function profileUrl(platform: Platform, handle: string, href?: string): string {
  if (href && /^https?:\/\//.test(href)) return href;
  if (platform === 'instagram') return `https://www.instagram.com/${encodeURIComponent(handle)}/`;
  if (platform === 'tiktok') return `https://www.tiktok.com/@${encodeURIComponent(handle)}`;
  if (platform === 'threads') return `https://www.threads.net/@${encodeURIComponent(handle)}`;
  if (platform === 'snapchat') return `https://www.snapchat.com/add/${encodeURIComponent(handle)}`;
  if (platform === 'youtube') return `https://www.youtube.com/results?search_query=${encodeURIComponent(handle)}`;
  if (platform === 'x') return `https://x.com/${encodeURIComponent(handle)}`;
  if (platform === 'linkedin') return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(handle)}`;
  if (platform === 'reddit') return `https://www.reddit.com/r/${encodeURIComponent(handle.replace(/^r\//, ''))}/`;
  return `https://www.facebook.com/search/top?q=${encodeURIComponent(handle)}`;
}

// Walk any JSON export and pull out usernames / names from follow & friend lists.
export function extract(path: string, text: string, out: Map<string, Account>) {
  if (!FILES.test(path)) return;
  const kind = kindOf(path);
  const add = (handle: string, href?: string, ts?: number) => {
    const h = handle.trim(); if (!h || h.length > 80) return;
    const platform = platformOf(path, href);
    const key = `${platform}:${h.toLowerCase()}`;
    const a = out.get(key) ?? { key, platform, handle: h, url: profileUrl(platform, h, href), kind, reasons: [] };
    if (kind === 'you follow') a.youFollow = true; else if (kind === 'follows you') a.followsYou = true; else if (kind === 'close friend') a.closeFriend = true; else if (kind === 'friend') a.friend = true;
    if (kind === 'group') a.kind = 'group';
    if (ts && (kind === 'you follow' || kind === 'friend' || kind === 'group')) a.since = ts > 1e12 ? ts : ts * 1000;
    if (kind !== 'group') a.kind = a.closeFriend ? 'close friend' : a.friend ? 'friend' : a.youFollow && a.followsYou ? 'mutual follow' : a.youFollow ? 'you follow' : 'follows you';
    out.set(key, a);
  };
  if (/\.csv$/i.test(path)) {
    const rows = text.split(/\r?\n/).filter(Boolean); const head = (rows.shift() ?? '').split(',').map((h) => h.trim().toLowerCase());
    const col = (n: string) => head.findIndex((h) => h.includes(n));
    for (const r of rows) {
      const c = r.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map((x) => x.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim()) ?? [];
      if (col('channel title') >= 0) add(c[col('channel title')], c[col('channel url')]);
      else if (col('first name') >= 0) add(`${c[col('first name')] ?? ''} ${c[col('last name')] ?? ''}`, c[col('url')], c[col('connected on')] ? Date.parse(c[col('connected on')]) : undefined);
      else if (col('subreddit') >= 0) add(c[col('subreddit')]);
    }
    return;
  }
  if (/\.js$/i.test(path)) {
    let arr: { following?: { accountId?: string; userLink?: string } }[] = []; try { arr = JSON.parse(text.replace(/^[^=]*=\s*/, '')); } catch { return; }
    for (const e of arr) if (e.following?.accountId) add(`X user ${e.following.accountId}`, e.following.userLink);
    return;
  }
  if (/\.json$/i.test(path)) {
    let data: unknown; try { data = JSON.parse(text); } catch { return; }
    const walk = (v: unknown) => {
      if (Array.isArray(v)) { v.forEach(walk); return; }
      if (!v || typeof v !== 'object') return;
      const o = v as Record<string, unknown>;
      const sld = Array.isArray(o.string_list_data) ? (o.string_list_data as Record<string, unknown>[]) : null;
      if (sld?.length) { const s = sld[0]; const h = (s.value as string) || (o.title as string) || ((s.href as string) || '').split('/').filter(Boolean).pop() || ''; add(h, s.href as string, s.timestamp as number); return; }
      if (/group/i.test(path) && typeof o.name === 'string' && typeof o.timestamp === 'number') { add(o.name, undefined, o.timestamp as number); return; }
      if (/group/i.test(path) && typeof o.title === 'string' && typeof o.timestamp === 'number') { add(o.title, undefined, o.timestamp as number); return; }
      if (typeof o.Username === 'string' || typeof o['Display Name'] === 'string') { add((o['Display Name'] as string) || (o.Username as string), typeof o.Username === 'string' ? `https://www.snapchat.com/add/${o.Username}` : undefined, typeof o['Creation Timestamp'] === 'string' ? Date.parse(o['Creation Timestamp'] as string) : undefined); return; }
      if (typeof o.UserName === 'string') { add(o.UserName, undefined, typeof o.Date === 'string' ? Date.parse(o.Date) : undefined); return; }
      if (typeof o.name === 'string' && (typeof o.timestamp === 'number' || 'contact_info' in o)) { add(o.name, undefined, o.timestamp as number); return; }
      Object.values(o).forEach(walk);
    };
    walk(data);
  } else if (/\.html?$/i.test(path)) {
    for (const m of text.matchAll(/<a[^>]+href="(https?:\/\/(?:www\.)?(?:instagram|tiktok|facebook)\.com\/[^"]+)"[^>]*>([^<]{1,80})<\/a>/gi)) add(m[2], m[1]);
  }
}

import { guessSex } from './names.ts';
export type Dates = 'women' | 'men' | 'both' | '';
export function flag(list: Account[], names: string[], sinceDate?: string, dates: Dates = ''): Account[] {
  const cut = sinceDate ? Date.parse(sinceDate) : NaN;
  const people = names.map(norm).filter((n) => n.length >= 2);
  return list.map((a) => {
    const h = norm(a.handle); const compact = h.replace(/[ ._]/g, ''); const reasons: string[] = [];
    for (const p of people) { const pc = p.replace(/[ ._]/g, ''); if (compact.includes(pc) || p.split(' ').filter((w) => w.length >= 3).every((w) => h.includes(w))) { reasons.push(`matches “${p}”`); break; } }
    const tokens = h.split(/[ ._]+/);
    const word = RISKY.find((w) => compact.includes(w.replace(/_/g, ''))) ?? (tokens.includes('sex') || tokens.includes('sexo') || tokens.includes('dating') || tokens.includes('citas') ? 'sex/dating' : undefined);
    if (word) reasons.push(a.kind === 'group' ? `group about dating or sex (“${word}”)` : `promotes dating, hookups or sex (“${word}”)`);
    const recent = !Number.isNaN(cut) && !!a.since && a.since >= cut;
    if (recent) reasons.push(`followed ${new Date(a.since!).toLocaleDateString()}, after your relationship began`);
    const sx = guessSex(a.handle); const likely = !!sx && (dates === 'both' || (dates === 'women' && sx === 'f') || (dates === 'men' && sx === 'm'));
    const oneway = !!a.youFollow && !a.followsYou && !a.closeFriend && !a.friend;
    if (likely && (recent || oneway) && a.kind !== 'group') reasons.push(`likely ${sx === 'f' ? 'a woman' : 'a man'} (guessed from the name)${oneway && !recent ? ', one-way follow' : ''}`);
    return { ...a, reasons, likely };
  }).sort((x, y) => y.reasons.length - x.reasons.length || x.handle.localeCompare(y.handle));
}

const INTER = /(like|comment|reaction|story|stories|messages\/inbox|message_\d)/i;
export type RawFile = { path: string; text: string };
export async function readExport(f: File, onProgress: (m: string) => void, raw?: RawFile[]): Promise<Account[]> {
  const out = new Map<string, Account>();
  if (/\.zip$/i.test(f.name)) {
    const { unzip } = await import('fflate');
    const buf = new Uint8Array(await f.arrayBuffer()); onProgress('Opening the download…');
    const files: Record<string, Uint8Array> = await new Promise((res, rej) => unzip(buf, { filter: (e) => (FILES.test(e.name) || (!!raw && INTER.test(e.name))) && /\.(json|html?|csv|js)$/i.test(e.name) && e.originalSize <= 30e6 }, (err, o) => (err ? rej(err) : res(o))));
    const dec = new TextDecoder(); for (const [n, b] of Object.entries(files)) { const txt = dec.decode(b); extract(n, txt, out); if (raw && INTER.test(n)) raw.push({ path: n, text: txt }); }
  } else if (/\.(json|html?|csv|js)$/i.test(f.name)) { extract(/(follow|friend|subscri|connection)/i.test(f.name) ? f.name : `following/${f.name}`, await f.text(), out); }
  else throw new Error('unsupported');
  return [...out.values()];
}
