import type { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORMS } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'The digital checklist for newly engaged couples · Marriage Mode',
  description: 'Just got engaged or exclusive? The 7-step digital checklist: close old dating accounts, stop the billing and emails, and agree on boundaries together. Free and private.',
};

const steps = [
  { t: 'List every dating app you ever used', d: 'Even the ones you opened once. Your email inbox and saved passwords are the best memory joggers.', link: { href: '/audit/', label: 'Use the free audit' } },
  { t: 'Delete each profile for good', d: 'Hiding or pausing a profile keeps it alive. Look for "Delete account".', link: { href: '/guides/', label: 'Step-by-step guides' } },
  { t: 'Cancel the subscriptions', d: 'Deleting an app does not stop billing. Cancel in Apple or Google subscriptions, or on the website where you paid.' },
  { t: 'Stop the emails', d: 'Search your inbox for each app and tap Unsubscribe on one email from each.' },
  { t: 'Tidy contacts and old chats', d: 'Your choice what to keep. Many couples delete numbers saved from dating apps.' },
  { t: 'Talk about boundaries together', d: 'What feels respectful for follows, DMs and old friends? Write it down.', link: { href: '/worksheet/', label: 'Free printable worksheet' } },
  { t: 'Set a check-in date', d: 'Look again in a month, each on your own. Things you forgot tend to surface by email.' },
];

export default function EngagementChecklist() {
  return (
    <article className="relative isolate">
      <div className="grid-bg absolute inset-x-0 top-0 -z-10 h-[420px]" aria-hidden="true" />
      <div className="mx-auto max-w-3xl px-4 py-14">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-teal">Checklist · newly engaged & exclusive</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight">The <span className="text-glow">digital checklist</span> nobody gives newly engaged couples</h1>
        <p className="mt-4 text-lg text-ink/75">You planned the ring, the photos and the announcement. Here&apos;s the part that keeps old surprises out of your relationship. About 20 minutes each, done on your own terms.</p>
        <ol className="mt-8 space-y-4">
          {steps.map((s, i) => (
            <li key={s.t} className="glass flex gap-4 p-5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lagoon/15 font-mono text-sm text-teal ring-1 ring-lagoon/40">{i + 1}</span>
              <div>
                <h2 className="text-lg font-semibold">{s.t}</h2>
                <p className="mt-1 text-ink/70">{s.d}</p>
                {s.link && <Link href={s.link.href} className="mt-2 inline-block text-sm text-teal underline">{s.link.label} →</Link>}
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-ink/70">Each person does their own checklist. Marriage Mode never checks anyone else&apos;s accounts, and you choose what to share.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/audit/" className="glow-mango rounded-full bg-mango px-6 py-3 font-semibold text-night">Start my free audit →</Link>
          <span className="self-center text-sm text-ink/55">Covers {PLATFORMS.length} dating apps · nothing uploaded</span>
        </div>
      </div>
    </article>
  );
}
