'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { buildSteps, score, EMPTY_STATE, type AuditState } from '@/lib/audit';
import { decodeSpace, encodeSpace, upsertPerson, EMPTY_SPACE, type Space, type Person } from '@/lib/couple';
import { track } from '@/lib/track';
import Ring from '@/components/Ring';
import Aurora from '@/components/Aurora';

const AUDIT_KEY = 'marriage-mode:audit:v1', SPACE_KEY = 'marriage-mode:couple:v1', NAME_KEY = 'marriage-mode:couple:name';
const SUGGESTED = ['Agree on what is okay for follows and DMs', 'Both finish our own audits', 'Fill in the Digital Boundaries worksheet together', 'Check in again in one month'];
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string | null) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* private mode */ } };

export default function CoupleApp() {
  const [space, setSpace] = useState<Space>(EMPTY_SPACE);
  const [name, setName] = useState('');
  const [audit, setAudit] = useState<AuditState>(EMPTY_STATE);
  const [share, setShare] = useState({ progress: false, closed: false, milestones: false });
  const [note, setNote] = useState('');
  const [goal, setGoal] = useState('');
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [fromLink, setFromLink] = useState(false);

  useEffect(() => {
    const fromHash = window.location.hash.length > 1 ? decodeSpace(window.location.hash) : null;
    const saved = get(SPACE_KEY); const local = saved ? decodeSpace(saved) : null;
    if (fromHash) { setSpace(fromHash); setFromLink(true); set(SPACE_KEY, encodeSpace(fromHash)); } else if (local) setSpace(local);
    setName(get(NAME_KEY) ?? '');
    try { const a = get(AUDIT_KEY); if (a) setAudit({ ...EMPTY_STATE, ...JSON.parse(a) }); } catch { /* ignore */ }
  }, []);

  const s = useMemo(() => score(buildSteps(audit), audit.done), [audit]);
  const hasAudit = audit.platformIds.length + audit.custom.length > 0;
  const milestones = [
    s.doneCount >= 1 && 'First step', s.progress >= 50 && 'Halfway',
    s.accountsTotal > 0 && s.accountsClosed === s.accountsTotal && 'All accounts deleted', hasAudit && s.progress === 100 && 'Clean slate',
  ].filter(Boolean) as string[];
  const me = name.trim().toLowerCase();
  const partner = space.people.find((p) => p.name.toLowerCase() !== me);
  const mine = space.people.find((p) => p.name.toLowerCase() === me && me);

  const persist = (sp: Space) => { setSpace(sp); set(SPACE_KEY, encodeSpace(sp)); setLink(''); };
  const toggleGoal = (i: number) => persist({ ...space, goals: space.goals.map((g, j) => (j === i ? { ...g, done: !g.done } : g)) });
  const addGoal = (t: string) => { const v = t.trim(); if (v && !space.goals.some((g) => g.t === v)) persist({ ...space, goals: [...space.goals, { t: v, done: false }].slice(0, 12) }); setGoal(''); };

  const makeLink = () => {
    if (!name.trim()) return;
    set(NAME_KEY, name.trim());
    const card: Person = { name: name.trim(), updated: new Date().toISOString().slice(0, 10), note: note.trim() || undefined };
    if (share.progress) card.progress = s.progress;
    if (share.closed) { card.closed = s.accountsClosed; card.total = s.accountsTotal; }
    if (share.milestones) card.milestones = milestones;
    const sp = upsertPerson(space, card); setSpace(sp); set(SPACE_KEY, encodeSpace(sp));
    const url = `${window.location.origin}${window.location.pathname}#${encodeSpace(sp)}`;
    setLink(url); track('couple-link-created');
  };
  const send = async () => {
    try { if (navigator.share) { await navigator.share({ text: 'Our Marriage Mode space', url: link }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };
  const leave = () => {
    if (!confirm('Remove Couple Mode from this device? Your partner keeps their own copy of anything already sent.')) return;
    set(SPACE_KEY, null); set(NAME_KEY, null); setSpace(EMPTY_SPACE); setName(''); setLink('');
    history.replaceState(null, '', window.location.pathname);
  };
  const quickExit = () => { set(SPACE_KEY, null); window.location.replace('https://www.google.com/search?q=weather'); };

  const Card = ({ p, title }: { p: Person; title: string }) => (
    <div className="glass p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal">{title}</p>
      <p className="mt-1 text-xl font-semibold">{p.name}</p>
      <p className="text-xs text-ink/50">Updated {p.updated}</p>
      <div className="mt-4 flex flex-wrap items-center gap-5">
        {p.progress !== undefined && <Ring value={p.progress} size={76} label="Steps done" />}
        {p.closed !== undefined && <div><p className="text-2xl font-bold text-teal">{p.closed}/{p.total}</p><p className="text-xs text-ink/55">accounts deleted</p></div>}
      </div>
      {p.milestones && p.milestones.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{p.milestones.map((m) => <span key={m} className="rounded-full bg-lagoon/15 px-2.5 py-1 text-xs text-ink ring-1 ring-lagoon/40">✓ {m}</span>)}</div>}
      {p.note && <p className="mt-3 rounded-xl bg-night/60 p-3 text-sm text-ink/80">&ldquo;{p.note}&rdquo;</p>}
      {p.progress === undefined && p.closed === undefined && !p.milestones && !p.note && <p className="mt-3 text-sm text-ink/55">Nothing shared yet. That&apos;s okay.</p>}
    </div>
  );

  return (
    <div className="relative isolate">
      <Aurora className="absolute inset-x-0 top-0 -z-10 h-[520px] w-full opacity-70 [mask-image:linear-gradient(#000,transparent)]" />
      <div className="grid-bg absolute inset-x-0 top-0 -z-10 h-[480px]" aria-hidden="true" />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-mango">Couple Mode · private link · no accounts</p>
            <h1 className="mt-1 text-3xl font-bold">Your space for <span className="text-glow">two</span></h1>
          </div>
          <button onClick={quickExit} className="min-h-11 rounded-full bg-coral/15 px-4 text-sm font-semibold text-coral ring-1 ring-coral/40">Quick exit</button>
        </div>

        {fromLink && partner && <p className="mt-4 rounded-xl bg-lagoon/10 p-4 text-sm ring-1 ring-lagoon/30"><strong>{partner.name}</strong> invited you. Look at what they shared below, then add your own card if you want to.</p>}
        {space.people.length === 0 && (
          <ol className="mt-6 grid gap-3 sm:grid-cols-3">
            {['Choose what you want to share. Nothing is shared by default.', 'Tap “Get our link” and send it to your partner however you like.', 'They add their own card and send the link back. Your space updates.'].map((t, i) => (
              <li key={t} className="glass p-4 text-sm text-ink/75"><span className="font-mono text-teal">0{i + 1}</span><p className="mt-1">{t}</p></li>
            ))}
          </ol>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
          {partner ? <Card p={partner} title="Shared with you" /> : <div className="glass grid place-items-center p-6 text-center text-sm text-ink/55">Your partner&apos;s card appears here when they send the link back.</div>}
          {mine ? <Card p={mine} title="What you shared" /> : <div className="glass grid place-items-center p-6 text-center text-sm text-ink/55">Your card appears here after you get your link.</div>}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
          <div className="halo-border">
            <div className="h-full rounded-[1.75rem] bg-deep/95 p-6">
              <h2 className="text-lg font-semibold">Your card</h2>
              <label className="mt-3 block text-sm text-ink/70" htmlFor="cm-name">Your first name or nickname</label>
              <input id="cm-name" value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} className="mt-1 min-h-11 w-full rounded-full border border-white/15 bg-night/60 px-4" />
              <p className="mt-4 text-sm text-ink/70">Share from my audit (all off until you choose):</p>
              {!hasAudit && <p className="mt-1 text-xs text-ink/50">No audit on this device yet. <Link href="/audit/" className="text-teal underline">Start yours</Link> to share progress.</p>}
              {([['progress', `Steps done (${s.progress}%)`], ['closed', `Accounts deleted (${s.accountsClosed} of ${s.accountsTotal})`], ['milestones', `Milestones (${milestones.length})`]] as const).map(([k, l]) => (
                <label key={k} className={`mt-2 flex min-h-11 items-center gap-3 ${hasAudit ? '' : 'opacity-40'}`}>
                  <input type="checkbox" disabled={!hasAudit} checked={share[k]} onChange={() => setShare((x) => ({ ...x, [k]: !x[k] }))} className="size-5 accent-[#D9B77E]" />{l}
                </label>
              ))}
              <label className="mt-3 block text-sm text-ink/70" htmlFor="cm-note">A note (optional)</label>
              <textarea id="cm-note" value={note} onChange={(e) => setNote(e.target.value.slice(0, 280))} rows={3} placeholder="I closed everything because we matter to me." className="mt-1 w-full rounded-2xl border border-white/15 bg-night/60 p-3 text-sm" />
              <button onClick={makeLink} disabled={!name.trim()} className="glow-mango mt-4 min-h-12 w-full rounded-full bg-mango font-semibold text-night disabled:opacity-40">Get our link</button>
              {link && (
                <div className="mt-4 rounded-xl bg-night/60 p-3">
                  <p className="text-sm">Your link is ready. Send it to your partner:</p>
                  <button onClick={send} className="glow-lagoon mt-2 min-h-11 w-full rounded-full bg-lagoon font-semibold text-night">{copied ? 'Link copied' : 'Send or copy link'}</button>
                  <p className="mt-2 text-xs text-ink/50">Anyone with this link can see what&apos;s in it, so send it only to your partner.</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass p-6">
            <h2 className="text-lg font-semibold">Shared goals</h2>
            <ul className="mt-3 space-y-1">
              {space.goals.map((g, i) => (
                <li key={g.t}><label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={g.done} onChange={() => toggleGoal(i)} className="size-5 accent-[#D9B77E]" /><span className={g.done ? 'text-ink/60 line-through' : ''}>{g.t}</span></label></li>
              ))}
            </ul>
            {space.goals.length === 0 && <p className="mt-2 text-sm text-ink/55">Add a goal you both want, or pick one:</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTED.filter((t) => !space.goals.some((g) => g.t === t)).map((t) => <button key={t} onClick={() => addGoal(t)} className="min-h-9 rounded-full bg-white/[0.04] px-3 text-xs ring-1 ring-white/10 hover:ring-lagoon/50">+ {t}</button>)}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={goal} onChange={(e) => setGoal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addGoal(goal)} placeholder="Our own goal" aria-label="Add a goal" className="min-h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-night/60 px-4" />
              <button onClick={() => addGoal(goal)} className="min-h-11 rounded-full px-4 ring-1 ring-white/15">Add</button>
            </div>
            <p className="mt-3 text-xs text-ink/50">Goal changes go to your partner the next time you send the link.</p>
          </div>
        </div>

        <div className="mt-6 glass p-5 text-sm text-ink/65">
          <p><strong className="text-ink">How privacy works:</strong> your space lives inside the link itself. It never goes to our servers, and there are no accounts. Either of you can stop at any time by not sending updates and removing it from your device.</p>
          <p className="mt-2">If anyone pressures you to share, give up passwords or be tracked, that isn&apos;t trust. Free, confidential help: National Domestic Violence Hotline, 1-800-799-7233, or text START to 88788.</p>
          <button onClick={leave} className="mt-3 text-ink/55 underline">Remove Couple Mode from this device</button>
        </div>
      </div>
    </div>
  );
}
