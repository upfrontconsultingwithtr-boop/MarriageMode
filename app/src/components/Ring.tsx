// Glowing progress ring. Color shifts green → pink as it completes.
export default function Ring({ value, size = 96, label, sub }: { value: number; size?: number; label?: string; sub?: string }) {
  const r = 40, c = 2 * Math.PI * r, done = value >= 100;
  const id = `rg-${label?.replace(/\W/g, '') ?? 'x'}`;
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${label ?? 'Progress'}: ${value} out of 100`}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#D9B77E" /><stop offset="1" stopColor={done ? '#D9B77E' : '#E8A4A9'} /></linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#fff" strokeOpacity=".08" strokeWidth="9" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={`url(#${id})`} strokeWidth="9" strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(value, 100) / 100)} transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)', filter: 'drop-shadow(0 0 6px rgb(217 183 126 / .6))' }} />
        <text x="50" y="57" textAnchor="middle" fontSize="22" fontWeight="700" fill="currentColor" fontFamily="Inter Variable">{value}</text>
      </svg>
      {label && <div className="leading-tight"><div className="text-sm font-semibold">{label}</div>{sub && <div className="text-xs text-ink/55">{sub}</div>}</div>}
    </div>
  );
}
