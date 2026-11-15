'use client';
import { useState } from 'react';
import type { AuditState } from '@/lib/audit';
import { track } from '@/lib/track';

// Official request pages confirmed from the company's own help center.
const OFFICIAL: Record<string, string> = {
  Tinder: 'https://www.help.tinder.com/hc/en-us/articles/5349453268877',
};

export function letter(app: string, name: string, email: string, user: string) {
  return `Subject: Request to delete my account and personal data

To the ${app} privacy team,

I am requesting that you delete my ${app} account and all personal data you hold about me, and that you confirm in writing when this is done. Please also tell me if you keep any data and why.

I make this request under my privacy rights, including, where they apply to me, the California Consumer Privacy Act (as amended), other U.S. state privacy laws, and the GDPR / UK GDPR.

Details to find my account:
- Name: ${name || '[your name]'}
- Email used for ${app}: ${email || '[your email]'}${user ? `\n- Username or phone: ${user}` : ''}

Please send your confirmation to the email above.

Thank you,
${name || '[your name]'}`;
}

type Props = { apps: string[]; state: AuditState; setState: (f: (s: AuditState) => AuditState) => void };

export default function DeletionRequests({ apps, state, setState }: Props) {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [user, setUser] = useState('');
  const [open, setOpen] = useState<string | null>(null); const [copied, setCopied] = useState('');
  const sent = state.requests ?? {};
  if (!apps.length) return null;
  const copy = async (app: string) => { try { await navigator.clipboard.writeText(letter(app, name, email, user)); setCopied(app); setTimeout(() => setCopied(''), 2000); track('deletion-request-copied'); } catch { /* ignore */ } };
  const markSent = (app: string) => setState((s) => ({ ...s, requests: { ...(s.requests ?? {}), [app]: s.requests?.[app] ? undefined! : new Date().toISOString() } }));
  const done = apps.filter((a) => sent[a]).length;

  return (
    <div className="halo-border"><div className="rounded-[1.75rem] bg-deep/95 p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mango">We write it for you</p>
      <h2 className="mt-1 text-xl font-semibold">Deletion requests, ready to send</h2>
      <p className="mt-1 text-sm text-ink/65">Deleting a profile doesn&apos;t always erase your data. For each app, we write a formal request asking the company to delete your account and data. You send it from your own email or their privacy form; we never need your password. {done > 0 && <strong className="text-ink">{done} of {apps.length} sent.</strong>}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3 [&>*]:min-w-0">
        <label className="text-sm text-ink/70">Your name<input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 min-h-11 w-full rounded-full border border-white/15 bg-night/60 px-4" /></label>
        <label className="text-sm text-ink/70">Email you used<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 min-h-11 w-full rounded-full border border-white/15 bg-night/60 px-4" /></label>
        <label className="text-sm text-ink/70">Username or phone (optional)<input value={user} onChange={(e) => setUser(e.target.value)} className="mt-1 min-h-11 w-full rounded-full border border-white/15 bg-night/60 px-4" /></label>
      </div>
      <p className="mt-2 text-xs text-ink/50">These stay on your device and only fill in the letters.</p>
      <ul className="mt-4 space-y-2">{apps.map((a) => (
        <li key={a} className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.07]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">{a} {sent[a] && <span className="ml-1 rounded-full bg-palm/15 px-2 py-0.5 text-[11px] text-palm">Sent {new Date(sent[a]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}</span>
            <span className="flex flex-wrap gap-1.5">
              <button onClick={() => setOpen(open === a ? null : a)} className="min-h-9 rounded-full px-3 text-xs ring-1 ring-white/15">{open === a ? 'Hide letter' : 'See letter'}</button>
              <button onClick={() => copy(a)} className="min-h-9 rounded-full bg-lagoon/15 px-3 text-xs ring-1 ring-lagoon/50">{copied === a ? 'Copied ✓' : 'Copy letter'}</button>
              <a href={OFFICIAL[a] ?? 'https://www.google.com/search?q=' + encodeURIComponent(`${a} official privacy request delete my personal data`)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center rounded-full px-3 text-xs ring-1 ring-white/15">Open {a}&apos;s privacy page ↗</a>
              <button onClick={() => markSent(a)} aria-pressed={!!sent[a]} className={`min-h-9 rounded-full px-3 text-xs ring-1 ${sent[a] ? 'bg-palm/15 text-palm ring-palm/40' : 'ring-white/15'}`}>{sent[a] ? 'Sent ✓' : 'I sent it'}</button>
            </span>
          </div>
          {open === a && <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-night/70 p-3 font-sans text-xs text-ink/80">{letter(a, name, email, user)}</pre>}
        </li>))}</ul>
      <p className="mt-3 text-xs text-ink/50">Companies usually answer within 30–45 days. Keep their reply. Coming later: a &ldquo;done for you&rdquo; option where Marriage Mode sends and follows up for you.</p>
    </div></div>
  );
}
