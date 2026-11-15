'use client';
import { useState } from 'react';

// Posts to Netlify Forms (form defined in public/__forms.html). Free plan.
export default function Waitlist() {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    const data = new FormData(e.currentTarget);
    data.set('form-name', 'waitlist');
    try {
      const res = await fetch('/__forms.html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data as unknown as Record<string, string>).toString(),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'done')
    return <p className="rounded-xl bg-palm/15 p-4 font-semibold text-ink ring-1 ring-palm/40">You&apos;re on the list. We&apos;ll email you when Couple Mode opens.</p>;

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
      <input type="text" name="company" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className="sr-only" htmlFor="wl-email">Email</label>
      <input id="wl-email" required type="email" name="email" placeholder="you@email.com"
        className="min-w-0 flex-1 rounded-full border border-white/15 bg-night/60 px-5 py-3 placeholder:text-ink/40 focus:border-lagoon/60" />
      <label className="sr-only" htmlFor="wl-stage">Where are you?</label>
      <select id="wl-stage" name="stage" className="rounded-full border border-white/15 bg-night/60 px-4 py-3">
        <option value="exclusive">Newly exclusive</option>
        <option value="engaged">Engaged</option>
        <option value="married">Married</option>
        <option value="rebuilding">Rebuilding trust</option>
        <option value="professional">I&apos;m a counselor or coach</option>
      </select>
      <button disabled={state === 'sending'} className="glow-mango rounded-full bg-mango px-6 py-3 font-semibold text-night hover:brightness-110 disabled:opacity-60">
        {state === 'sending' ? 'Joining…' : 'Join the waitlist'}
      </button>
      {state === 'error' && <p role="alert" className="text-coral">That didn&apos;t go through. Please try again.</p>}
    </form>
  );
}
