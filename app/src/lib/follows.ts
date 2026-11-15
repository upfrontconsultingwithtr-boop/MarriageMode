// Social follow review: reads the customer's OWN data download from Instagram, Facebook
// or TikTok on their device (nothing uploaded), lists who they follow / are friends with,
// and flags accounts that may put the relationship at risk: people they name (like exes)
// and dating, hookup or adult accounts. The customer decides; we only suggest.
export type Platform = 'instagram' | 'facebook' | 'tiktok' | 'other';
export type Account = { key: string; platform: Platform; handle: string; url: string; kind: string; reasons: string[] };

const FILES = /(follow|friend|close_friend|connections|following)/i;
const RISKY = ['dating', 'singles', 'hookup', 'hook_up', 'onlyfans', 'fansly', 'sugarbaby', 'sugar_baby', 'sugardaddy', 'sugar_daddy', 'sugarmomma', 'nsfw', 'xxx', 'escort', 'camgirl', 'fling', 'tinder', 'bumble', 'hinge', 'feeld', 'grindr', 'swinger', 'swingers', 'flirt', 'affair', 'ashleymadison', 'seeking', '18plus', 'spicy'];

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9_. ]/g, ' ').replace(/\s+/g, ' ').trim();

function platformOf(path: string, href = ''): Platform {
  const s = (path + ' ' + href).toLowerCase();
  if (s.includes('instagram')) return 'instagram';
  if (s.includes('tiktok')) return 'tiktok';
  if (s.includes('facebook') || s.includes('friends_v2') || s.includes('your_friends')) return 'facebook';
  return 'other';
}
function kindOf(path: string): string {
  const p = path.toLowerCase();
  if (p.includes('close_friend')) return 'close friend';
  if (p.includes('follower') && !p.includes('following')) return 'follows you';
  if (p.includes('friend')) return 'friend';
  return 'you follow';
}
export function profileUrl(platform: Platform, handle: string, href?: string): string {
  if (href && /^https?:\/\//.test(href)) return href;
  if (platform === 'instagram') return `https://www.instagram.com/${encodeURIComponent(handle)}/`;
  if (platform === 'tiktok') return `https://www.tiktok.com/@${encodeURIComponent(handle)}`;
  return `https://www.facebook.com/search/top?q=${encodeURIComponent(handle)}`;
}

// Walk any JSON export and pull out usernames / names from follow & friend lists.
export function extract(path: string, text: string, out: Map<string, Account>) {
  if (!FILES.test(path)) return;
  const add = (handle: string, href?: string) => {
    const h = handle.trim(); if (!h || h.length > 80) return;
    const platform = platformOf(path, href);
    const key = `${platform}:${h.toLowerCase()}`;
    if (!out.has(key)) out.set(key, { key, platform, handle: h, url: profileUrl(platform, h, href), kind: kindOf(path), reasons: [] });
  };
  if (/\.json$/i.test(path)) {
    let data: unknown; try { data = JSON.parse(text); } catch { return; }
    const walk = (v: unknown) => {
      if (Array.isArray(v)) { v.forEach(walk); return; }
      if (!v || typeof v !== 'object') return;
      const o = v as Record<string, unknown>;
      const sld = Array.isArray(o.string_list_data) ? (o.string_list_data as Record<string, unknown>[]) : null;
      if (sld?.length) { const s = sld[0]; const h = (s.value as string) || (o.title as string) || ((s.href as string) || '').split('/').filter(Boolean).pop() || ''; add(h, s.href as string); return; }
      if (typeof o.UserName === 'string') { add(o.UserName); return; }
      if (typeof o.name === 'string' && (typeof o.timestamp === 'number' || 'contact_info' in o)) { add(o.name); return; }
      Object.values(o).forEach(walk);
    };
    walk(data);
  } else if (/\.html?$/i.test(path)) {
    for (const m of text.matchAll(/<a[^>]+href="(https?:\/\/(?:www\.)?(?:instagram|tiktok|facebook)\.com\/[^"]+)"[^>]*>([^<]{1,80})<\/a>/gi)) add(m[2], m[1]);
  }
}

export function flag(list: Account[], names: string[]): Account[] {
  const people = names.map(norm).filter((n) => n.length >= 2);
  return list.map((a) => {
    const h = norm(a.handle); const compact = h.replace(/[ ._]/g, ''); const reasons: string[] = [];
    for (const p of people) { const pc = p.replace(/[ ._]/g, ''); if (compact.includes(pc) || p.split(' ').filter((w) => w.length >= 3).every((w) => h.includes(w))) { reasons.push(`matches “${p}”`); break; } }
    const word = RISKY.find((w) => compact.includes(w.replace(/_/g, '')));
    if (word) reasons.push(`dating / adult account (“${word}”)`);
    return { ...a, reasons };
  }).sort((x, y) => y.reasons.length - x.reasons.length || x.handle.localeCompare(y.handle));
}

export async function readExport(f: File, onProgress: (m: string) => void): Promise<Account[]> {
  const out = new Map<string, Account>();
  if (/\.zip$/i.test(f.name)) {
    const { unzip } = await import('fflate');
    const buf = new Uint8Array(await f.arrayBuffer()); onProgress('Opening the download…');
    const files: Record<string, Uint8Array> = await new Promise((res, rej) => unzip(buf, { filter: (e) => FILES.test(e.name) && /\.(json|html?)$/i.test(e.name) && e.originalSize <= 30e6 }, (err, o) => (err ? rej(err) : res(o))));
    const dec = new TextDecoder(); for (const [n, b] of Object.entries(files)) extract(n, dec.decode(b), out);
  } else if (/\.(json|html?)$/i.test(f.name)) { extract(`following/${f.name}`, await f.text(), out); }
  else throw new Error('unsupported');
  return [...out.values()];
}
