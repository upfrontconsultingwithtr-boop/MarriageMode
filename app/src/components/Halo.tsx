// Signature halo graphic: two interlocking glowing rings inside HUD-style orbits.
// Pure SVG: sharp at any size, ~2 KB, no image requests.
export default function Halo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 600" className={className} role="img" aria-label="Two interlocking glowing rings">
      <defs>
        <radialGradient id="h-core" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#2CE0D4" stopOpacity=".35" />
          <stop offset=".45" stopColor="#8B7CFF" stopOpacity=".12" />
          <stop offset="1" stopColor="#03080C" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="h-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9FFFF8" /><stop offset=".5" stopColor="#2CE0D4" /><stop offset="1" stopColor="#0B5563" />
        </linearGradient>
        <linearGradient id="h-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE3A3" /><stop offset=".5" stopColor="#FFB627" /><stop offset="1" stopColor="#FF7A66" />
        </linearGradient>
        <filter id="h-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id="h-top"><rect x="0" y="0" width="600" height="300" /></clipPath>
      </defs>

      <circle cx="300" cy="300" r="300" fill="url(#h-core)" className="pulse-soft" />

      {/* HUD orbits */}
      <g className="spin-slow" fill="none" stroke="#5EE6DC">
        <circle cx="300" cy="300" r="270" strokeOpacity=".18" strokeDasharray="2 10" />
        <circle cx="300" cy="300" r="250" strokeOpacity=".10" />
        <circle cx="300" cy="30" r="5" fill="#2CE0D4" stroke="none" filter="url(#h-glow)" />
      </g>
      <g className="spin-rev" fill="none" stroke="#FFB627">
        <circle cx="300" cy="300" r="222" strokeOpacity=".16" strokeDasharray="60 14 4 14" />
        <circle cx="522" cy="300" r="4" fill="#FFB627" stroke="none" filter="url(#h-glow)" />
      </g>
      <g stroke="#5EE6DC" strokeOpacity=".25">
        <line x1="300" y1="8" x2="300" y2="44" /><line x1="300" y1="556" x2="300" y2="592" />
        <line x1="8" y1="300" x2="44" y2="300" /><line x1="556" y1="300" x2="592" y2="300" />
      </g>

      {/* Interlocking rings: draw A, then B, then A's top half again so they link */}
      <g fill="none" strokeWidth="16" strokeLinecap="round" filter="url(#h-glow)">
        <circle cx="250" cy="300" r="105" stroke="url(#h-a)" />
        <circle cx="350" cy="300" r="105" stroke="url(#h-b)" />
        <path d="M 250 195 A 105 105 0 0 1 355 300" stroke="url(#h-a)" clipPath="url(#h-top)" />
      </g>
      <g fill="none" strokeWidth="2" strokeOpacity=".9">
        <circle cx="250" cy="300" r="105" stroke="#E9FFFD" strokeOpacity=".35" />
        <circle cx="350" cy="300" r="105" stroke="#FFF4D6" strokeOpacity=".35" />
      </g>
    </svg>
  );
}

// Small halo used as an icon in cards
export function HaloIcon({ tone = 'lagoon' }: { tone?: 'lagoon' | 'mango' | 'violet' }) {
  const c = tone === 'mango' ? '#FFB627' : tone === 'violet' ? '#8B7CFF' : '#2CE0D4';
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill={c} fillOpacity=".08" />
      <circle cx="24" cy="24" r="15" fill="none" stroke={c} strokeWidth="3" style={{ filter: `drop-shadow(0 0 6px ${c})` }} />
      <circle cx="24" cy="24" r="21" fill="none" stroke={c} strokeOpacity=".35" strokeDasharray="2 4" />
    </svg>
  );
}
