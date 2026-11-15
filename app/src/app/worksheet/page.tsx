import type { Metadata } from 'next';
import PrintButton from './PrintButton';

export const metadata: Metadata = {
  title: 'Digital Boundaries worksheet for couples (free) · Marriage Mode',
  description: 'A free printable worksheet for engaged and newly committed couples, and for the counselors and pastors who guide them.',
};

const Lines = ({ n = 3 }: { n?: number }) => (
  <div className="mt-2 space-y-5" aria-hidden="true">{Array.from({ length: n }).map((_, i) => <div key={i} className="border-b border-white/20 print:border-black/40" />)}</div>
);

const sections = [
  { h: '1. My own digital past (each partner fills in their own)', qs: ['Dating apps or sites I have used:', 'Which ones are fully closed (profile deleted, billing cancelled, app removed)?', 'Anything I still need to close, and by when:'] },
  { h: '2. What feels respectful to us', qs: ['Following or messaging past partners: what is okay, what is not?', 'Old contacts and photos: what do we each want to keep or let go?', 'Privacy we each keep (our own passwords and messages stay our own):'] },
  { h: '3. Our agreements', qs: ['We agree to:', 'If something old comes up, we will talk about it like this:', 'Our check-in date (one month from today):'] },
];

export default function Worksheet() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 print:max-w-none print:bg-white print:p-0 print:text-black">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-teal print:text-black">Free worksheet · for couples and the people who guide them</p>
      <h1 className="mt-3 text-4xl font-bold leading-tight print:text-3xl"><span className="text-glow print:text-black">Digital Boundaries</span> for couples</h1>
      <p className="mt-4 text-ink/75 print:text-black">A 30-minute conversation guide. Each person answers about themselves only. Nobody checks the other&apos;s phone; you each share what you choose.</p>
      <div className="mt-6 print:hidden"><PrintButton /></div>
      {sections.map((s) => (
        <section key={s.h} className="glass mt-8 p-6 print:mt-6 print:border-black/30 print:bg-white print:p-0 print:shadow-none">
          <h2 className="text-xl font-semibold">{s.h}</h2>
          {s.qs.map((q) => (<div key={q} className="mt-5"><p className="text-ink/85 print:text-black">{q}</p><Lines /></div>))}
        </section>
      ))}
      <section className="mt-8 text-sm text-ink/65 print:text-black">
        <p><strong>For counselors, pastors and coaches:</strong> use this as homework between sessions. Couples can close their old accounts with the free, private checklist at <strong>Marriage Mode</strong> (search &ldquo;Marriage Mode audit&rdquo;); nothing they enter leaves their device.</p>
        <p className="mt-3">If anyone feels pressured to give up passwords or be tracked, that is not trust. National Domestic Violence Hotline: 1-800-799-7233.</p>
        <p className="mt-3">Marriage Mode by Upfront Consulting with Tiff &amp; Reco LLC.</p>
      </section>
    </article>
  );
}
