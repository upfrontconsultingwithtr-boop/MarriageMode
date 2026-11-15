'use client';
import { useState } from 'react';
import { addLead } from '@/lib/cloud';
import { track } from '@/lib/track';

const ROLES = ['Premarital or couples counselor', 'Pastor, priest or ministry leader', 'Relationship coach', 'Wedding planner or officiant', 'Wedding venue or vendor', 'Other'];

const CLIENT_MSG = 'Before the wedding, many couples still have old dating accounts, subscriptions and emails running in the background. Marriage Mode is a free, private checklist that walks you through closing them in about 20 minutes, on your own phone, with nothing uploaded. It is self-led: it never checks on a partner. Start here: https://upfrontconsultingwithtr-boop.github.io/MarriageMode/';

function PartnerKit() {
  const [copied, setCopied] = useState(false);
  return (
    <div role="status" className="rounded-2xl bg-lagoon/10 p-6 ring-1 ring-lagoon/40">
      <p className="text-lg font-semibold">Welcome, partner. Your kit is ready now:</p>
      <ul className="mt-3 space-y-2 text-sm">
        <li>📝 <a className="text-teal underline" href="../worksheet/">Couples worksheet</a> (print or share)</li>
        <li>💍 <a className="text-teal underline" href="../engagement-checklist/">Engagement checklist</a> (print or share)</li>
        <li>✓ <a className="text-teal underline" href="../audit/">The free audit</a> to send couples to</li>
      </ul>
      <p className="mt-4 text-sm font-semibold">A ready message for your couples</p>
      <p className="mt-1 rounded-xl bg-night/60 p-3 text-sm text-ink/80">{CLIENT_MSG}</p>
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(CLIENT_MSG); setCopied(true); } catch { /* ignore */ } }} className="mt-2 min-h-11 rounded-full px-5 text-sm font-semibold ring-1 ring-white/15">{copied ? 'Copied ✓' : 'Copy message'}</button>
      <p className="mt-4 text-xs text-ink/60">We&apos;ll also be in touch by email about early access to practitioner tools.</p>
    </div>
  );
}

export default function PartnerForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get('website')) return; // bots fill hidden fields
    setState('sending');
    const v = (k: string) => String(f.get(k) ?? '').trim().slice(0, k === 'note' ? 1000 : 150) || undefined;
    const ok = await addLead({ kind: 'partner', email: v('email')!, name: v('name'), org: v('org'), role: v('role'), city: v('city'), note: v('note'), source: 'partners-page' });
    setState(ok ? 'done' : 'error'); if (ok) track('partner-lead');
  }
  if (state === 'done') return <PartnerKit />;
  const field = 'mt-1 min-h-11 w-full rounded-full border border-white/15 bg-night/60 px-4';
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className="text-sm text-ink/75">Your name<input name="name" required autoComplete="name" className={field} /></label>
      <label className="text-sm text-ink/75">Work email<input name="email" type="email" required autoComplete="email" className={field} /></label>
      <label className="text-sm text-ink/75">Practice, church or business<input name="org" autoComplete="organization" className={field} /></label>
      <label className="text-sm text-ink/75">City and state<input name="city" className={field} /></label>
      <label className="text-sm text-ink/75 sm:col-span-2">What you do
        <select name="role" required className={field} defaultValue=""><option value="" disabled>Choose…</option>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
      </label>
      <label className="text-sm text-ink/75 sm:col-span-2">Anything we should know? (optional)<textarea name="note" rows={3} maxLength={1000} className="mt-1 w-full rounded-2xl border border-white/15 bg-night/60 p-4" /></label>
      <div className="sm:col-span-2">
        <button disabled={state === 'sending'} className="glow-mango min-h-12 rounded-full bg-mango px-8 font-semibold text-night disabled:opacity-60">{state === 'sending' ? 'Sending…' : 'Become a partner (free)'}</button>
        {state === 'error' && <p role="alert" className="mt-2 text-sm text-coral">That didn&apos;t go through. Please try again, or email upfrontconsultingwithtr@gmail.com.</p>}
        <p className="mt-3 text-xs text-ink/55">We use this only to contact you about the Marriage Mode partner program. No spam, no selling your details, and you can ask us to delete it anytime.</p>
      </div>
    </form>
  );
}
