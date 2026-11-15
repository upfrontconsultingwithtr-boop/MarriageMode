import type { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORMS, PARENT, BILLING_LINKS } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Find forgotten dating app charges on your statement · Marriage Mode',
  description: 'A free, private guide to spotting and stopping dating app subscriptions on your own card and app store statements. By Upfront Consulting with Tiff & Reco LLC.',
};

const groups = Object.entries(PLATFORMS.reduce<Record<string, string[]>>((acc, p) => { const k = PARENT[p.id]; if (k) (acc[k] ??= []).push(p.name); return acc; }, {}));

export default function Charges() {
  return (
    <article className="relative isolate">
      <div className="grid-bg absolute inset-x-0 top-0 -z-10 h-[420px]" aria-hidden="true" />
      <div className="mx-auto max-w-3xl px-4 py-14">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-teal">Free guide · your own accounts only</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight">Find forgotten <span className="text-glow">dating charges</span></h1>
        <p className="mt-4 text-lg text-ink/75">Subscriptions keep billing after you delete an app. Here is a private, 10-minute way to find them on your own statements. We never connect to your bank.</p>

        <ol className="mt-8 space-y-4">
          <li className="glass p-5"><h2 className="font-semibold">1. Check your app store subscriptions first</h2>
            <p className="mt-1 text-sm text-ink/70">Most dating apps bill through Apple or Google. These pages list every active subscription on your account.</p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm"><a href={BILLING_LINKS.apple.url} target="_blank" rel="noopener noreferrer" className="text-teal underline">{BILLING_LINKS.apple.label} ↗</a><a href={BILLING_LINKS.google.url} target="_blank" rel="noopener noreferrer" className="text-teal underline">{BILLING_LINKS.google.label} ↗</a></p></li>
          <li className="glass p-5"><h2 className="font-semibold">2. Search 3 months of card statements</h2>
            <p className="mt-1 text-sm text-ink/70">In your bank or card app, search for: the app&apos;s name, “APPLE.COM/BILL” or “GOOGLE”, and the parent company names below. Charges often renew monthly, so the same amount repeating is a clue.</p></li>
          <li className="glass p-5"><h2 className="font-semibold">3. Know the parent companies</h2>
            <p className="mt-1 text-sm text-ink/70">Several apps belong to the same company, which can appear on statements or receipts.</p>
            <ul className="mt-3 space-y-2 text-sm">{groups.map(([co, apps]) => <li key={co}><b>{co}:</b> <span className="text-ink/75">{apps.join(', ')}</span></li>)}</ul></li>
          <li className="glass p-5"><h2 className="font-semibold">4. Search your email for receipts</h2>
            <p className="mt-1 text-sm text-ink/70">Search your inbox for “receipt”, “subscription” or “renewal” plus the app name. The free audit builds this search for you.</p></li>
          <li className="glass p-5"><h2 className="font-semibold">5. Cancel where you paid, then confirm</h2>
            <p className="mt-1 text-sm text-ink/70">Cancel in the app store or on the website you paid on. Keep the confirmation (the dashboard has a place to save proof) and check next month&apos;s statement. Unfamiliar charge you didn&apos;t make? Call your card company.</p></li>
        </ol>
        <p className="mt-6 text-sm text-ink/60">Step-by-step cancel guides: {PLATFORMS.filter((p) => p.billing.length).slice(0, 8).map((p, i) => <span key={p.id}>{i ? ' · ' : ''}<Link prefetch={false} href={`/cancel/${p.id}/`} className="text-teal underline">{p.name}</Link></span>)} · <Link prefetch={false} href="/guides/" className="text-teal underline">all apps</Link></p>
        <Link prefetch={false} href="/audit/" className="glow-mango mt-8 inline-block rounded-full bg-mango px-7 py-3.5 font-semibold text-night">Start my free audit →</Link>
      </div>
    </article>
  );
}
