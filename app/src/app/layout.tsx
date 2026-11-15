import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import '@fontsource-variable/inter';
import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource-variable/fraunces/opsz-italic.css';
import './globals.css';
import { BASE } from '@/lib/base';
import { PREFS_BOOT } from '@/lib/prefs';

export const metadata: Metadata = {
  title: 'Marriage Mode: close your dating chapter, privately',
  description: 'A free, private checklist to close old dating accounts, stop the emails and cancel the billing, so nothing old surprises your relationship. By Upfront Consulting with Tiff & Reco LLC.',
  icons: { icon: `${BASE}/icon.svg` },
  manifest: `${BASE}/manifest.webmanifest`,
  openGraph: { images: [`${BASE}/og.png`], title: 'Marriage Mode', description: 'Close your dating chapter. Completely. Private, free, self-led.' },
};
export const viewport: Viewport = { themeColor: '#0C0709', width: 'device-width', initialScale: 1, colorScheme: 'dark' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: PREFS_BOOT }} /></head>
      <body className="min-h-screen overflow-x-hidden antialiased print:bg-white">
        <header className="print:hidden sticky top-0 z-50 border-b border-white/[0.06] bg-night/75 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3" aria-label="Main">
            <Link prefetch={false} href="/" className="flex items-center gap-2.5 whitespace-nowrap font-display text-lg font-bold tracking-tight">
              <img src={`${BASE}/icon.svg`} alt="" width={30} height={30} /> Marriage Mode
            </Link>
            <div className="hidden items-center gap-6 text-sm text-ink/70 md:flex">
              <Link prefetch={false} href="/#value" className="hover:text-ink">Why Marriage Mode</Link>
              <Link prefetch={false} href="/#how" className="hover:text-ink">How it works</Link>
              <Link prefetch={false} href="/couple/" className="hover:text-ink">Couple Mode</Link>
              <Link prefetch={false} href="/guides/" className="hover:text-ink">Guides</Link>
              <Link prefetch={false} href="/#pricing" className="hover:text-ink">Pricing</Link>
              <Link prefetch={false} href="/audit/" className="hover:text-ink">My dashboard</Link>
              <Link prefetch={false} href="/es/" hrefLang="es" className="hover:text-ink">ES</Link>
            </div>
            <div className="flex items-center gap-2">
              <Link prefetch={false} href="/audit/" className="btn-press glow-mango whitespace-nowrap rounded-full bg-mango px-4 py-1.5 text-sm font-semibold text-night hover:brightness-110"><span className="sm:hidden">Free audit</span><span className="hidden sm:inline">Start free audit</span></Link>
              <details className="relative md:hidden">
                <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-full ring-1 ring-white/15 [&::-webkit-details-marker]:hidden" aria-label="Menu">☰</summary>
                <div className="glass absolute right-0 top-12 flex w-56 flex-col p-2 text-sm shadow-2xl">
                  {[['/#value', 'Why Marriage Mode'], ['/#how', 'How it works'], ['/couple/', 'Couple Mode'], ['/guides/', 'Delete-account guides'], ['/#pricing', 'Pricing'], ['/audit/', 'My dashboard'], ['/worksheet/', 'Couples worksheet'], ['/partners/', 'For counselors & pros'], ['/es/', 'Español']].map(([h, l]) => (
                    <Link prefetch={false} key={h} href={h} className="rounded-xl px-3 py-3 hover:bg-white/5">{l}</Link>
                  ))}
                </div>
              </details>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <script data-goatcounter-settings={JSON.stringify({ allow_local: false })} data-goatcounter="https://upfront-with-tr.goatcounter.com/count" async src="https://gc.zgo.at/count.js" />
        <footer className="print:hidden relative mt-24 border-t border-white/[0.06] py-10 text-center text-sm text-ink/60">
          <p>Marriage Mode by <strong className="text-ink/85">Upfront Consulting with Tiff &amp; Reco LLC</strong></p>
          <p className="mx-auto mt-3 flex max-w-xl flex-wrap justify-center gap-x-5 gap-y-2 px-4">
            <Link prefetch={false} href="/couple/" className="hover:text-teal">Couple Mode</Link>
            <Link prefetch={false} href="/guides/" className="hover:text-teal">Delete-account guides</Link>
            <Link prefetch={false} href="/worksheet/" className="hover:text-teal">Couples worksheet</Link>
            <Link prefetch={false} href="/engagement-checklist/" className="hover:text-teal">Engagement checklist</Link>
            <Link prefetch={false} href="/privacy/" className="hover:text-teal">Privacy</Link>
            <Link prefetch={false} href="/safety/" className="hover:text-teal">Safety &amp; consent</Link>
            <Link prefetch={false} href="/partners/" className="hover:text-teal">For counselors &amp; pros</Link>
            <Link prefetch={false} href="/es/" hrefLang="es" className="hover:text-teal">Español</Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
