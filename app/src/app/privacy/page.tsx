import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Privacy · Marriage Mode' };

export default function Privacy() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 px-4 py-14 leading-relaxed text-ink/80">
      <h1 className="text-4xl font-bold text-glow">Privacy</h1>
      <p className="text-sm text-ink/50">Draft, effective November 15, 2026. Marriage Mode is a product of Upfront Consulting with Tiff &amp; Reco LLC.</p>
      <h2 className="pt-2 text-xl font-bold">The free audit stays on your device</h2>
      <p>The apps you pick and the steps you tick are saved only in your own browser&apos;s storage. We do not receive them. Clearing your browser data, or the &ldquo;Clear my audit&rdquo; button, deletes them.</p>
      <h2 className="pt-2 text-xl font-bold">The email check</h2>
      <p>The &ldquo;Search my Gmail&rdquo; button only opens a search in your own Gmail tab. We have no access to your email and never see the results.</p>
      <h2 className="pt-2 text-xl font-bold">The waitlist</h2>
      <p>If you join the waitlist we keep your email address and the relationship stage you chose, only to tell you about Marriage Mode. Our host, Netlify, stores the form. To be removed, email upfrontconsultingwithtr@gmail.com with the subject &ldquo;Remove me&rdquo;.</p>
      <h2 className="pt-2 text-xl font-bold">What we never do</h2>
      <p>We never sell or share your data, run ad trackers, or collect location, messages, contacts or browsing history.</p>
    </article>
  );
}
