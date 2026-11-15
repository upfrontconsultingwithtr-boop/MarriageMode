import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Marriage Mode: close your dating chapter, privately',
  description: 'A free, private checklist to close old dating accounts, stop the emails and cancel the billing, so nothing old surprises your relationship. By Upfront Consulting with Tiff & Reco LLC.',
  icons: { icon: '/icon.svg' },
  manifest: '/manifest.webmanifest',
};
export const viewport: Viewport = { themeColor: '#06424D', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="bg-ocean text-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
              <img src="/icon.svg" alt="" width={28} height={28} /> Marriage Mode
            </Link>
            <div className="flex gap-4 text-sm">
              <Link href="/audit/" className="rounded-full bg-mango px-4 py-1.5 font-semibold text-ink hover:brightness-95">Start free audit</Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="mt-16 border-t border-ink/10 py-8 text-center text-sm text-ink/70">
          <p>Marriage Mode by <strong>Upfront Consulting with Tiff &amp; Reco LLC</strong></p>
          <p className="mt-2 space-x-4">
            <Link href="/privacy/" className="underline">Privacy</Link>
            <Link href="/safety/" className="underline">Safety &amp; consent</Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
