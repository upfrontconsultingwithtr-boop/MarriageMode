'use client';
import { useEffect, useMemo, useState } from 'react';
import { listCounselors, applyCounselor, requestCounselor, cloudEnabled, type Counselor } from '@/lib/cloud';
import { track } from '@/lib/track';

const field = 'mt-1 min-h-11 w-full rounded-full border border-white/15 bg-night/60 px-4';
const area = 'mt-1 min-h-24 w-full rounded-2xl border border-white/15 bg-night/60 px-4 py-3';
const SPECIALTIES = ['Premarital', 'Communication', 'Trust & infidelity recovery', 'Intimacy', 'Money', 'Blended families', 'Faith-based', 'Parenting', 'Separation & divorce', 'LGBTQ+ affirming'];
const FORMATS = ['video', 'phone', 'in person'];
const list = (s: FormDataEntryValue | null) => String(s ?? '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 12);

export default function CounselorsApp() {
  const [all, setAll] = useState<Counselor[] | null>(null);
  const [state, setState] = useState(''); const [spec, setSpec] = useState(''); const [fmt, setFmt] = useState('');
  const [pick, setPick] = useState<Counselor | null>(null);
  const [sent, setSent] = useState(''); const [err, setErr] = useState(''); const [applied, setApplied] = useState(false);
  useEffect(() => { void listCounselors().then(setAll); }, []);
  const shown = useMemo(() => (all ?? []).filter((c) =>
    (!state || c.license_state.toLowerCase().includes(state.toLowerCase())) &&
    (!spec || c.specialties.includes(spec)) && (!fmt || c.formats.includes(fmt))), [all, state, spec, fmt]);

  const sendRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (!pick) return; setErr('');
    const f = new FormData(e.currentTarget); if (f.get('website')) return;
    const ok = await requestCounselor({ counselor_id: pick.id, name: String(f.get('name')), email: String(f.get('email')), state: String(f.get('state') || ''), format: String(f.get('format') || ''), times: String(f.get('times') || ''), note: String(f.get('note') || '') });
    if (ok) { setSent(pick.name); setPick(null); track('counselor-request'); } else setErr('That didn’t send. Please check your email address and try again.');
  };
  const sendApp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setErr('');
    const f = new FormData(e.currentTarget); if (f.get('website')) return;
    const url = String(f.get('booking_url') || '').trim();
    const ok = await applyCounselor({ name: String(f.get('name')), credential: String(f.get('credential')), license_state: String(f.get('license_state')), license_number: String(f.get('license_number')), email: String(f.get('email')),
      specialties: f.getAll('specialties').map(String), languages: list(f.get('languages')).length ? list(f.get('languages')) : ['English'], formats: f.getAll('formats').map(String).length ? f.getAll('formats').map(String) : ['video'],
      fee_note: String(f.get('fee_note') || '') || null, bio: String(f.get('bio') || '') || null, booking_url: url ? (url.startsWith('https://') ? url : `https://${url.replace(/^http:\/\//, '')}`) : null });
    if (ok) { setApplied(true); track('counselor-apply'); } else setErr('That didn’t send. Please check each field (website must be a full link) and try again.');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20">
      <p className="mb-4 rounded-2xl bg-coral/10 p-3 text-sm text-ink/80">In danger or in crisis right now? This directory isn’t emergency help. Call 911, text or call 988 (crisis line), or 1-800-799-7233 (domestic violence hotline).</p>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm text-ink/75">Your state<input value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. MO" className={field} /></label>
          <label className="text-sm text-ink/75">Focus<select value={spec} onChange={(e) => setSpec(e.target.value)} className={field}><option value="">Any</option>{SPECIALTIES.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="text-sm text-ink/75">How<select value={fmt} onChange={(e) => setFmt(e.target.value)} className={field}><option value="">Any</option>{FORMATS.map((s) => <option key={s}>{s}</option>)}</select></label>
        </div>
        <p className="mt-3 text-xs text-ink/55">Counselors can usually only see clients in the states where they are licensed, even by video.</p>
      </div>

      {sent && <p role="status" className="mt-6 rounded-2xl bg-palm/15 p-4 text-sm">Request sent to {sent}. They’ll reply by email to set a time and fee. Check your spam folder too.</p>}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {all === null && <p className="text-ink/60">Loading counselors…</p>}
        {all !== null && shown.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:col-span-2">
            <h2 className="text-xl font-semibold">{all.length ? 'No match for those filters yet' : 'We’re welcoming our first counselors now'}</h2>
            <p className="mt-2 text-ink/70">Every counselor’s license is checked before they appear here. Until there’s a match for you, these free directories list licensed couples therapists near you:</p>
            <ul className="mt-3 space-y-1 text-sm">
              <li><a className="text-mango underline" href="https://www.psychologytoday.com/us/therapists/marriage-couples-counseling" target="_blank" rel="noopener noreferrer">Psychology Today: couples counselors</a></li>
              <li><a className="text-mango underline" href="https://www.aamft.org/Directories/Find_a_Therapist.aspx" target="_blank" rel="noopener noreferrer">AAMFT: licensed marriage and family therapists</a></li>
              <li><a className="text-mango underline" href="https://gottmanreferralnetwork.com/" target="_blank" rel="noopener noreferrer">Gottman Referral Network</a></li>
            </ul>
          </div>
        )}
        {shown.map((c) => (
          <article key={c.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold">{c.name}, {c.credential}</h2>
            <p className="text-xs text-ink/55">Licensed in {c.license_state} · license #{c.license_number} · license checked by Marriage Mode</p>
            {c.bio && <p className="mt-3 text-sm text-ink/80">{c.bio}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs">{[...c.specialties, ...c.formats, ...c.languages].map((x) => <span key={x} className="rounded-full bg-white/[0.06] px-2.5 py-1">{x}</span>)}</div>
            {c.fee_note && <p className="mt-3 text-sm text-ink/70">Fee: {c.fee_note} (paid to the counselor)</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {c.booking_url && <a href={c.booking_url} target="_blank" rel="noopener noreferrer" onClick={() => track('counselor-book')} className="inline-flex min-h-11 items-center rounded-full bg-mango px-5 text-sm font-semibold text-night">Book directly (most private)</a>}
              <button onClick={() => { setPick(c); setSent(''); }} className={`min-h-11 rounded-full px-5 text-sm font-semibold ${c.booking_url ? 'ring-1 ring-white/15' : 'bg-mango text-night'}`}>Request a session</button>
            </div>
            {pick?.id === c.id && (
              <form onSubmit={sendRequest} className="mt-4 grid gap-3 [&>*]:min-w-0">
                <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                <label className="text-sm text-ink/75">Your first names<input name="name" required maxLength={100} placeholder="e.g. Sam & Alex" className={field} /></label>
                <label className="text-sm text-ink/75">Email for the reply<input name="email" type="email" required maxLength={200} autoComplete="email" className={field} /></label>
                <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
                  <label className="text-sm text-ink/75">Your state<input name="state" maxLength={40} defaultValue={state} className={field} /></label>
                  <label className="text-sm text-ink/75">How<select name="format" className={field}>{c.formats.map((x) => <option key={x}>{x}</option>)}</select></label>
                </div>
                <label className="text-sm text-ink/75">Good times<input name="times" maxLength={200} placeholder="e.g. weekday evenings" className={field} /></label>
                <label className="text-sm text-ink/75">Topic in a few words (optional; save private details for the counselor)<input name="note" maxLength={160} placeholder="e.g. communication, premarital" className={field} /></label>
                {err && <p role="alert" className="text-sm text-coral">{err}</p>}
                <button className="min-h-11 rounded-full bg-mango px-5 font-semibold text-night">Send request</button>
                <p className="text-xs text-ink/55">Only {c.name} and the Marriage Mode team see this. In danger right now? Call 911, or 988 for crisis support.</p>
              </form>
            )}
          </article>
        ))}
      </div>

      <section id="join" className="mt-14 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-mango">For licensed counselors</p>
        <h2 className="mt-2 text-2xl font-bold">Join the Marriage Mode counselor list (free)</h2>
        <p className="mt-2 text-ink/70">Get session requests from couples already doing the work. No listing fee and no commission: couples pay you directly. We check every license with your state board before listing you.</p>
        {applied ? <p role="status" className="mt-6 rounded-2xl bg-palm/15 p-4">Thank you! We’ll check your license and email you when your listing is live.</p> : (
          <form onSubmit={sendApp} className="mt-6 grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
            <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <label className="text-sm text-ink/75">Full name<input name="name" required minLength={2} maxLength={100} autoComplete="name" className={field} /></label>
            <label className="text-sm text-ink/75">Work email (private)<input name="email" type="email" required maxLength={200} autoComplete="email" className={field} /></label>
            <label className="text-sm text-ink/75">License type<input name="credential" required minLength={2} maxLength={60} placeholder="LMFT, LPC, LCSW, PsyD…" className={field} /></label>
            <label className="text-sm text-ink/75">License state<input name="license_state" required minLength={2} maxLength={40} placeholder="e.g. MO" className={field} /></label>
            <label className="text-sm text-ink/75">License number<input name="license_number" required minLength={2} maxLength={60} className={field} /></label>
            <label className="text-sm text-ink/75">Fee (shown to couples)<input name="fee_note" maxLength={120} placeholder="e.g. $120/session, sliding scale" className={field} /></label>
            <label className="text-sm text-ink/75">Languages<input name="languages" maxLength={120} placeholder="English, Spanish" className={field} /></label>
            <label className="text-sm text-ink/75">Booking page (optional)<input name="booking_url" maxLength={300} placeholder="https://…" className={field} /></label>
            <fieldset className="text-sm text-ink/75 sm:col-span-2"><legend>Focus areas</legend><div className="mt-2 flex flex-wrap gap-2">{SPECIALTIES.map((s) => <label key={s} className="flex min-h-9 items-center gap-2 rounded-full bg-white/[0.05] px-3"><input type="checkbox" name="specialties" value={s} />{s}</label>)}</div></fieldset>
            <fieldset className="text-sm text-ink/75 sm:col-span-2"><legend>Sessions by</legend><div className="mt-2 flex flex-wrap gap-2">{FORMATS.map((s) => <label key={s} className="flex min-h-9 items-center gap-2 rounded-full bg-white/[0.05] px-3"><input type="checkbox" name="formats" value={s} defaultChecked={s === 'video'} />{s}</label>)}</div></fieldset>
            <label className="text-sm text-ink/75 sm:col-span-2">Short bio for couples<textarea name="bio" maxLength={800} className={area} /></label>
            <label className="flex items-start gap-2 text-sm text-ink/75 sm:col-span-2"><input type="checkbox" required className="mt-1" />I confirm my license is active and in good standing, I carry professional liability (malpractice) insurance, I only see clients where I’m licensed, and I’ll tell Marriage Mode right away if any of that changes. I’m responsible for my own clinical care, records and payments.</label>
            {err && <p role="alert" className="text-sm text-coral sm:col-span-2">{err}</p>}
            <button className="min-h-12 rounded-full bg-mango px-6 font-semibold text-night sm:col-span-2 sm:justify-self-start">Apply to join</button>
          </form>
        )}
        <p className="mt-4 text-xs text-ink/50">We re-check every listed license once a year. Listing isn’t an endorsement: Marriage Mode by Upfront Consulting with Tiff &amp; Reco LLC doesn’t provide clinical care and isn’t part of any counseling relationship.</p>
        {!cloudEnabled && <p className="mt-3 text-xs text-ink/55">Sign-ups are offline on this copy of the site.</p>}
      </section>
    </div>
  );
}
