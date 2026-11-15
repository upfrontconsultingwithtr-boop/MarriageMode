import Link from 'next/link';
import Waitlist from '@/components/Waitlist';
import Halo, { HaloIcon } from '@/components/Halo';
import HeroDemo from '@/components/HeroDemo';
import Ring from '@/components/Ring';
import { PLATFORMS } from '@/lib/catalog';

const facts = [
  `${PLATFORMS.length} dating apps covered`,
  'No account needed',
  'Nothing leaves your device',
  'Free',
];

const leftovers = [
  { t: 'Profiles that stay live', d: 'Deleting the app hides nothing. The profile can still show up for others.', tone: 'mango' as const },
  { t: 'Billing that never stopped', d: 'App store subscriptions keep charging after the app is gone.', tone: 'violet' as const },
  { t: '"Someone liked you" emails', d: 'Match alerts keep landing in the inbox you both see.', tone: 'lagoon' as const },
];

const steps = [
  { n: '01', t: 'Pick every app you ever used', d: `Search ${PLATFORMS.length} apps or add any other. Not sure? One tap searches your own inbox for old sign-ups.` },
  { n: '02', t: 'Close each one, step by step', d: 'Delete the profile, cancel the billing, remove the app, stop the emails. Every step says exactly where to tap.' },
  { n: '03', t: 'Share proof, if you choose', d: 'A simple summary for your partner that names no apps. You decide what it says, and whether to send it.' },
];

const faqs = [
  { q: 'Is it really free?', a: 'Yes. The full audit, the guides and the worksheet are free, with no account and no card.' },
  { q: 'Do you see my answers?', a: 'No. The audit runs in your browser and saves only on your device. We only count anonymous visits, never which apps you pick.' },
  { q: 'Can I use it to check my partner?', a: 'No, and that is on purpose. Marriage Mode only works on your own accounts, by you. Trust is built by choosing to share, not by checking.' },
  { q: 'Does deleting the app close my account?', a: 'Usually not. You need to delete the profile inside the app or on the website, and cancel billing where you paid. The checklist covers each step.' },
  { q: 'What if an app is not on the list?', a: 'Add it by name and you get the same steps: delete, cancel, remove, unsubscribe.' },
  { q: 'What is Couple Mode?', a: 'A coming feature: shared goals and a private space for two, where each person shares only what they choose and either can leave anytime.' },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-teal">{children}</p>;
}

