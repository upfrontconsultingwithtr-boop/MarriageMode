import Link from 'next/link';
import Waitlist from '@/components/Waitlist';
import { PLATFORMS } from '@/lib/catalog';

const steps = [
  { t: 'Pick every app you ever used', d: `Choose from ${PLATFORMS.length} dating apps and sites, or add your own.` },
  { t: 'Follow a clear checklist', d: 'Delete the profile, cancel the billing, stop the emails. Each step tells you exactly where to tap.' },
  { t: 'Find what you forgot', d: 'One tap searches your own inbox for old dating emails. We never see your email.' },
  { t: 'Share proof, if you want to', d: 'Send your partner a simple summary of what you closed. You choose what it says.' },
];

export default function Home() {
  return (
    <>
      <section className="bg-ocean text-white">
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-12 sm:pt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lagoon">For the newly exclusive, engaged and married</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Close your dating chapter. <span className="text-mango">Completely.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85">
            Old profiles stay live. Subscriptions keep billing. &ldquo;Someone liked you&rdquo; emails keep coming.
            Marriage Mode walks you through closing all of it in about 20 minutes, so nothing old surprises the relationship you&apos;re building.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/audit/" className="rounded-full bg-mango px-7 py-3.5 font-semibold text-ink hover:brightness-95">Start my free audit</Link>
            <a href="#waitlist" className="rounded-full border border-white/40 px-7 py-3.5 font-semibold hover:bg-white/10">Get Couple Mode early</a>
          </div>
          <p className="mt-4 text-sm text-white/70">Free. No account. Your answers stay on this device.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-extrabold">How it works</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2">
          {steps.map((s, i) => (
            <li key={s.t} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/5">
              <span className="font-mono text-sm font-semibold text-teal">0{i + 1}</span>
              <h3 className="mt-1 text-lg font-bold">{s.t}</h3>
              <p className="mt-1 text-ink/75">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-4">
        <div className="grid gap-4 rounded-3xl bg-white p-6 ring-1 ring-ink/5 sm:grid-cols-3 sm:p-8">
          <div><h3 className="font-bold">Private by design</h3><p className="mt-1 text-ink/75">The free audit runs in your browser. Nothing you tick is sent to us.</p></div>
          <div><h3 className="font-bold">Your accounts only</h3><p className="mt-1 text-ink/75">Marriage Mode never watches, tracks or reads anyone else. It&apos;s a tool for you, not a tool to check on a partner.</p></div>
          <div><h3 className="font-bold">Proof, not surveillance</h3><p className="mt-1 text-ink/75">Couple Mode shares only the summary you choose. Either person can leave at any time.</p></div>
        </div>
      </section>

      <section id="waitlist" className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-2xl font-extrabold">Couple Mode is coming</h2>
        <p className="mt-2 text-ink/75">Shared goals, a joint checklist and a private space for the two of you. Join the waitlist for early access and founding-member pricing.</p>
        <div className="mt-6"><Waitlist /></div>
      </section>
    </>
  );
}
