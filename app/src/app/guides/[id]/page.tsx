import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PLATFORMS, BILLING_LINKS, helpSearchUrl, CATALOG_VERIFIED } from '@/lib/catalog';
import { gmailQuery } from '@/lib/audit';

export const dynamicParams = false;
export function generateStaticParams() { return PLATFORMS.map((p) => ({ id: p.id })); }

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = PLATFORMS.find((x) => x.id === id);
  if (!p) return {};
  return {
    title: `How to delete your ${p.name} account for good (and stop the billing) · Marriage Mode`,
    description: `Step-by-step: permanently delete ${p.name}, cancel the subscription, remove the app and stop the emails. Free and private.`,
  };
}

export default async function Guide({ params }: Props) {
  const { id } = await params;
  const p = PLATFORMS.find((x) => x.id === id);
  if (!p) notFound();
  const steps = [
    { t: `Delete your ${p.name} profile`, d: p.deletePath },
    ...(p.billing.length ? [{ t: 'Cancel the subscription where you paid', d: 'Deleting the app or the profile does not stop billing.' }] : []),
    ...(p.id !== 'fbdating' ? [{ t: 'Remove the app from every phone and tablet', d: 'Check old devices too.' }] : []),
    ...(p.emailDomains.length ? [{ t: `Stop ${p.name} emails`, d: `Open one email and tap Unsubscribe. To find them, search your inbox for: ${gmailQuery(p.emailDomains)}` }] : []),
    { t: 'Delete the saved login', d: 'Remove it from your password manager so nothing reminds you of it.' },
  ];
  return (
    <article className="relative isolate">
      <div className="grid-bg absolute inset-x-0 top-0 -z-10 h-[420px]" aria-hidden="true" />
      <div className="mx-auto max-w-3xl px-4 py-14">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-teal">Guide · checked {CATALOG_VERIFIED}</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight">How to delete your <span className="text-glow">{p.name}</span> account for good</h1>
        <p className="mt-4 text-lg text-ink/75">Closing a dating account takes more than deleting the app. Here is the full list, in order, so nothing keeps billing or emailing you.</p>
        <ol className="mt-8 space-y-4">
          {steps.map((s, i) => (
            <li key={s.t} className="glass flex gap-4 p-5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lagoon/15 font-mono text-sm text-teal ring-1 ring-lagoon/40">{i + 1}</span>
              <div>
                <h2 className="text-lg font-semibold">{s.t}</h2>
                <p className="mt-1 text-ink/70">{s.d}</p>
                {s.t.startsWith('Cancel') && (
                  <p className="mt-2 flex flex-wrap gap-3 text-sm">
                    {p.billing.map((b) => BILLING_LINKS[b].url
                      ? <a key={b} href={BILLING_LINKS[b].url} target="_blank" rel="noopener noreferrer" className="text-teal underline">{BILLING_LINKS[b].label} ↗</a>
                      : <span key={b} className="text-ink/60">{BILLING_LINKS[b].how}</span>)}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-ink/55">Menus change. If a step looks different, use <a className="text-teal underline" href={helpSearchUrl(p)} target="_blank" rel="noopener noreferrer">{p.name}&apos;s official help page ↗</a>.</p>
        <div className="halo-border mt-10">
          <div className="rounded-[1.75rem] bg-deep/90 p-7">
            <h2 className="text-2xl font-bold">Used more than one app?</h2>
            <p className="mt-2 text-ink/70">The free Marriage Mode audit builds this checklist for every app you ever used, finds the ones you forgot, and keeps your progress on your device only.</p>
            <Link href="/audit/" className="glow-mango mt-5 inline-block rounded-full bg-mango px-6 py-3 font-semibold text-night">Start my free audit →</Link>
          </div>
        </div>
      </div>
    </article>
  );
}
