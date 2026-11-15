'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Ring from './Ring';
import { cloudEnabled } from '@/lib/cloud';
import { BASE } from '@/lib/base';
const here = () => `${window.location.origin}${BASE}`;
import { track } from '@/lib/track';
import * as P from '@/lib/partner';

type Props = {
  signedIn: boolean;
  openSignIn: () => void;
  stats: { progress: number; closed: number; total: number; milestones: string[] };
  summary: string;
};

function Avatar({ p, size = 44 }: { p?: P.Profile; size?: number }) {
  const url = P.avatarUrl(p?.avatar_path ?? null);
  const initial = (p?.display_name || '?').trim().charAt(0).toUpperCase();
  return url
    ? <img src={url} alt="" width={size} height={size} className="rounded-full object-cover ring-2 ring-lagoon/60" style={{ width: size, height: size }} />
    : <span className="grid place-items-center rounded-full bg-lagoon/15 font-semibold text-teal ring-2 ring-lagoon/40" style={{ width: size, height: size }}>{initial}</span>;
}

export default function PartnerTab({ signedIn, openSignIn, stats, summary }: Props) {
  const [couple, setCouple] = useState<P.Couple | null>(null);
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<Record<string, P.Profile>>({});
  const [shared, setShared] = useState<Record<string, P.Shared>>({});
  const [goals, setGoals] = useState<P.Goal[]>([]);
  const [msgs, setMsgs] = useState<P.Message[]>([]);
  const [invite, setInvite] = useState('');
  const [note, setNote] = useState('');
  const [text, setText] = useState('');
  const [goal, setGoal] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const cp = await P.myCouple(); setCouple(cp); setLoading(false);
    if (!cp) return;
    setPeople(await P.profiles([cp.me, cp.partner].filter(Boolean) as string[]));
    if (cp.status === 'active') {
      const [sh, g, m] = await Promise.all([P.sharedBy(cp.id), P.goals(cp.id), P.messages(cp.id)]);
      setShared(sh); setGoals(g); setMsgs(m);
    }
  }, []);

  // Accept an invite link opened on this device, then load the space.
  useEffect(() => {
    if (!signedIn) { setLoading(false); return; }
    (async () => {
      const token = P.captureJoinToken();
      if (token) { const err = await P.acceptJoin(token); setNotice(err ?? 'You are linked with your partner. 💞'); if (!err) track('partner-linked'); }
      await refresh();
    })();
  }, [signedIn, refresh]);

  // Live messages, plus a gentle refresh for shares and goals.
  useEffect(() => {
    if (!couple || couple.status !== 'active') return;
    const stop = P.onMessages(couple.id, (m) => setMsgs((x) => (x.some((y) => y.id === m.id) ? x : [...x, m])));
    const t = setInterval(refresh, 20000);
    return () => { stop(); clearInterval(t); };
  }, [couple, refresh]);
  useEffect(() => { box.current?.scrollTo({ top: 1e9 }); }, [msgs.length]);

  const makeInvite = async () => { const l = await P.createInviteLink(here()); if (l) { setInvite(l); setCouple((c) => c ?? { id: '', status: 'pending', me: '', partner: null }); track('partner-invite'); } else setNotice('Could not make an invite link. Try again in a minute.'); };
  const sendInvite = async () => {
    try { if (navigator.share) { await navigator.share({ text: 'Join me in our Marriage Mode partner space', url: invite }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(invite); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };
  const share = async (on: boolean) => {
    if (!couple) return;
    const ok = await P.shareMine(couple.id, couple.me, on ? { progress: stats.progress, closed: stats.closed, total: stats.total, milestones: stats.milestones, note: note.trim() || undefined, at: new Date().toISOString() } : null);
    if (ok) setShared(await P.sharedBy(couple.id));
  };
  const send = async (e: React.FormEvent) => { e.preventDefault(); const v = text.trim(); if (!v || !couple) return; setText(''); if (!(await P.sendMessage(couple.id, v))) { setText(v); setNotice('Message not sent. Check your connection.'); } else setMsgs(await P.messages(couple.id)); };
  const leave = async () => { await P.leaveCouple(); setConfirmLeave(false); setCouple(null); setInvite(''); setNotice('You left the partner space. Sharing has stopped for both of you.'); };
  const quickExit = () => window.location.replace('https://www.google.com/search?q=weather');

  // ── Not signed in / not set up ──
  if (!cloudEnabled || !signedIn) return (
    <section className="mt-6 grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
      <div className="halo-border"><div className="h-full rounded-[1.75rem] bg-deep/95 p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mango">Partner space</p>
        <h2 className="mt-2 text-xl font-semibold">Talk, share and set goals with your partner</h2>
        <p className="mt-2 text-sm text-ink/65">Messages, shared goals and the progress you each choose to share, all in one private space. It needs a free sign-in so it stays in sync between your two phones.</p>
        {cloudEnabled && <button onClick={openSignIn} className="glow-mango mt-4 min-h-11 rounded-full bg-mango px-5 font-semibold text-night">Sign in to start</button>}
        <p className="mt-4 text-sm text-ink/55">Prefer no account? <a href="../couple/" className="text-teal underline">Use Couple Mode with a private link</a>.</p>
      </div></div>
      <div className="glass p-6">
        <h2 className="text-lg font-semibold">Or just send a quick update</h2>
        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-night/70 p-4 font-sans text-sm">{summary}</pre>
        <button onClick={async () => { try { await navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ } track('share-copied'); }} className="mt-3 min-h-11 rounded-full px-5 font-semibold ring-1 ring-white/15">{copied ? 'Copied' : 'Copy message'}</button>
      </div>
    </section>
  );

  if (loading) return <p className="mt-6 text-ink/60">Loading your partner space…</p>;

  const partner = couple?.partner ? people[couple.partner] : undefined;
  const mine = couple ? shared[couple.me] : undefined;
  const theirs = couple?.partner ? shared[couple.partner] : undefined;

  return (
    <section className="mt-6 space-y-4">
      {notice && <p role="status" className="rounded-xl bg-lagoon/10 p-3 text-sm ring-1 ring-lagoon/30">{notice}</p>}

      {(!couple || couple.status !== 'active') && (
        <div className="halo-border"><div className="rounded-[1.75rem] bg-deep/95 p-6">
          <h2 className="text-xl font-semibold">Invite your partner</h2>
          <p className="mt-1 text-sm text-ink/65">They open the link on their own phone, sign in with their own email, and you&apos;re linked. Nothing is shared until each of you chooses.</p>
          {!invite
            ? <button onClick={makeInvite} className="glow-mango mt-4 min-h-12 rounded-full bg-mango px-6 font-semibold text-night">Make my invite link</button>
            : <div className="mt-4 rounded-xl bg-night/60 p-3"><p className="break-all text-xs text-ink/60">{invite}</p>
                <button onClick={sendInvite} className="glow-lagoon mt-2 min-h-11 w-full rounded-full bg-lagoon font-semibold text-night">{copied ? 'Link copied' : 'Send or copy the link'}</button>
                <p className="mt-2 text-xs text-ink/50">Send it only to your partner. It works once and expires in 7 days.</p></div>}
          <p className="mt-3 text-xs text-ink/50">Waiting for your partner? This page updates once they join.</p>
        </div></div>
      )}

      {couple?.status === 'active' && (
        <>
          <div className="glass flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex items-center gap-3"><Avatar p={people[couple.me]} /><span className="text-2xl">💞</span><Avatar p={partner} />
              <div><p className="font-semibold">You &amp; {partner?.display_name || 'your partner'}</p><p className="text-xs text-ink/55">Private to the two of you</p></div></div>
            <button onClick={quickExit} className="min-h-11 rounded-full bg-coral/15 px-4 text-sm font-semibold text-coral ring-1 ring-coral/40">Quick exit</button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
            <div className="glass p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal">Shared with you</p>
              {theirs ? (<div className="mt-3 flex flex-wrap items-center gap-5">
                {theirs.progress !== undefined && <Ring value={theirs.progress} size={76} label="Steps done" />}
                {theirs.closed !== undefined && <div><p className="text-2xl font-bold text-teal">{theirs.closed}/{theirs.total}</p><p className="text-xs text-ink/55">accounts deleted</p></div>}
                {theirs.milestones?.length ? <div className="flex flex-wrap gap-2">{theirs.milestones.map((m) => <span key={m} className="rounded-full bg-lagoon/15 px-2.5 py-1 text-xs ring-1 ring-lagoon/40">✓ {m}</span>)}</div> : null}
                {theirs.note && <p className="w-full rounded-xl bg-night/60 p-3 text-sm">&ldquo;{theirs.note}&rdquo;</p>}
              </div>) : <p className="mt-3 text-sm text-ink/55">{partner?.display_name || 'Your partner'} hasn&apos;t shared progress yet. That&apos;s okay.</p>}
            </div>
            <div className="glass p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mango">What you share</p>
              <p className="mt-2 text-sm text-ink/65">{mine ? `Sharing: ${stats.progress}% of steps, ${stats.closed}/${stats.total} accounts deleted, ${stats.milestones.length} milestones.` : 'Nothing shared yet. You choose.'}</p>
              <label htmlFor="share-note" className="mt-3 block text-sm text-ink/70">A note (optional)</label>
              <input id="share-note" value={note} onChange={(e) => setNote(e.target.value.slice(0, 280))} placeholder="Closed everything. We matter to me." className="mt-1 min-h-11 w-full rounded-full border border-white/15 bg-night/60 px-4" />
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => share(true)} className="glow-mango min-h-11 rounded-full bg-mango px-5 text-sm font-semibold text-night">{mine ? 'Update what I share' : 'Share my progress'}</button>
                {mine && <button onClick={() => share(false)} className="min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15">Stop sharing</button>}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr] [&>*]:min-w-0">
            <div className="glass p-5">
              <h3 className="font-semibold">Shared goals</h3>
              <ul className="mt-2 space-y-1">{goals.map((g) => (
                <li key={g.id}><label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={g.done} onChange={async () => { await P.setGoal(g.id, !g.done); setGoals(await P.goals(couple.id)); }} className="size-5 accent-[#34E29B]" /><span className={g.done ? 'text-ink/45 line-through' : ''}>{g.title}</span></label></li>))}</ul>
              {!goals.length && <p className="text-sm text-ink/55">Add something you both want, like &ldquo;Agree on follows and DMs&rdquo;.</p>}
              <form onSubmit={async (e) => { e.preventDefault(); if (!goal.trim()) return; await P.addGoal(couple.id, couple.me, goal.trim()); setGoal(''); setGoals(await P.goals(couple.id)); }} className="mt-3 flex gap-2">
                <label htmlFor="new-goal" className="sr-only">New goal</label>
                <input id="new-goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="A goal for us" className="min-h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-night/60 px-4" />
                <button className="min-h-11 rounded-full px-4 ring-1 ring-white/15">Add</button>
              </form>
            </div>
            <div className="glass flex flex-col p-5">
              <h3 className="font-semibold">Messages</h3>
              <div ref={box} className="mt-3 flex max-h-80 min-h-40 flex-col gap-2 overflow-y-auto pr-1" aria-live="polite">
                {msgs.length === 0 && <p className="text-sm text-ink/55">Say something kind to start. Only the two of you can read this.</p>}
                {msgs.map((m) => { const mineMsg = m.author_id === couple.me; return (
                  <div key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm [overflow-wrap:anywhere] ${mineMsg ? 'self-end bg-mango/15 ring-1 ring-mango/30' : 'self-start bg-lagoon/10 ring-1 ring-lagoon/30'}`}>
                    <p>{m.body}</p><p className="mt-0.5 text-[10px] text-ink/45">{new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                  </div>); })}
              </div>
              <form onSubmit={send} className="mt-3 flex gap-2">
                <label htmlFor="partner-msg" className="sr-only">Message</label>
                <input id="partner-msg" value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message ${partner?.display_name || 'your partner'}…`} className="min-h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-night/60 px-4" />
                <button className="glow-lagoon min-h-11 rounded-full bg-lagoon px-5 font-semibold text-night">Send</button>
              </form>
            </div>
          </div>
        </>
      )}

      {couple && (
        <div className="glass p-5 text-sm text-ink/65">
          <p>Either of you can leave at any time. Leaving ends sharing and messages for both of you right away.</p>
          {!confirmLeave ? <button onClick={() => setConfirmLeave(true)} className="mt-2 text-ink/60 underline">Leave the partner space</button>
            : <div className="mt-2 flex flex-wrap items-center gap-2"><span>Leave now?</span><button onClick={leave} className="min-h-11 rounded-full bg-coral/20 px-4 font-semibold text-coral">Yes, leave</button><button onClick={() => setConfirmLeave(false)} className="min-h-11 rounded-full px-4 ring-1 ring-white/15">Cancel</button></div>}
          <p className="mt-3">If anyone pressures you to share, hand over passwords or be tracked, that isn&apos;t trust. Free, confidential help: 1-800-799-7233 or text START to 88788.</p>
        </div>
      )}
    </section>
  );
}
