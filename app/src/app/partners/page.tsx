import type { Metadata } from 'next';
import Link from 'next/link';
import Aurora from '@/components/Aurora';
import PartnerForm from '@/components/PartnerForm';
import { PLATFORMS } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'For counselors, clergy and wedding pros: Marriage Mode partners',
  description: 'Give the couples you serve a free, private way to close their dating chapter before the wedding. Free partner kit for premarital counselors, pastors, coaches and wedding professionals. By Upfront Consulting with Tiff & Reco LLC.',
};

const WHO = [
  ['Premarital and couples counselors', 'A practical homework step that opens honest conversations about the past, without anyone checking on anyone.'],
  ['Pastors and ministry leaders', 'Fits premarital and marriage programs: faith-friendly, private and free for every couple you serve.'],
  ['Relationship coaches', 'A ready tool for the “clean slate” conversation, with a worksheet and progress the couple chooses to share.'],
  ['Wedding planners, officiants and venues', 'A thoughtful extra for engaged couples that costs you nothing and reflects well on your service.'],
];

const GET = [
  ['Free for your couples', `A private audit with exact steps for ${PLATFORMS.length} dating apps and sites, in English and Spanish. No account needed.`],
  ['Ready-to-use materials', 'The couples worksheet, the engagement checklist and a short message you can paste into an email or handout.'],
  ['Built on consent', 'Self-led only, no surveillance features, sharing is opt-in, and either partner can stop anytime. Safe to recommend.'],
  ['Early access', 'Partners hear first about practitioner tools as they launch.'],
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-teal">{children}</p>;
}

export default function Partners() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <Aurora className="absolute inset-0 -z-20 h-full w-full" />
        <div className="grid-bg absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-16 text-center md:pt-24">
          <Eyebrow>Partner program · free</Eyebrow>
          <h1 className="mx-auto mt-5 max-w-4xl text-[clamp(2.4rem,7vw,5rem)] font-bold leading-[1] tracking-[-0.03em]">Help your couples start with a <span className="text-shimmer">clean slate.</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink/75">For premarital counselors, pastors, coaches and wedding pros. Marriage Mode gives the couples you serve a free, private way to close old dating accounts, subscriptions and emails before the wedding.</p>
          <a href="#join" className="glow-mango mt-8 inline-block rounded-full bg-mango px-8 py-4 text-lg font-semibold text-night hover:brightness-110">Get the free partner kit →</a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16">
        <Eyebrow>Who it&apos;s for</Eyebrow>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Made for the people couples already trust</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
          {WHO.map(([t, d]) => <div key={t} className="glass p-6"><h3 className="text-lg font-semibold">{t}</h3><p className="mt-2 text-ink/70">{d}</p></div>)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20">
        <Eyebrow>What you get</Eyebrow>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Value for your couples, zero cost to you</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 [&>*]:min-w-0">
          {GET.map(([t, d]) => <div key={t} className="glass p-6"><span className="grid size-10 place-items-center rounded-full bg-lagoon text-night shadow-[0_0_16px_-4px_#D9B77E]" aria-hidden="true">✓</span><h3 className="mt-4 font-semibold">{t}</h3><p className="mt-2 text-sm text-ink/70">{d}</p></div>)}
        </div>
        <p className="mt-6 text-sm text-ink/60">See it first: <Link prefetch={false} href="/audit/" className="text-teal underline">try the free audit</Link> · <Link prefetch={false} href="/worksheet/" className="text-teal underline">couples worksheet</Link> · <Link prefetch={false} href="/safety/" className="text-teal underline">our safety and consent rules</Link></p>
      </section>

      <section id="join" className="mx-auto max-w-3xl scroll-mt-24 px-4 pt-20">
        <div className="halo-border"><div className="rounded-[1.75rem] bg-deep/95 p-6 sm:p-8">
          <Eyebrow>Join in one minute</Eyebrow>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Become a Marriage Mode partner</h2>
          <p className="mt-2 mb-6 text-ink/70">Free. Your kit appears as soon as you send this.</p>
          <PartnerForm />
        </div></div>
        <p className="mt-6 text-center text-sm text-ink/55">Marriage Mode by Upfront Consulting with Tiff &amp; Reco LLC · a couple-founded company</p>
      </section>
    </>
  );
}
