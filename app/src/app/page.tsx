import Link from 'next/link';
import Halo, { HaloIcon } from '@/components/Halo';
import HeroDemo from '@/components/HeroDemo';
import Ring from '@/components/Ring';
import Aurora from '@/components/Aurora';
import Phone from '@/components/Phone';
import Marquee from '@/components/Marquee';
import StickyStory from '@/components/StickyStory';
import { PLATFORMS } from '@/lib/catalog';
import { BENEFITS, TOOLS } from '@/lib/value';
import type { Metadata } from 'next';
import { KIT_URL, SITE } from '@/lib/base';

export const metadata: Metadata = { alternates: { canonical: `${SITE}/`, languages: { en: `${SITE}/`, es: `${SITE}/es/` } } };

const faqs = [
  { q: 'Is it really free?', a: 'Yes. The full audit, the guides and the worksheet are free, with no account and no card.' },
  { q: 'Do you see my answers?', a: 'No. The audit runs in your browser and saves only on your device. We only count anonymous visits, never which apps you pick.' },
  { q: 'Can I use it to check my partner?', a: 'No, and that is on purpose. Marriage Mode only works on your own accounts, by you. Trust is built by choosing to share, not by checking.' },
  { q: 'Does deleting the app close my account?', a: 'Usually not. You need to delete the profile inside the app or on the website, and cancel billing where you paid. The checklist covers each step.' },
  { q: 'What if an app is not on the list?', a: 'Add it by name and you get the same steps: delete, cancel, remove, unsubscribe.' },
  { q: 'How does Couple Mode work?', a: 'Each of you adds a card with only what you choose to share, plus shared goals. It lives inside a private link you send each other, so there are no accounts and nothing is stored on our servers. Either of you can stop anytime.' },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-teal">{children}</p>;
}

