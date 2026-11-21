// Free Solo Search (founder decision 2026-11-21): for someone whose partner will not join.
// PUBLIC information only, opened in the user's own browser. No breached/leaked databases,
// no private accounts, no login bypass, never "all of the internet". Every free public source the user can open
// themselves (Tiffany 2026-11-21), except people-search / home-address data brokers (safety: see rulings list).
export type IdType = 'email' | 'username' | 'phone' | 'namecity' | 'photo' | 'other';
export interface Search { site: string; url: string }
const q = (s: string) => encodeURIComponent(s);
const G = (s: string) => `https://www.google.com/search?q=${q(s)}`;

export function searchesFor(type: IdType, raw: string): Search[] {
  const v = raw.trim(); if (!v) return [];
  const ex = `"${v.replace(/"/g, '')}"`;
  if (type === 'username') {
    const u = v.replace(/^@/, '');
    return [
      { site: 'Google', url: G(`"${u}"`) },
      { site: 'Instagram', url: `https://www.instagram.com/${q(u)}/` },
      { site: 'Threads', url: `https://www.threads.net/@${q(u)}` },
      { site: 'TikTok', url: `https://www.tiktok.com/@${q(u)}` },
      { site: 'X', url: `https://x.com/${q(u)}` },
      { site: 'Reddit', url: `https://www.reddit.com/user/${q(u)}/` },
      { site: 'YouTube', url: `https://www.youtube.com/@${q(u)}` },
      { site: 'Facebook', url: `https://www.facebook.com/${q(u)}` },
      { site: 'LinkedIn', url: `https://www.linkedin.com/in/${q(u)}/` },
      { site: 'Pinterest', url: `https://www.pinterest.com/${q(u)}/` },
      { site: 'Snapchat', url: `https://www.snapchat.com/add/${q(u)}` },
      { site: 'Twitch', url: `https://www.twitch.tv/${q(u)}` },
      { site: 'Venmo (public profile)', url: `https://venmo.com/u/${q(u)}` },
      { site: 'Cash App (public $cashtag)', url: 'https://cash.app/' + '$' + q(u) },
      { site: 'Telegram (public username)', url: `https://t.me/${q(u)}` },
      { site: 'Bing', url: `https://www.bing.com/search?q=${q(`"${u}"`)}` },
      { site: 'DuckDuckGo', url: `https://duckduckgo.com/?q=${q(`"${u}"`)}` },
      { site: 'Dating sites (public profiles)', url: G(`"${u}" (site:tinder.com OR site:okcupid.com OR site:pof.com OR site:hinge.co OR site:bumble.com)`) },
      { site: 'Forums', url: G(`"${u}" (forum OR inurl:forum OR inurl:thread OR site:quora.com)`) },
      { site: 'Username checker (WhatsMyName)', url: `https://whatsmyname.app/?q=${q(u)}` },
    ];
  }
  const sites = (term: string): Search[] => [
    { site: 'Google', url: G(term) },
    { site: 'Bing', url: `https://www.bing.com/search?q=${q(term)}` },
    { site: 'DuckDuckGo', url: `https://duckduckgo.com/?q=${q(term)}` },
    ...([['Instagram', 'instagram.com'], ['Threads', 'threads.net'], ['TikTok', 'tiktok.com'], ['X', 'x.com'], ['Reddit', 'reddit.com'], ['YouTube', 'youtube.com'], ['Facebook', 'facebook.com'], ['LinkedIn', 'linkedin.com'], ['Pinterest', 'pinterest.com'], ['Snapchat', 'snapchat.com'], ['Venmo (public)', 'venmo.com']] as const).map(([n, d]) => ({ site: n, url: G(`${term} site:${d}`) })),
    { site: 'Dating sites (public profiles)', url: G(`${term} (site:tinder.com OR site:okcupid.com OR site:pof.com OR site:match.com)`) },
    { site: 'Forums', url: G(`${term} (forum OR site:quora.com)`) },
  ];
  if (type === 'photo') { // reverse photo look-up: public pages that use the same picture
    const isUrl = /^https?:\/\//i.test(v);
    return isUrl ? [
      { site: 'Google Lens (reverse photo)', url: `https://lens.google.com/uploadbyurl?url=${q(v)}` },
      { site: 'TinEye (reverse photo)', url: `https://tineye.com/search?url=${q(v)}` },
      { site: 'Bing Visual Search', url: `https://www.bing.com/images/search?view=detailv2&iss=sbi&q=imgurl:${q(v)}` },
    ] : [
      { site: 'Google Lens: upload the photo there', url: 'https://lens.google.com/' },
      { site: 'TinEye: upload the photo there', url: 'https://tineye.com/' },
      { site: 'Bing Visual Search: upload the photo there', url: 'https://www.bing.com/visualsearch' },
    ];
  }
  if (type === 'email') { const user = v.split('@')[0]; return [...sites(ex), { site: 'Username checker (WhatsMyName)', url: `https://whatsmyname.app/?q=${q(user)}` }]; }
  if (type === 'phone') return sites(ex); // public web pages only; never people-search / data-broker sites
  if (type === 'namecity') { const [name, city] = v.split(/\s*,\s*/); return sites(city ? `"${name}" "${city}"` : ex); }
  return sites(ex);
}
export const DEMO_IDS: { type: IdType; value: string }[] = [
  { type: 'email', value: 'demo.partner@example.com' }, { type: 'username', value: 'demo_partner_123' },
  { type: 'phone', value: '555-0199' }, { type: 'namecity', value: 'Demo Partner, Springfield' }, { type: 'photo', value: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Example.jpg' }, { type: 'other', value: 'demo-gamer-tag' },
];
