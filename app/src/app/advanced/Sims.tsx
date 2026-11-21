'use client';
// Two interactive simulators for the Marriage Mode Advanced landing page.
// 1) Sweep simulator: runs the REAL sweep engine on the fictional demo files, live, in the visitor's browser.
// 2) Feed simulator: shows how an attention algorithm learns from what you pause on (Learn lesson 4).
import { useEffect, useRef, useState } from 'react';
import { sweepInbox, sweepSocial, sweepDevice, parseDemoSocial, parseDevice, CAT_LABEL, type Flag } from '@/lib/adv/sweep';
import { DEMO_INBOX, DEMO_SOCIAL, DEMO_DEVICE, DEMO_EXES } from '@/lib/adv/demo';

type T = (en: string, es: string) => string;

function demoFlags(): Flag[] {
  const inbox = sweepInbox({ file: 'demo-inbox.txt', text: DEMO_INBOX }); const k = { exes: DEMO_EXES, pastMatches: inbox.matches };
  return [...inbox.flags, ...parseDemoSocial(DEMO_SOCIAL, 'demo-social.json').flatMap((d) => sweepSocial(d, k)), ...sweepDevice(parseDevice(DEMO_DEVICE, 'demo-device.json'), k)];
}

export function SweepSim({ t, es }: { t: T; es: boolean }) {
  const [shown, setShown] = useState<Flag[]>([]); const [running, setRunning] = useState(false); const [file, setFile] = useState(''); const timer = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timer.current.forEach(clearTimeout), []);
  const run = () => {
    timer.current.forEach(clearTimeout); timer.current = []; setShown([]); setRunning(true);
    const all = demoFlags(); const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; const step = reduce ? 0 : 420;
    all.forEach((f, i) => timer.current.push(setTimeout(() => { setShown((x) => [...x, f]); setFile(f.source.replace(/.*\((.*)\)/, '$1')); if (i === all.length - 1) setRunning(false); }, i * step)));
  };
  const risk = shown.filter((f) => f.risque).length;
  return (
    <div className="adv-glass adv-edge rounded-[2rem] p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm text-mango">{t('Live simulator', 'Simulador en vivo')}</p><h3 className="font-display text-2xl font-semibold">{t('Run a real Sweep on fictional data', 'Haz una Revisión real con datos ficticios')}</h3></div>
        <button onClick={run} disabled={running} className="btn-press min-h-12 rounded-full bg-mango px-6 font-semibold text-night disabled:opacity-60">{running ? t('Sweeping…', 'Revisando…') : shown.length ? t('Run again', 'Repetir') : t('Run the Sweep', 'Hacer la Revisión')}</button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="space-y-3 text-sm">
          {['demo-inbox.txt', 'demo-social.json', 'demo-device.json'].map((f) => <div key={f} className={`flex items-center gap-2 rounded-xl px-3 py-2 ring-1 transition ${file === f && running ? 'bg-mango/10 ring-mango/50' : 'ring-white/10'}`}><span aria-hidden="true">{f.includes('inbox') ? '✉️' : f.includes('social') ? '📱' : '☎️'}</span>{f}</div>)}
          <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-ink/60">{t('Flags', 'Marcas')}: <strong className="text-ink">{shown.length}</strong></p><p className="text-ink/60">{t('Risque', 'Riesgoso')}: <strong className="text-mango">{risk}</strong></p><p className="mt-1 text-xs text-ink/45">{t('Runs in your browser. Nothing uploaded.', 'Corre en tu navegador. No se sube nada.')}</p></div>
        </div>
        <ul aria-live="polite" className="max-h-[360px] min-h-[220px] space-y-2 overflow-y-auto pr-1">
          {!shown.length && <li className="grid h-[220px] place-items-center rounded-2xl text-ink/45 ring-1 ring-dashed ring-white/10">{t('Press “Run the Sweep” to watch it work.', 'Toca “Hacer la Revisión” para verla trabajar.')}</li>}
          {shown.map((f) => <li key={f.id} className="rise rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/[0.07]">
            <div className="flex flex-wrap items-center gap-2 text-sm"><strong>{f.who}</strong><span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">{CAT_LABEL[f.category][es ? 1 : 0]}</span>{f.risque && <span className="rounded-full bg-mango/15 px-2 py-0.5 text-[11px] text-mango">{CAT_LABEL.risque[es ? 1 : 0]}</span>}</div>
            <p className="mt-1 text-sm text-ink/75">{es ? f.whyEs : f.why}</p><p className="mt-0.5 truncate text-[11px] text-ink/40">{f.evidence}</p></li>)}
        </ul>
      </div>
    </div>
  );
}

