// Mia's word-for-word lip sync, built in-house and free.
// The voice tells us which mouth shape (viseme) is sounding and when. The neural voice gives exact
// timings; the device voice gives word-by-word timing, and we spell each word into mouth shapes.
// The face draws real mouth shapes cut from the actor's own footage (public/coach/mia-mouths.webp).

export type Shape = { v: string; t: number; d: number }; // viseme, start (performance.now ms), duration ms

// Letters → Oculus visemes (works for English and Spanish well enough for a natural look).
const DI: Record<string, string> = { th: 'TH', ch: 'CH', sh: 'CH', ph: 'FF', ng: 'nn', oo: 'U', ee: 'I', ll: 'DD', qu: 'kk', ou: 'O', ow: 'O' };
const ONE: Record<string, string> = { a: 'aa', á: 'aa', e: 'E', é: 'E', i: 'I', í: 'I', y: 'I', o: 'O', ó: 'O', u: 'U', ú: 'U', ü: 'U', w: 'U',
  b: 'PP', m: 'PP', p: 'PP', f: 'FF', v: 'FF', d: 'DD', t: 'DD', l: 'DD', n: 'nn', ñ: 'nn', k: 'kk', g: 'kk', c: 'kk', q: 'kk', x: 'kk', h: 'kk',
  s: 'SS', z: 'SS', j: 'CH', r: 'RR' };
const VOWEL = new Set(['aa', 'E', 'I', 'O', 'U']);

export function wordShapes(word: string, start: number, ms: number): Shape[] {
  const w = word.toLowerCase().replace(/[^a-záéíóúüñ']/g, ''); const vs: string[] = [];
  for (let i = 0; i < w.length; i++) {
    const two = DI[w.slice(i, i + 2)]; if (two) { vs.push(two); i++; continue; }
    const one = ONE[w[i]]; if (one && one !== vs[vs.length - 1]) vs.push(one);
  }
  if (!vs.length) return [];
  // Vowels hold about twice as long as consonants, like real speech.
  const wt = vs.map((v) => (VOWEL.has(v) ? 2 : 1)); const sum = wt.reduce((a, b) => a + b, 0); let t = start;
  return vs.map((v, i) => { const d = (ms * wt[i]) / sum; const s = { v, t, d }; t += d; return s; });
}

// Rough speaking time for a word with the device voice.
export const wordMs = (w: string) => Math.max(140, Math.min(650, 70 + w.length * 62));

export class MouthTrack {
  private s: Shape[] = [];
  add(shapes: Shape[]) { const now = performance.now(); this.s = this.s.filter((x) => x.t + x.d > now - 200).concat(shapes); }
  clearFrom(t: number) { this.s = this.s.filter((x) => x.t < t); }
  clear() { this.s = []; }
  // Current mouth: up to two shapes with weights, blending smoothly between sounds (coarticulation).
  at(now: number): [string, number][] {
    const out: [string, number][] = [];
    for (const x of this.s) {
      if (x.v === 'sil' || now < x.t - 70 || now > x.t + x.d + 70) continue;
      const w = Math.max(0, Math.min(1, (now - x.t + 55) / 75, (x.t + x.d + 55 - now) / 75));
      if (w > 0) { const f = out.find((o) => o[0] === x.v); if (f) f[1] = Math.max(f[1], w); else out.push([x.v, w]); }
    }
    return out.sort((a, b) => b[1] - a[1]).slice(0, 2);
  }
}
