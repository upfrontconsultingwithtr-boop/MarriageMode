// Scans a data download (Google Takeout, Facebook "Download your information",
// or any .zip/.json/.html/.csv/.txt/.mbox) for dating platforms, entirely on the
// device. Nothing is uploaded.
import { PLATFORMS } from './catalog.ts';

export type Hit = { platformId: string; name: string; count: number; files: string[] };

// Names that are ordinary words would cause false matches, so those platforms
// are matched by web address only.
const NAME_SAFE = new Set(['tinder', 'bumble', 'hinge', 'okcupid', 'eharmony', 'zoosk', 'badoo', 'happn', 'hily', 'feeld', 'grindr', 'taimi', 'jdate', 'muzz', 'ourtime', 'silversingles', 'elitesingles', 'christian mingle', 'coffee meets bagel', 'plenty of fish', 'ashley madison', 'adultfriendfinder', 'facebook dating']);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const MATCHERS = PLATFORMS.map((p) => {
  const terms = [...new Set([p.domain, ...p.emailDomains].filter(Boolean) as string[])].filter((d) => d !== 'facebook.com').map(esc);
  const nm = p.name.toLowerCase();
  if (NAME_SAFE.has(nm)) terms.push(`\\b${esc(nm)}\\b`);
  return { id: p.id, name: p.name, re: terms.length ? new RegExp(terms.join('|'), 'gi') : null };
}).filter((m) => m.re);

const TEXT = /\.(json|html?|csv|txt|mbox|xml|js)$/i;
export const MAX_FILE = 60 * 1024 * 1024;

export function scanText(text: string, file: string, acc: Map<string, Hit>) {
  for (const m of MATCHERS) {
    const n = text.match(m.re!)?.length ?? 0;
    if (!n) continue;
    const h = acc.get(m.id) ?? { platformId: m.id, name: m.name, count: 0, files: [] };
    h.count += n; if (h.files.length < 3 && !h.files.includes(file)) h.files.push(file);
    acc.set(m.id, h);
  }
}

export async function scanFile(f: File, onProgress: (msg: string) => void): Promise<Hit[]> {
  const acc = new Map<string, Hit>();
  if (/\.zip$/i.test(f.name)) {
    const { unzip } = await import('fflate');
    const buf = new Uint8Array(await f.arrayBuffer());
    onProgress('Opening the download…');
    const files: Record<string, Uint8Array> = await new Promise((res, rej) =>
      unzip(buf, { filter: (e) => TEXT.test(e.name) && e.originalSize <= MAX_FILE }, (err, out) => (err ? rej(err) : res(out))));
    const names = Object.keys(files); const dec = new TextDecoder();
    for (let i = 0; i < names.length; i++) {
      if (i % 25 === 0) { onProgress(`Checking ${i + 1} of ${names.length} files…`); await new Promise((r) => setTimeout(r, 0)); }
      scanText(dec.decode(files[names[i]]), names[i], acc);
    }
  } else if (TEXT.test(f.name)) {
    if (f.size > MAX_FILE) throw new Error('too_big');
    onProgress('Checking the file…');
    scanText(await f.text(), f.name, acc);
  } else throw new Error('unsupported');
  return [...acc.values()].sort((a, b) => b.count - a.count);
}
