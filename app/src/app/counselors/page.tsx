import type { Metadata } from 'next';
import Aurora from '@/components/Aurora';
import CounselorsApp from './CounselorsApp';

export const metadata: Metadata = {
  title: 'Talk to a real, licensed couples counselor | Marriage Mode',
  description: 'Find a licensed couples counselor and request a session by video, phone or in person. Counselors are license-checked before they are listed. Marriage Mode by Upfront Consulting with Tiff & Reco LLC.',
};

export default function Counselors() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <Aurora className="absolute inset-0 -z-20 h-full w-full" />
        <div className="mx-auto max-w-4xl px-4 pb-10 pt-16 text-center md:pt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-mango">Real counselors · licensed · license-checked</p>
          <h1 className="mx-auto mt-5 text-[clamp(2.2rem,6vw,4.2rem)] font-bold leading-[1.05] tracking-[-0.03em]">Talk to a real, <span className="text-shimmer">licensed</span> couples counselor.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink/75">Mia, our free AI coach, is great for everyday work. When you want a human expert, pick a licensed counselor below and request a session. You book and pay the counselor directly.</p>
        </div>
      </section>
      <CounselorsApp />
    </>
  );
}
