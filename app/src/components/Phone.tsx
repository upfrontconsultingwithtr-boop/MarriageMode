// A phone frame for showing real product screens.
export default function Phone({ children, tilt = false, className = '' }: { children: React.ReactNode; tilt?: boolean; className?: string }) {
  return (
    <div className={`phone-wrap ${tilt ? 'phone-tilt' : ''} ${className}`}>
      <div className="relative rounded-[2.6rem] bg-gradient-to-b from-white/25 via-white/10 to-white/5 p-[2px] shadow-[0_40px_120px_-30px_rgb(52_226_155/.45),0_30px_80px_-40px_rgb(255_111_174/.5)]">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-night">
          <div className="absolute left-1/2 top-2.5 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />
          <div className="max-h-[620px] overflow-hidden px-3 pb-4 pt-12">{children}</div>
        </div>
      </div>
    </div>
  );
}