export default function Home() {
  return (
    <>
      {/* HERO: promise + live demo */}
      <section className="relative isolate overflow-hidden">
        <div className="grid-bg absolute inset-0 -z-10" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-40 -top-24 -z-10 w-[720px] opacity-60 md:-right-24" aria-hidden="true"><Halo className="h-auto w-full" /></div>
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 overflow-hidden opacity-70" aria-hidden="true"><div className="grid-floor absolute -inset-x-1/2 top-0 h-[200%]" /></div>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-20 pt-14 md:grid-cols-[1.15fr_1fr] md:pt-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-lagoon/30 bg-lagoon/10 px-3 py-1 text-xs font-medium text-teal">
              <span className="size-1.5 rounded-full bg-lagoon shadow-[0_0_10px_#34E29B]" /> For the newly exclusive, engaged and married
            </span>
            <h1 className="mt-6 text-[2.6rem] font-bold leading-[1.04] sm:text-6xl">
              Close your dating chapter.<br /><span className="text-glow">Completely.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink/75">
              Marriage Mode finds every dating account you ever opened and walks you through closing it for good:
              profile, billing, app and emails. Private, free, done in about 20 minutes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/audit/" className="glow-mango min-h-12 rounded-full bg-mango px-7 py-3.5 font-semibold text-night hover:brightness-110">Start my free audit →</Link>
              <Link href="/engagement-checklist/" className="min-h-12 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 font-semibold backdrop-blur hover:border-lagoon/60">Just engaged? Read the checklist</Link>
            </div>
          </div>
          <HeroDemo />
        </div>
      </section>

      {/* FACTS STRIP: honest, checkable proof */}
      <section className="border-y border-white/[0.06] bg-white/[0.02]">
        <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-4 text-sm text-ink/70">
          {facts.map((f) => <li key={f} className="flex items-center gap-2"><span className="text-lagoon">✓</span>{f}</li>)}
        </ul>
      </section>

      {/* PROBLEM */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <Eyebrow>What stays behind</Eyebrow>
        <h2 className="mt-3 max-w-3xl text-3xl font-bold sm:text-4xl">You committed. Your phone didn&apos;t get the memo.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {leftovers.map((l) => (
            <div key={l.t} className="glass p-6"><HaloIcon tone={l.tone} /><h3 className="mt-4 text-lg font-semibold">{l.t}</h3><p className="mt-1 text-ink/65">{l.d}</p></div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS: numbered rail */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Three steps to a clean slate</h2>
        <ol className="relative mt-10 grid gap-4 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-[38px] hidden h-px bg-gradient-to-r from-lagoon/0 via-lagoon/40 to-mango/0 md:block" aria-hidden="true" />
          {steps.map((s) => (
            <li key={s.n} className="glass relative p-6">
              <span className="relative grid size-10 place-items-center rounded-full bg-night font-mono text-sm text-teal ring-1 ring-lagoon/50 shadow-[0_0_20px_-6px_#34E29B]">{s.n}</span>
              <h3 className="mt-4 text-lg font-semibold">{s.t}</h3><p className="mt-1 text-ink/65">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <Eyebrow>Your dashboard</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">See exactly where you stand</h2>
            <p className="mt-3 text-ink/70">Every app gets a status: not started, in progress or closed. A dated timeline records what you did, and a printable report is ready when you want it.</p>
            <Link href="/audit/" className="mt-6 inline-block text-teal underline">Open my dashboard →</Link>
          </div>
          <div className="halo-border" aria-hidden="true">
            <div className="rounded-[1.75rem] bg-deep/95 p-5">
              <div className="flex flex-wrap items-center gap-6"><Ring value={82} label="Clean-slate score" sub="4 of 5 apps closed" /><Ring value={76} size={76} label="Steps done" sub="19 of 25" /></div>
              <div className="mt-5 space-y-2.5">
                {[['Tinder', 'Closed', 100], ['Hinge', 'Closed', 100], ['Bumble', 'In progress', 50]].map(([n, st, v]) => (
                  <div key={n as string} className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.07]">
                    <div className="flex items-center justify-between text-sm"><span className="font-medium">{n}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${st === 'Closed' ? 'bg-palm/15 text-palm' : 'bg-mango/15 text-mango'}`}>{st}</span></div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-lagoon to-mango" style={{ width: `${v}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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

      {/* COUPLE MODE WAITLIST */}
      <section id="waitlist" className="mx-auto max-w-4xl scroll-mt-24 px-4 pt-24">
        <div className="halo-border">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-deep/90 p-7 sm:p-10">
            <div className="grid-bg absolute inset-0 opacity-60" aria-hidden="true" />
            <div className="relative">
              <Eyebrow>Coming soon</Eyebrow>
              <h2 className="mt-3 text-3xl font-bold">Couple Mode</h2>
              <p className="mt-2 max-w-xl text-ink/70">Shared goals and a private space for the two of you. Each person shares only what they choose; either can leave anytime. Join for early access and founding-member pricing.</p>
              <div className="mt-7"><Waitlist /></div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-6xl px-4 pt-24 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Twenty minutes. <span className="text-glow">Nothing left behind.</span></h2>
        <Link href="/audit/" className="glow-mango mt-7 inline-block rounded-full bg-mango px-8 py-4 font-semibold text-night hover:brightness-110">Start my free audit →</Link>
      </section>
    </>
  );
}
