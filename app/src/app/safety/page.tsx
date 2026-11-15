import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Safety and consent · Marriage Mode' };

export default function Safety() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 px-4 py-14 leading-relaxed text-ink/80">
      <h1 className="text-4xl font-bold text-glow">Safety and consent</h1>
      <p>Marriage Mode is a tool for cleaning up <strong>your own</strong> digital life. It is not a way to check on, monitor or control a partner.</p>
      <ul className="list-disc space-y-2 pl-6">
        <li>It works only on accounts you own, by you.</li>
        <li>It never collects location, messages, call logs, browsing history or screen time.</li>
        <li>In Couple Mode, nothing is shared unless you choose it, and either person can leave at any time.</li>
        <li>It never hides itself on your phone.</li>
      </ul>
      <div className="rounded-2xl bg-coral/10 p-5 ring-1 ring-coral/30">
        <h2 className="text-lg font-bold">If someone is pressuring you</h2>
        <p className="mt-1">Demanding your passwords, monitoring your phone or forcing you to prove things are warning signs. You deserve support.</p>
        <p className="mt-2"><strong>National Domestic Violence Hotline</strong>: call 1-800-799-7233, text START to 88788, or chat at <a className="text-teal underline" href="https://www.thehotline.org" rel="noopener noreferrer" target="_blank">thehotline.org</a>. Free, confidential, 24/7. In an emergency, call 911.</p>
      </div>
    </article>
  );
}