export default function Home() {
  return (
    <>
      {/* HERO: cinematic */}
      <section className="relative isolate overflow-hidden">
        <Aurora className="absolute inset-0 -z-20 h-full w-full" />
        <div className="noise absolute inset-0 -z-10" aria-hidden="true" />
        <div className="grid-bg absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 text-center md:pt-24">
          <span className="rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-ink/80 backdrop-blur">
            <span className="size-1.5 rounded-full bg-lagoon shadow-[0_0_10px_#D9B77E]" /> Free · private · made for couples
          </span>
          <h1 className="rise rise-2 mx-auto mt-7 max-w-5xl text-[clamp(2.8rem,9vw,7rem)] font-bold leading-[0.95] tracking-[-0.04em]">
            Close your dating chapter. <span className="text-shimmer">Completely.</span>
          </h1>
          <p className="rise rise-3 mx-auto mt-7 max-w-2xl text-lg text-ink/75 sm:text-xl">
            Marriage Mode finds every dating account you ever opened and walks you through closing it for good: profile, billing, app and emails. Then share the clean slate with your partner.
          </p>
          <div className="rise rise-4 mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/audit/" className="glow-mango min-h-12 rounded-full bg-mango px-8 py-4 text-lg font-semibold text-night hover:brightness-110">Start my free audit →</Link>
            <Link href="#how" className="min-h-12 rounded-full border border-white/15 bg-white/5 px-8 py-4 text-lg font-semibold backdrop-blur hover:border-lagoon/60">See how it works</Link>
          </div>
        </div>
        <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-6">
          <div className="absolute left-1/2 top-10 -z-10 w-[520px] max-w-[95vw] -translate-x-1/2 opacity-70" aria-hidden="true"><Halo className="h-auto w-full" /></div>
          <Phone tilt><HeroDemo /></Phone>
          <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
            {[['left-[6%] top-[18%]', 'Tinder', 'Closed', 'float'], ['right-[5%] top-[28%]', 'Billing', 'Cancelled', 'float float-2'], ['left-[9%] bottom-[22%]', 'Emails', 'Stopped', 'float float-3'], ['right-[8%] bottom-[16%]', 'Partner', 'Linked 💞', 'float']].map(([pos, a, b, f]) => (
              <div key={a} className={`glass absolute ${pos} ${f} flex items-center gap-3 px-4 py-3 shadow-2xl`}>
                <span className="grid size-8 place-items-center rounded-full bg-lagoon text-sm text-night shadow-[0_0_16px_#D9B77E]">✓</span>
                <div className="text-left leading-tight"><p className="text-sm font-semibold">{a}</p><p className="text-xs text-ink/60">{b}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APPS MARQUEE */}
      <section className="border-y border-white/[0.06] bg-white/[0.02]">
        <p className="pt-6 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-ink/50">Step-by-step for {PLATFORMS.length} dating apps and sites</p>
        <Marquee />
      </section>

      {/* BEFORE / AFTER */}
      <section className="mx-auto max-w-6xl px-4 pt-28">
        <Eyebrow>What stays behind</Eyebrow>
        <h2 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">You committed. Your phone didn&apos;t get the memo.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2 [&>*]:min-w-0">
          <div className="relative overflow-hidden rounded-[2rem] border border-coral/25 bg-coral/[0.05] p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-coral">Before</p>
            <div className="mt-5 space-y-3">
              {[['Someone new liked you 👀', 'Dating app · now'], ['Your subscription renewed: $29.99', 'App Store · 2h ago'], ['You have 3 new matches waiting', 'Email · yesterday'], ['Your profile is getting views', 'Dating app · 3d ago']].map(([t, m], i) => (
                <div key={t} className="flex items-center gap-3 rounded-2xl bg-night/70 p-3.5 ring-1 ring-white/10" style={{ transform: `rotate(${[-1.5, 1, -0.5, 1.5][i]}deg)` }}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-coral/20 text-coral">!</span>
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{t}</p><p className="text-xs text-ink/50">{m}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="halo-border"><div className="relative h-full overflow-hidden rounded-[2rem] bg-deep/95 p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-lagoon">After Marriage Mode</p>
            <div className="mt-5 flex flex-col items-center gap-4 text-center">
              <Ring value={100} size={150} />
              <p className="text-2xl font-bold">Clean slate.</p>
              <p className="max-w-xs text-ink/65">Profiles deleted, billing cancelled, apps gone, emails stopped. Nothing old in the way.</p>
            </div>
          </div></div>
        </div>
      </section>

      {/* VALUE: benefits */}
      <section id="value" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-24">
        <Eyebrow>Why it matters</Eyebrow>
        <h2 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">What you get from a clean slate</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 [&>*]:min-w-0">
          {BENEFITS.map((b) => (
            <div key={b.icon} className="glass p-6">
              <span className="grid size-12 place-items-center rounded-2xl bg-lagoon/15 text-2xl ring-1 ring-lagoon/40" aria-hidden="true">{b.icon}</span>
              <h3 className="mt-4 text-xl font-semibold">{b.en.t}</h3>
              <p className="mt-2 text-ink/70">{b.en.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VALUE: tools */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <Eyebrow>Everything included, free</Eyebrow>
        <h2 className="mt-3 max-w-3xl text-3xl font-bold sm:text-4xl">Every tool you need, in one private place</h2>
        <p className="mt-3 max-w-2xl text-ink/70">Each one does a real job, so nothing old is left behind.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
          {TOOLS.map((x) => (
            <div key={x.id} className="glass flex gap-4 p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-lagoon text-lg font-bold text-night shadow-[0_0_16px_-4px_#D9B77E]" aria-hidden="true">{x.icon}</span>
              <div><h3 className="font-semibold">{x.en.t}</h3><p className="mt-1 text-sm text-ink/70">{x.en.v}</p></div>
            </div>
          ))}
        </div>
        <Link href="/audit/" className="glow-mango mt-8 inline-block rounded-full bg-mango px-8 py-4 text-lg font-semibold text-night hover:brightness-110">Start my free audit →</Link>
      </section>

      {/* HOW IT WORKS: sticky phone story */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-28">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Three steps to a clean slate</h2>
        <div className="mt-6"><StickyStory /></div>
      </section>

      {/* PRIVACY PROMISE */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <div className="glass grid gap-6 p-7 sm:p-10 md:grid-cols-[1fr_1.4fr]">
          <div><Eyebrow>Built on trust</Eyebrow><h2 className="mt-3 text-3xl font-bold">A tool for you. Never a tool to check on someone.</h2></div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[['Your accounts only', 'It only works on accounts you own, by you.'], ['Nothing uploaded', 'Your audit lives on your device.'], ['You choose what to share', 'Your partner sees only the summary you send.'], ['Leave anytime', 'Clear everything with one tap.']].map(([t, d]) => (
              <li key={t} className="flex gap-3"><span className="mt-1 text-lagoon">✓</span><div><p className="font-semibold">{t}</p><p className="text-sm text-ink/65">{d}</p></div></li>
            ))}
          </ul>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-24">
        <Eyebrow>Pricing</Eyebrow>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">The important part is free. Always.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3 [&>*]:min-w-0">
          <div className="halo-border"><div className="h-full rounded-[1.75rem] bg-deep/95 p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal">Free</p>
            <p className="mt-2 font-display text-4xl font-bold">$0</p>
            <ul className="mt-4 space-y-2 text-sm text-ink/75">{['Full private audit for 29 apps', 'Inbox and web self-search', 'Dashboard, milestones, report', 'Couple Mode and partner space', 'Sync across your devices', 'Guides and couples worksheet'].map((t) => <li key={t} className="flex gap-2"><span className="text-lagoon">✓</span>{t}</li>)}</ul>
            <Link href="/audit/" className="glow-mango mt-6 inline-block rounded-full bg-mango px-6 py-3 text-sm font-semibold text-night">Start free</Link>
          </div></div>
          <div className="glass p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mango">Clean Slate Kit</p>
            <p className="mt-2 font-display text-4xl font-bold">$19 <span className="text-base font-normal text-ink/55">one time</span></p>
            <ul className="mt-4 space-y-2 text-sm text-ink/75">{['Printable cleanup report', '30-day boundaries plan', '12 conversation cards', 'Monthly re-check'].map((t) => <li key={t} className="flex gap-2"><span className="text-mango">✓</span>{t}</li>)}</ul>
            {KIT_URL ? <a href={KIT_URL} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block rounded-full px-6 py-3 text-sm font-semibold ring-1 ring-mango/50">Get the kit ↗</a> : <p className="mt-6 text-sm text-ink/50">Coming very soon</p>}
          </div>
          <div className="glass p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-violet">AI Relationship Coach</p>
            <p className="mt-2 font-display text-2xl font-bold">Add-ons</p>
            <ul className="mt-4 space-y-2 text-sm text-ink/75">{['Coach chat', 'Couple sessions by chat or email', 'Voice sessions', 'Live video coach'].map((t) => <li key={t} className="flex gap-2"><span className="text-violet">✓</span>{t}</li>)}</ul>
            <p className="mt-6 text-sm text-ink/50">Coming later. Always clearly AI, never a replacement for a licensed counselor.</p>
          </div>
        </div>
      </section>

      {/* WHO BUILT THIS */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <div className="glass grid items-center gap-8 p-7 sm:p-10 md:grid-cols-[auto_1fr]">
          <div className="relative mx-auto size-40 shrink-0" aria-hidden="true">
            <div className="halo-sweep" />
            <Halo className="h-full w-full" />
          </div>
          <div>
            <Eyebrow>Who built this</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold">Made by a couple, for couples</h2>
            <p className="mt-3 text-ink/75">Marriage Mode comes from Tiffany and Reco of Upfront Consulting with Tiff &amp; Reco LLC. Faith, trust and family are the foundation of their partnership, and of this product. Tiffany spent 10+ years building and leading teams and systems; Reco is a former yacht captain who was responsible for everyone on board. Together they built the tool they wished existed: private, kind, and on your side.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pt-24">
        <Eyebrow>Questions</Eyebrow>
        <h2 className="mt-3 text-3xl font-bold">Good to know</h2>
        <div className="mt-8 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="glass group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{f.q}<span className="text-teal transition group-open:rotate-45">+</span></summary>
              <p className="mt-3 text-ink/70">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* COUPLE MODE */}
      <section id="couple" className="mx-auto max-w-4xl scroll-mt-24 px-4 pt-24">
        <div className="halo-border">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-deep/90 p-7 sm:p-10">
            <div className="grid-bg absolute inset-0 opacity-60" aria-hidden="true" />
            <div className="relative grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
              <div>
                <Eyebrow>New · Couple Mode</Eyebrow>
                <h2 className="mt-3 text-3xl font-bold">A private space for the two of you</h2>
                <p className="mt-2 text-ink/70">Shared goals and the progress each of you chooses to share. It lives inside a private link you send each other: no accounts, nothing stored on our servers, and either of you can stop anytime.</p>
                <Link href="/couple/" className="glow-mango mt-6 inline-block rounded-full bg-mango px-7 py-3.5 font-semibold text-night hover:brightness-110">Open Couple Mode →</Link>
              </div>
              <div className="hidden justify-center md:flex" aria-hidden="true"><Halo className="h-auto w-56" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative isolate mx-auto mt-28 max-w-6xl overflow-hidden rounded-[2.5rem] px-4 py-24 text-center">
        <Aurora className="absolute inset-0 -z-10 h-full w-full" />
        <h2 className="text-4xl font-bold sm:text-6xl">Twenty minutes. <span className="text-shimmer">Nothing left behind.</span></h2>
        <Link href="/audit/" className="glow-mango mt-9 inline-block rounded-full bg-mango px-9 py-4 text-lg font-semibold text-night hover:brightness-110">Start my free audit →</Link>
      </section>
    </>
  );
}
