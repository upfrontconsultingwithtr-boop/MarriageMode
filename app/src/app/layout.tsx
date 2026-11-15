import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import '@fontsource-variable/inter';
import '@fontsource-variable/space-grotesk';
import './globals.css';

export const metadata: Metadata = {
  title: 'Marriage Mode: close your dating chapter, privately',
  description: 'A free, private checklist to close old dating accounts, stop the emails and cancel the billing, so nothing old surprises your relationship. By Upfront Consulting with Tiff & Reco LLC.',
  icons: { icon: '/icon.svg' },
  manifest: '/manifest.webmanifest',
  openGraph: { images: ['/og.png'], title: 'Marriage Mode', description: 'Close your dating chapter. Completely. Private, free, self-led.' },
};
export const viewport: Viewport = { themeColor: '#03080C', width: 'device-width', initialScale: 1, colorScheme: 'dark' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden antialiased">
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-night/70 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight">
              <img src="/icon.svg" alt="" width={30} height={30} /> Marriage Mode
            </Link>
            <Link href="/audit/" className="glow-mango rounded-full bg-mango px-4 py-1.5 text-sm font-semibold text-night hover:brightness-110">
              Start free audit
            </Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="relative mt-24 border-t border-white/[0.06] py-10 text-center text-sm text-ink/60">
          <p>Marriage Mode by <strong className="text-ink/85">Upfront Consulting with Tiff &amp; Reco LLC</strong></p>
          <p className="mt-3 space-x-5">
            <Link href="/guides/" className="hover:text-teal">Delete-account guides</Link>
            <Link href="/privacy/" className="hover:text-teal">Privacy</Link>
            <Link href="/safety/" className="hover:text-teal">Safety &amp; consent</Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
