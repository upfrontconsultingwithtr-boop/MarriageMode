import type { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORMS } from '@/lib/catalog';

export const metadata: Metadata = { title: 'How to delete any dating app account · Marriage Mode', description: 'Free step-by-step guides to permanently delete dating accounts, cancel billing and stop the emails.' };

export default function Guides() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-4xl font-bold">Delete-your-account guides</h1>
      <p className="mt-3 text-ink/70">Pick an app for the full steps.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {PLATFORMS.map((p) => (
          <Link key={p.id} href={`/guides/${p.id}/`} className="glass p-4 hover:ring-1 hover:ring-lagoon/50">
            <span className="font-semibold">How to delete {p.name}</span> <span className="text-teal">→</span>
            {p.billing.length > 0 && <span className="mt-1 block text-sm text-ink/60">and cancel the subscription</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