const POSTS = [
  { k: 'friends', e: '🏡', en: 'Your cousin’s new house', es: 'La casa nueva de tu prima' }, { k: 'fitness', e: '💪', en: 'Leg-day routine', es: 'Rutina de piernas' },
  { k: 'attractive', e: '😍', en: 'A stranger’s beach selfie', es: 'Selfie de playa de un desconocido' }, { k: 'news', e: '📰', en: 'Local news', es: 'Noticias locales' },
  { k: 'ex', e: '💔', en: '“People you may know”: your ex', es: '“Personas que quizás conozcas”: tu ex' }, { k: 'food', e: '🍝', en: 'Pasta recipe', es: 'Receta de pasta' },
];
const LABEL: Record<string, [string, string]> = { friends: ['Friends & family', 'Familia y amigos'], fitness: ['Fitness', 'Ejercicio'], attractive: ['Attractive strangers', 'Desconocidos atractivos'], news: ['News', 'Noticias'], ex: ['Exes & old matches', 'Exparejas y matches'], food: ['Food', 'Comida'] };

export function FeedSim({ t, es }: { t: T; es: boolean }) {
  const [w, setW] = useState<Record<string, number>>(() => Object.fromEntries(POSTS.map((p) => [p.k, 1])));
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  const feed = [...POSTS].sort((a, b) => w[b.k] - w[a.k]).slice(0, 4);
  const linger = (k: string) => setW((x) => ({ ...x, [k]: x[k] + 1.5 }));
  const notInterested = (k: string) => setW((x) => ({ ...x, [k]: Math.max(0.2, x[k] * 0.4) }));
  return (
    <div className="adv-glass adv-edge rounded-[2rem] p-5 sm:p-7">
      <p className="text-sm text-mango">{t('Simulator', 'Simulador')}</p>
      <h3 className="font-display text-2xl font-semibold">{t('Watch a feed learn from you', 'Mira cómo un feed aprende de ti')}</h3>
      <p className="mt-1 text-sm text-ink/60">{t('Tap “Pause on it” and the ranking shifts toward it. Tap “Not interested” to retrain. This is a simplified model of how attention ranking works.', 'Toca “Detenerte” y el orden cambia hacia eso. Toca “No me interesa” para reentrenar. Es un modelo simplificado de cómo funciona el orden por atención.')}</p>
      <div className="mt-5 grid gap-5 md:grid-cols-[1fr_1fr]">
        <ol className="space-y-2">{feed.map((p, i) => <li key={p.k} className="rise flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/[0.07]">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/5 text-2xl" aria-hidden="true">{p.e}</span>
          <span className="min-w-0 grow text-sm"><span className="text-[11px] text-ink/45">#{i + 1} {t('in your feed', 'en tu feed')}</span><span className="block truncate">{es ? p.es : p.en}</span></span>
          <span className="flex shrink-0 flex-col gap-1"><button onClick={() => linger(p.k)} className="min-h-9 rounded-full bg-mango/15 px-3 text-xs text-mango">{t('Pause on it', 'Detenerte')}</button><button onClick={() => notInterested(p.k)} className="min-h-9 rounded-full px-3 text-xs text-ink/60 ring-1 ring-white/15">{t('Not interested', 'No me interesa')}</button></span></li>)}</ol>
        <div>
          <p className="text-sm font-medium">{t('What the algorithm thinks you want', 'Lo que el algoritmo cree que quieres')}</p>
          <ul className="mt-3 space-y-2.5">{POSTS.map((p) => { const pct = Math.round((w[p.k] / total) * 100); return <li key={p.k}><div className="flex justify-between text-xs text-ink/65"><span>{LABEL[p.k][es ? 1 : 0]}</span><span>{pct}%</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className={`h-full rounded-full transition-all duration-700 ${p.k === 'attractive' || p.k === 'ex' ? 'bg-gradient-to-r from-coral to-mango' : 'bg-gradient-to-r from-lagoon/70 to-lagoon'}`} style={{ width: `${pct}%` }} /></div></li>; })}</ul>
          <button onClick={() => setW(Object.fromEntries(POSTS.map((p) => [p.k, 1])))} className="mt-4 min-h-10 text-sm text-ink/60 underline underline-offset-4">{t('Reset', 'Reiniciar')}</button>
        </div>
      </div>
    </div>
  );
}
