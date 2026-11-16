'use client';
// Founders: approve licensed counselors (after checking the license with the state board)
// and forward couples' session requests to the counselor by email.
import { useEffect, useState } from 'react';
import { founderCounselors, founderRequests, founderSetCounselor, founderMarkForwarded } from '@/lib/cloud';

type C = Awaited<ReturnType<typeof founderCounselors>>[number];
type R = Awaited<ReturnType<typeof founderRequests>>[number];

export default function FounderCounselors() {
  const [cs, setCs] = useState<C[]>([]); const [rs, setRs] = useState<R[]>([]);
  const load = () => { void founderCounselors().then(setCs); void founderRequests().then(setRs); };
  useEffect(load, []);
  const pending = cs.filter((c) => c.status === 'pending'); const open = rs.filter((r) => !r.forwarded);
  if (!pending.length && !open.length) return null;
  const byId = new Map(cs.map((c) => [c.id, c]));
  return (
    <section className="glass mt-6 p-5">
      <h2 className="text-lg font-semibold">🩺 Counselors</h2>
      {pending.map((c) => (
        <div key={c.id} className="mt-3 rounded-2xl bg-white/[0.04] p-4 text-sm">
          <p className="font-semibold">{c.name}, {c.credential} · {c.license_state} #{c.license_number}</p>
          <p className="text-ink/60">{c.email}{c.fee_note ? ` · ${c.fee_note}` : ''}</p>
          <p className="mt-1 text-ink/70">Step 1 (and again every year): look up the license on the {c.license_state} state board site (search “{c.license_state} license lookup {c.credential}”). Step 2: if it’s active, tap Approve.</p>
          <div className="mt-2 flex gap-2">
            <button onClick={async () => { await founderSetCounselor(c.id, 'approved'); load(); }} className="min-h-10 rounded-full bg-mango px-4 font-semibold text-night">Approve</button>
            <button onClick={async () => { await founderSetCounselor(c.id, 'paused'); load(); }} className="min-h-10 rounded-full px-4 ring-1 ring-white/15">Decline</button>
          </div>
        </div>
      ))}
      {open.map((r) => { const c = byId.get(r.counselor_id); const body = `Hi ${c?.name ?? ''},\n\nA couple asked for a session through Marriage Mode:\n\nNames: ${r.name}\nEmail: ${r.email}\nState: ${r.state ?? ''}\nHow: ${r.format ?? ''}\nGood times: ${r.times ?? ''}\nNote: ${r.note ?? ''}\n\nPlease reply to them directly.\n\nMarriage Mode by Upfront Consulting with Tiff & Reco LLC`;
        return (
          <div key={r.id} className="mt-3 rounded-2xl bg-white/[0.04] p-4 text-sm">
            <p className="font-semibold">Session request: {r.name} → {c?.name ?? 'counselor'}</p>
            <p className="text-ink/60">{new Date(r.created_at).toLocaleString()} · {r.times}</p>
            <div className="mt-2 flex gap-2">
              <a href={`mailto:${c?.email ?? ''}?subject=${encodeURIComponent('New Marriage Mode session request')}&body=${encodeURIComponent(body)}`} className="inline-flex min-h-10 items-center rounded-full bg-mango px-4 font-semibold text-night">Email it to the counselor</a>
              <button onClick={async () => { await founderMarkForwarded(r.id); load(); }} className="min-h-10 rounded-full px-4 ring-1 ring-white/15">Mark sent</button>
            </div>
          </div>
        ); })}
    </section>
  );
}
