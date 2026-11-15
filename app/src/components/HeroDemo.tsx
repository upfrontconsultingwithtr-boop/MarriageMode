'use client';
import { useState } from 'react';
import Link from 'next/link';
import Ring from './Ring';
import { buildSteps, score } from '@/lib/audit';
import { PLATFORMS } from '@/lib/catalog';

const DEMO = ['tinder', 'hinge', 'bumble', 'match', 'okcupid', 'feeld'];

// Live mini-audit: real scoring engine, nothing saved.
export default function HeroDemo() {
  const [closed, setClosed] = useState<string[]>(['hinge']);
  const steps = buildSteps({ platformIds: DEMO, custom: [] });
  const done = Object.fromEntries(closed.flatMap((id) => [[`${id}:delete`, true], [`${id}:app`, true], [`${id}:billing`, true], [`${id}:email`, true]]));
  const s = score(steps, done);
  const toggle = (id: string) => setClosed((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  return (
    <div className="glass relative overflow-hidden p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal">Try it · live demo</span>
        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-ink/60 ring-1 ring-white/10">nothing saved</span>
      </div>
      <p className="mt-3 text-sm text-ink/70">Tap the apps you&apos;ve fully closed:</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {DEMO.map((id) => {
          const on = closed.includes(id);
          return (
            <button key={id} onClick={() => toggle(id)} aria-pressed={on}
              className={`min-h-11 rounded-full px-4 text-sm font-medium ring-1 transition ${on ? 'bg-lagoon/15 text-ink ring-lagoon/70 shadow-[0_0_18px_-6px_#D9B77E]' : 'bg-white/[0.03] text-ink/70 ring-white/10 hover:ring-lagoon/40'}`}>
              {on ? '✓ ' : ''}{PLATFORMS.find((p) => p.id === id)!.name}
            </button>
          );
        })}
      </div>
      <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/[0.07] pt-5">
        <Ring value={s.organization} size={88} label="Clean-slate score" sub={`${s.accountsClosed} of ${s.accountsTotal} closed`} />
        <Link href="/audit/" className="glow-mango shrink-0 rounded-full bg-mango px-5 py-3 text-sm font-semibold text-night">Do mine →</Link>
      </div>
    </div>
  );
}
