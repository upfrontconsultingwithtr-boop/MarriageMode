import { PLATFORMS } from '@/lib/catalog';
// Endless strip of the apps we cover (pure CSS, pauses on hover, still under reduced motion).
export default function Marquee() {
  const names = PLATFORMS.map((p) => p.name);
  const row = (k: string) => (
    <div className="marquee-row flex shrink-0 items-center gap-10 pr-10" aria-hidden={k === 'b'}>
      {names.map((n) => <span key={k + n} className="whitespace-nowrap font-display text-xl font-semibold text-ink/35 transition hover:text-ink">{n}</span>)}
    </div>
  );
  return (
    <div className="marquee relative flex overflow-hidden py-6 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]" aria-label={`Covers ${names.length} dating apps and sites`}>
      {row('a')}{row('b')}
    </div>
  );
}
