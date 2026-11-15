import type { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORMS, BILLING_LINKS, helpSearchUrl, CATALOG_VERIFIED } from '@/lib/catalog';

export const dynamicParams = false;
export function generateStaticParams() { return PLATFORMS.filter((p) => p.billing.length).map((p) => ({ id: p.id })); }
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params; const p = PLATFORMS.find((x) => x.id === id);
  return p ? { title: `How to cancel your ${p.name} subscription (and stop the charges) · Marriage Mode`, description: `Cancel ${p.name} on iPhone, Android or the web, and make sure you're not charged again. Free step-by-step guide.` } : {};
}

export default async function Cancel({ params }: Props) {
  const { id } = await params; const p = PLATFORMS.find((x) => x.id === id)!;
  const ways = [
    p.billing.includes('apple') && { t: 'If you pay through your iPhone (Apple)', steps: ['Open Settings and tap your name at the top.', 'Tap Subscriptions.', `Tap ${p.name}, then Cancel Subscription.`], link: BILLING_LINKS.apple },
    p.billing.includes('google') && { t: 'If you pay through Android (Google Play)', steps: ['Open the Play Store and tap your profile picture.', 'Tap Payments & subscriptions, then Subscriptions.', `Tap ${p.name}, then Cancel subscription.`], link: BILLING_LINKS.google },
    p.billing.includes('web') && { t: `If you paid on the ${p.name} website`, steps: [`Log in at ${p.domain ?? 'the website'} and open Account or Billing settings.`, 'Choose Cancel subscription or turn off auto-renew.', 'Save the confirmation email.'], link: null },
  ].filter(Boolean) as { t: string; steps: string[]; link: { label: string; url: string } | null }[];
  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-teal">Guide · checked {CATALOG_VERIFIED}</p>
      <h1 className="mt-3 text-4xl font-bold leading-tight">How to cancel your <span className="text-glow">{p.name}</span> subscription</h1>
      <p className="mt-4 text-lg text-ink/75">Deleting the app does <strong>not</strong> stop the charges. Cancel where you pay, then check your next statement.</p>
      <div className="mt-8 space-y-4">{ways.map((w) => (
        <section key={w.t} className="glass p-6">
          <h2 className="text-xl font-semibold">{w.t}</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-ink/75">{w.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          {w.link?.url && <a href={w.link.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-teal underline">Open {w.link.label} ↗</a>}
        </section>))}</div>
      <p className="mt-4 text-sm text-ink/60">Not sure where you pay? Search your email for &ldquo;{p.name} receipt&rdquo;. Menus change; if a step looks different, use <a className="text-teal underline" href={helpSearchUrl(p)} target="_blank" rel="noopener noreferrer">{p.name}&apos;s official help ↗</a>.</p>
      <div className="halo-border mt-10"><div className="rounded-[1.75rem] bg-deep/90 p-7">
        <h2 className="text-2xl font-bold">Close the account too</h2>
        <p className="mt-2 text-ink/70">Cancelling stops the billing, but the profile can stay live. See <Link href={`/guides/${p.id}/`} className="text-teal underline">how to delete {p.name} for good</Link>, or let the free audit walk you through every app.</p>
        <Link href="/audit/" className="glow-mango mt-5 inline-block rounded-full bg-mango px-6 py-3 font-semibold text-night">Start my free audit →</Link>
      </div></div>
    </article>
  );
}
