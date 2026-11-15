'use client';
import { useEffect, useRef, useState } from 'react';
import Phone from './Phone';
import Ring from './Ring';

const STEPS = [
  { k: '01', t: 'Pick every app you ever used', d: 'Search 29 apps or add any other. Not sure? Scan your own Google or Facebook download, or search your inbox, all on your device.' },
  { k: '02', t: 'Close each one, step by step', d: 'Delete the profile, cancel the billing, remove the app, stop the emails. Every step says exactly where to tap, and your score climbs as you go.' },
  { k: '03', t: 'Share with your partner, if you choose', d: 'Link with your partner to message, set goals together, and share only the progress you pick. Either of you can leave anytime.' },
];

function Screen({ i }: { i: number }) {
  if (i === 0) return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal">My apps</p>
      <div className="flex flex-wrap gap-1.5">{['Tinder', 'Hinge', 'Bumble', 'Match', 'OkCupid', 'Feeld', 'Grindr', 'HER', 'Raya', 'Muzz'].map((n, j) => (
        <span key={n} className={`rounded-full px-3 py-1.5 text-xs ring-1 ${j % 3 === 0 ? 'bg-lagoon/15 ring-lagoon/60' : 'ring-white/10 text-ink/60'}`}>{j % 3 === 0 ? '✓ ' : ''}{n}</span>))}</div>
      <div className="rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10"><p className="text-xs font-semibold">Found in your download</p><p className="mt-1 text-xs text-ink/60">Tinder · mentioned 4× · apps.json</p></div>
    </div>);
  if (i === 1) return (
    <div className="space-y-3">
      <div className="flex justify-center"><Ring value={76} size={120} /></div>
      {[['Delete your Tinder account', true], ['Cancel any Tinder subscription', true], ['Remove the app', true], ['Stop the emails', false]].map(([t, d]) => (
        <div key={t as string} className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] p-2.5 text-xs ring-1 ring-white/10"><span className={`grid size-5 place-items-center rounded-md text-[10px] ${d ? 'bg-lagoon text-night' : 'ring-1 ring-white/25'}`}>{d ? '✓' : ''}</span><span className={d ? 'text-ink/60 line-through' : ''}>{t as string}</span></div>))}
    </div>);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-full bg-lagoon/20 text-sm font-semibold text-teal">T</span><span>💞</span><span className="grid size-9 place-items-center rounded-full bg-mango/20 text-sm font-semibold text-mango">R</span><span className="text-xs font-semibold">You &amp; your partner</span></div>
      <div className="rounded-2xl bg-white/[0.04] p-3 text-xs ring-1 ring-white/10"><p className="text-teal">Shared with you</p><p className="mt-1">5/5 accounts deleted ✓</p></div>
      <div className="space-y-1.5 text-xs"><p className="ml-auto w-fit rounded-2xl bg-mango/15 px-3 py-2 ring-1 ring-mango/30">All done on my side ❤</p><p className="w-fit rounded-2xl bg-lagoon/10 px-3 py-2 ring-1 ring-lagoon/30">Same here. Proud of us.</p></div>
    </div>);
}

export default function StickyStory() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i)); }), { rootMargin: '-45% 0px -45% 0px' });
    refs.current.forEach((r) => r && io.observe(r)); return () => io.disconnect();
  }, []);
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <ol className="space-y-6 md:space-y-[28vh] md:py-[14vh]">
        {STEPS.map((s, i) => (
          <li key={s.k} data-i={i} ref={(el) => { refs.current[i] = el; }} className={`rounded-3xl p-6 transition duration-500 ${active === i ? 'glass' : 'opacity-60'}`}>
            <span className="font-mono text-sm text-teal">{s.k}</span>
            <h3 className="mt-2 text-2xl font-bold sm:text-3xl">{s.t}</h3>
            <p className="mt-2 text-ink/70">{s.d}</p>
            <div className="mt-5 md:hidden"><Phone><Screen i={i} /></Phone></div>
          </li>
        ))}
      </ol>
      <div className="hidden md:block"><div className="sticky top-28 mx-auto max-w-[300px]"><Phone><div key={active} className="rise"><Screen i={active} /></div></Phone></div></div>
    </div>
  );
}
