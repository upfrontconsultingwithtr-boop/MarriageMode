import Link from 'next/link';
import Waitlist from '@/components/Waitlist';
import Halo, { HaloIcon } from '@/components/Halo';
import { PLATFORMS } from '@/lib/catalog';

const stats = [
  { k: String(PLATFORMS.length), v: 'dating apps and sites covered' },
  { k: '0', v: 'audit answers sent to our servers' },
  { k: '~20', v: 'minutes to finish' },
  { k: '1 tap', v: 'to search your own inbox' },
];

const chips = ['Tinder', 'Hinge', 'Bumble', 'Match', 'OkCupid', 'Feeld', 'Grindr', 'HER', 'eharmony', 'Raya', 'Muzz', 'Facebook Dating'];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-teal">{children}</p>;
}

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="grid-bg absolute inset-0 -z-10" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 overflow-hidden opacity-70" aria-hidden="true">
          <div className="grid-floor absolute -inset-x-1/2 top-0 h-[200%]" />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pb-24 pt-14 md:grid-cols-[1.1fr_1fr] md:pt-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-lagoon/30 bg-lagoon/10 px-3 py-1 text-xs font-medium text-teal">
              <span className="size-1.5 rounded-full bg-lagoon shadow-[0_0_10px_#4FA8FF]" /> Private by design · runs on your device
            </span>
            <h1 className="mt-6 text-[2.6rem] font-bold leading-[1.05] sm:text-6xl">
              Close your dating chapter.<br /><span className="text-glow">Completely.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink/75">
              Old profiles stay live. Subscriptions keep billing. &ldquo;Someone liked you&rdquo; emails keep coming.
              Marriage Mode guides you through closing all of it, so nothing old gets in the way of what you&apos;re building.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/audit/" className="glow-mango rounded-full bg-mango px-7 py-3.5 font-semibold text-night hover:brightness-110">Start my free audit →</Link>
              <a href="#waitlist" className="rounded-full border border-white/15 bg-white/5 px-7 py-3.5 font-semibold backdrop-blur hover:border-lagoon/60">Get Couple Mode early</a>
            </div>
            <p className="mt-4 text-sm text-ink/50">Free · no account · nothing uploaded</p>
          </div>
          <div className="relative mx-auto w-full max-w-[520px]">
            <Halo className="h-auto w-full" />
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="glass grid grid-cols-2 divide-white/[0.07] md:grid-cols-4 md:divide-x">
          {stats.map((s) => (
            <div key={s.v} className="p-5 md:p-6">
              <div className="font-display text-3xl font-bold text-teal">{s.k}</div>
              <div className="mt-1 text-sm text-ink/60">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* BENTO GRID */}
      <section className="relative mx-auto max-w-6xl px-4 pt-24">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold sm:text-4xl">Five steps. One clean slate.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-6">
          <div className="glass relative overflow-hidden p-6 md:col-span-4">
            <span className="font-mono text-xs text-teal">01 · PICK</span>
            <h3 className="mt-2 text-xl font-semibold">Every app you ever used</h3>
            <p className="mt-1 max-w-md text-ink/65">Choose from {PLATFORMS.length} dating apps and sites, or add any other by name.</p>
            <div className="mt-6 flex flex-wrap gap-2" aria-hidden="true">
              {chips.map((c, i) => (
                <span key={c} className={`rounded-full px-3.5 py-1.5 text-sm ring-1 ${i % 4 === 1 ? 'bg-lagoon/15 text-ink ring-lagoon/60' : 'bg-white/[0.03] text-ink/70 ring-white/10'}`}>{i % 4 === 1 ? '✓ ' : ''}{c}</span>
              ))}
            </div>
          </div>
          <div className="glass relative overflow-hidden p-6 md:col-span-2">
            <span className="font-mono text-xs text-teal">02 · SCORE</span>
            <h3 className="mt-2 text-xl font-semibold">Watch it hit 100</h3>
            <div className="mt-5 flex justify-center" aria-hidden="true">
              <svg viewBox="0 0 120 120" width="140" height="140">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#fff" strokeOpacity=".08" strokeWidth="10" />
                <circle cx="60" cy="60" r="48" fill="none" stroke="#4FA8FF" strokeWidth="10" strokeLinecap="round" strokeDasharray="301.6" strokeDashoffset="54" transform="rotate(-90 60 60)" style={{ filter: 'drop-shadow(0 0 8px #4FA8FF)' }} />
                <text x="60" y="68" textAnchor="middle" fill="#E4F4F3" fontSize="26" fontWeight="700" fontFamily="Space Grotesk Variable">82</text>
              </svg>
            </div>
          </div>
          <div className="glass p-6 md:col-span-2">
            <span className="font-mono text-xs text-teal">03 · CLEAN</span>
            <h3 className="mt-2 text-xl font-semibold">Exact steps, every app</h3>
            <ul className="mt-4 space-y-2.5 text-sm" aria-hidden="true">
              {['Delete the profile', 'Cancel the billing', 'Remove the app', 'Stop the emails'].map((t, i) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span className={`grid size-5 place-items-center rounded-md text-[11px] ${i < 2 ? 'bg-lagoon text-night' : 'ring-1 ring-white/20'}`}>{i < 2 ? '✓' : ''}</span>
                  <span className={i < 2 ? 'text-ink/45 line-through' : 'text-ink/85'}>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass p-6 md:col-span-2">
            <span className="font-mono text-xs text-teal">04 · FIND</span>
            <h3 className="mt-2 text-xl font-semibold">What you forgot</h3>
            <p className="mt-1 text-sm text-ink/65">One tap searches your own Gmail for old dating emails. We never see your inbox.</p>
            <div className="mt-4 truncate rounded-lg border border-white/10 bg-night/60 px-3 py-2 font-mono text-xs text-teal" aria-hidden="true">from:(tinder.com OR hinge.co OR …)</div>
          </div>
          <div className="glass p-6 md:col-span-2">
            <span className="font-mono text-xs text-mango">05 · SHARE</span>
            <h3 className="mt-2 text-xl font-semibold">Proof, if you choose</h3>
            <div className="mt-4 rounded-xl border border-mango/25 bg-mango/[0.06] p-3 text-sm text-ink/80" aria-hidden="true">
              Closed 5 of 5 dating accounts. Finished 22 of 22 steps. ❤
            </div>
          </div>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <Eyebrow>Built on trust</Eyebrow>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">A tool for you. Never a tool to watch someone.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { t: 'Private by design', d: 'The free audit runs in your browser. What you tick never leaves your device.', tone: 'lagoon' as const },
            { t: 'Your accounts only', d: 'No tracking, no location, no reading messages. Marriage Mode never looks at anyone else.', tone: 'violet' as const },
            { t: 'You choose what to share', d: 'Couple Mode shares only the summary you pick. Either person can leave at any time.', tone: 'mango' as const },
          ].map((p) => (
            <div key={p.t} className="glass p-6">
              <HaloIcon tone={p.tone} />
              <h3 className="mt-4 text-lg font-semibold">{p.t}</h3>
              <p className="mt-1 text-ink/65">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WAITLIST */}
      <section id="waitlist" className="mx-auto max-w-4xl scroll-mt-24 px-4 pt-24">
        <div className="halo-border">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-deep/90 p-7 sm:p-10">
            <div className="grid-bg absolute inset-0 opacity-60" aria-hidden="true" />
            <div className="relative">
              <Eyebrow>Coming soon</Eyebrow>
              <h2 className="mt-3 text-3xl font-bold">Couple Mode</h2>
              <p className="mt-2 max-w-xl text-ink/70">Shared goals, a joint checklist and a private space for the two of you. Join for early access and founding-member pricing.</p>
              <div className="mt-7"><Waitlist /></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
