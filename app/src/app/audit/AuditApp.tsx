'use client';
import { useEffect, useMemo, useState } from 'react';
import { PLATFORMS, CATEGORY_LABEL, BILLING_LINKS, helpSearchUrl, CATALOG_VERIFIED, type Category } from '@/lib/catalog';
import { buildSteps, score, emailDomainsFor, gmailQuery, gmailSearchUrl, shareSummary, EMPTY_STATE, type AuditState, type Step } from '@/lib/audit';
import { track } from '@/lib/track';
import Ring from '@/components/Ring';
import { cloud, cloudEnabled, sendLink, pull, push, merge, signOut } from '@/lib/cloud';
import { SITE, KIT_URL } from '@/lib/base';

const KEY = 'marriage-mode:audit:v1';
const TABS = [
  { id: 'overview', label: 'Overview', icon: '◎' },
  { id: 'apps', label: 'My apps', icon: '＋' },
  { id: 'clean', label: 'Clean up', icon: '✓' },
  { id: 'find', label: 'Find', icon: '⌕' },
  { id: 'share', label: 'Share', icon: '♡' },
] as const;
type Tab = (typeof TABS)[number]['id'];
const KIND_ORDER: Step['kind'][] = ['delete_profile', 'cancel_billing', 'delete_app', 'stop_emails', 'contacts', 'social'];

function load(): AuditState {
  try { const raw = localStorage.getItem(KEY); return raw ? { ...EMPTY_STATE, ...JSON.parse(raw) } : EMPTY_STATE; } catch { return EMPTY_STATE; }
}
function save(s: AuditState) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode */ } }

type Status = 'Not started' | 'In progress' | 'Closed';
const badge: Record<Status, string> = { 'Not started': 'bg-white/[0.06] text-ink/60', 'In progress': 'bg-mango/15 text-mango', Closed: 'bg-palm/15 text-palm' };

export default function AuditApp() {
  const [state, setState] = useState<AuditState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [q, setQ] = useState('');
  const [custom, setCustom] = useState('');
  const [copied, setCopied] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  const [syncEmail, setSyncEmail] = useState<string | null>(null);
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [emailInput, setEmailInput] = useState('');

  // Optional sync: on sign-in, merge this device with the saved copy, then keep it saved.
  useEffect(() => {
    const c = cloud(); if (!c || !ready) return;
    const onSignedIn = async (email: string) => {
      setSyncEmail(email);
      const remote = await pull();
      setState((local) => { const m = remote ? merge(local, remote.state) : local; void push(m); return m; });
    };
    c.auth.getSession().then(({ data }) => { if (data.session?.user.email) onSignedIn(data.session.user.email); });
    const { data: sub } = c.auth.onAuthStateChange((ev, session) => {
      if (ev === 'SIGNED_IN' && session?.user.email) onSignedIn(session.user.email);
      if (ev === 'SIGNED_OUT') setSyncEmail(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [ready]);
  useEffect(() => {
    if (!syncEmail || !ready) return;
    const t = setTimeout(() => { void push(state); }, 1500);
    return () => clearTimeout(t);
  }, [state, syncEmail, ready]);

  useEffect(() => { const s = load(); setState(s); setReady(true); if (s.platformIds.length + s.custom.length === 0) setTab('apps'); }, []);
  useEffect(() => { if (ready) save(state); }, [state, ready]);
  useEffect(() => { if (ready && state.platformIds.length + state.custom.length > 0) track('audit-started'); }, [ready, state.platformIds.length, state.custom.length]);

  const steps = useMemo(() => buildSteps(state), [state.platformIds, state.custom]); // eslint-disable-line react-hooks/exhaustive-deps
  const s = useMemo(() => score(steps, state.done), [steps, state.done]);
  const domains = useMemo(() => emailDomainsFor(state.platformIds), [state.platformIds]);
  const hasApps = state.platformIds.length + state.custom.length > 0;

  useEffect(() => {
    if (s.progress >= 50) track('audit-half-done');
    if (s.progress === 100 && hasApps) { track('audit-complete'); setCelebrate(true); }
  }, [s.progress, hasApps]);

  const groups = useMemo(() => {
    const g: { title: string; items: Step[] }[] = [];
    for (const st of steps) { const t = st.group ?? 'Everywhere else'; const x = g.find((y) => y.title === t); if (x) x.items.push(st); else g.push({ title: t, items: [st] }); }
    return g.map((x) => {
      const n = x.items.filter((i) => state.done[i.id]).length;
      const status: Status = n === 0 ? 'Not started' : n === x.items.length ? 'Closed' : 'In progress';
      return { ...x, n, status, pct: Math.round((100 * n) / x.items.length) };
    });
  }, [steps, state.done]);

  const next = useMemo(() => {
    for (const k of KIND_ORDER) { const st = steps.find((x) => x.kind === k && !state.done[x.id]); if (st) return st; }
    return undefined;
  }, [steps, state.done]);

  const timeline = useMemo(() => Object.entries(state.doneAt ?? {})
    .filter(([id]) => state.done[id]).map(([id, at]) => ({ at, step: steps.find((x) => x.id === id) }))
    .filter((x) => x.step).sort((a, b) => b.at.localeCompare(a.at)), [state.doneAt, state.done, steps]);

  const milestones = [
    { t: 'First step', ok: s.doneCount >= 1 },
    { t: 'First app closed', ok: groups.some((g) => g.title !== 'Everywhere else' && g.status === 'Closed') },
    { t: 'Halfway', ok: s.progress >= 50 },
    { t: 'All accounts deleted', ok: s.accountsTotal > 0 && s.accountsClosed === s.accountsTotal },
    { t: 'Clean slate', ok: hasApps && s.progress === 100 },
  ];

  const toggle = (id: string) => setState((st) => ({ ...st, platformIds: st.platformIds.includes(id) ? st.platformIds.filter((x) => x !== id) : [...st.platformIds, id], startedAt: st.startedAt ?? new Date().toISOString() }));
  const tick = (id: string) => setState((st) => {
    const on = !st.done[id]; const doneAt = { ...(st.doneAt ?? {}) };
    if (on) doneAt[id] = new Date().toISOString(); else delete doneAt[id];
    return { ...st, done: { ...st.done, [id]: on }, doneAt };
  });
  const addCustom = () => { const n = custom.trim(); if (n && !state.custom.includes(n)) setState((st) => ({ ...st, custom: [...st.custom, n] })); setCustom(''); };
  const copy = async (text: string, what: string) => { try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(''), 2000); } catch { /* ignore */ } };
  const reset = () => { if (confirm('Clear your audit from this device?')) { setState(EMPTY_STATE); setTab('apps'); } };
  const summary = shareSummary(s);
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const cats = Object.keys(CATEGORY_LABEL) as Category[];
  const filtered = PLATFORMS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  const stepRow = (st: Step) => {
    const p = PLATFORMS.find((x) => x.id === st.platformId);
    return (
      <li key={st.id}>
        <label className="flex min-h-11 cursor-pointer gap-3 rounded-xl p-2 hover:bg-white/[0.03]">
          <input type="checkbox" checked={!!state.done[st.id]} onChange={() => tick(st.id)} className="mt-1 size-5 shrink-0 accent-[#34E29B]" />
          <span>
            <span className={`font-medium ${state.done[st.id] ? 'text-ink/45 line-through' : ''}`}>{st.label}</span>
            {st.detail && <span className="block text-sm text-ink/60">{st.detail}</span>}
            {st.kind === 'cancel_billing' && (
              <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {(p ? p.billing : (['apple', 'google', 'web'] as const)).map((b) => BILLING_LINKS[b].url
                  ? <a key={b} href={BILLING_LINKS[b].url} target="_blank" rel="noopener noreferrer" className="text-teal underline">{BILLING_LINKS[b].label} ↗</a>
                  : <span key={b} className="text-ink/50">{BILLING_LINKS[b].how}</span>)}
              </span>
            )}
          </span>
        </label>
      </li>
    );
  };

  return (
    <div className="relative isolate pb-28 md:pb-10">
      <div className="grid-bg absolute inset-x-0 top-0 -z-10 h-[520px] print:hidden" aria-hidden="true" />

      {/* Celebration */}
      {celebrate && (
        <div role="dialog" aria-label="Clean slate" className="fixed inset-0 z-[60] grid place-items-center bg-night/80 p-4 backdrop-blur print:hidden" onClick={() => setCelebrate(false)}>
          <div className="halo-border max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-[1.75rem] bg-deep p-8">
              <div className="pulse-soft mx-auto"><Ring value={100} size={120} /></div>
              <h2 className="mt-4 text-2xl font-bold"><span className="text-glow">Clean slate.</span></h2>
              <p className="mt-2 text-ink/70">Every step is done. That took real care. Want to share it?</p>
              <div className="mt-6 flex justify-center gap-2">
                <button onClick={() => { setCelebrate(false); setTab('share'); }} className="glow-mango rounded-full bg-mango px-5 py-3 font-semibold text-night">Share my progress</button>
                <button onClick={() => setCelebrate(false)} className="rounded-full px-5 py-3 ring-1 ring-white/15">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-8 print:hidden">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-teal">Private · saved on this device only</p>
            <h1 className="mt-1 text-3xl font-bold">Your dashboard</h1>
            {cloudEnabled && (
              <button onClick={() => setSyncOpen((o) => !o)} className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-full bg-white/[0.04] px-3 text-xs ring-1 ring-white/10 hover:ring-lagoon/50">
                <span className={`size-1.5 rounded-full ${syncEmail ? 'bg-lagoon shadow-[0_0_8px_#34E29B]' : 'bg-ink/40'}`} />{syncEmail ? 'Synced across devices' : 'Use on more than one device?'}
              </button>
            )}
          </div>
          <nav className="hidden gap-1 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/10 md:flex" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === t.id ? 'bg-lagoon text-night glow-lagoon' : 'text-ink/70 hover:text-ink'}`}>{t.label}</button>
            ))}
          </nav>
        </div>

        {syncOpen && cloudEnabled && (
          <div className="glass mt-4 max-w-xl p-5">
            {syncEmail ? (
              <>
                <p className="font-semibold">Synced as {syncEmail}</p>
                <p className="mt-1 text-sm text-ink/60">Your checklist is saved to your private account and stays the same on every device you sign in on. Only you can see it.</p>
                <button onClick={() => { void signOut(); setSyncOpen(false); }} className="mt-3 min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15">Sign out</button>
              </>
            ) : (
              <form onSubmit={async (e) => { e.preventDefault(); setSyncMsg('Sending…'); const err = await sendLink(emailInput.trim(), `${SITE}/audit/`); setSyncMsg(err ? `That didn't work: ${err}` : 'Check your email and tap the link to finish. You can close this.'); }}>
                <p className="font-semibold">Sync across your devices (optional)</p>
                <p className="mt-1 text-sm text-ink/60">Without signing in, your audit stays only on this device. Sign in with an email link (no password) to keep it on every device. Only you can see it, and you can sign out anytime.</p>
                <div className="mt-3 flex gap-2">
                  <label htmlFor="sync-email" className="sr-only">Email</label>
                  <input id="sync-email" type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="you@email.com" className="min-h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-night/60 px-4" />
                  <button className="glow-lagoon min-h-11 rounded-full bg-lagoon px-4 text-sm font-semibold text-night">Email me a link</button>
                </div>
                {syncMsg && <p className="mt-2 text-sm text-ink/70" role="status">{syncMsg}</p>}
              </form>
            )}
          </div>
        )}

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="glass flex flex-wrap items-center gap-6 p-6 lg:col-span-2">
              <Ring value={s.organization} size={112} label="Clean-slate score" sub={`${s.accountsClosed} of ${s.accountsTotal} accounts deleted`} />
              <Ring value={s.progress} size={88} label="Steps done" sub={`${s.doneCount} of ${s.total}`} />
            </div>
            <div className="halo-border">
              <div className="h-full rounded-[1.75rem] bg-deep/95 p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mango">Next best step</p>
                {next ? (
                  <>
                    <p className="mt-2 text-lg font-semibold">{next.label}</p>
                    {next.detail && <p className="mt-1 text-sm text-ink/60">{next.detail}</p>}
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => tick(next.id)} className="glow-mango min-h-11 rounded-full bg-mango px-5 text-sm font-semibold text-night">Mark done</button>
                      <button onClick={() => setTab('clean')} className="min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15">See how</button>
                    </div>
                  </>
                ) : <p className="mt-2 text-lg font-semibold">{hasApps ? 'All done. Nothing left behind.' : 'Add the apps you used to begin.'}</p>}
              </div>
            </div>

            <div className="glass p-6 lg:col-span-2">
              <div className="flex items-center justify-between"><h2 className="font-semibold">Apps</h2><button onClick={() => setTab('apps')} className="text-sm text-teal">+ Add apps</button></div>
              {!hasApps && <p className="mt-3 text-ink/60">No apps yet. <button onClick={() => setTab('apps')} className="text-teal underline">Pick the ones you used</button>.</p>}
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {groups.filter((g) => g.title !== 'Everywhere else').map((g) => (
                  <button key={g.title} onClick={() => setTab('clean')} className="rounded-xl bg-white/[0.03] p-3.5 text-left ring-1 ring-white/[0.07] hover:ring-lagoon/40">
                    <div className="flex items-center justify-between gap-2 text-sm"><span className="font-medium">{g.title}</span><span className={`rounded-full px-2 py-0.5 text-[11px] ${badge[g.status]}`}>{g.status}</span></div>
                    <div className="mt-2.5 h-1.5 rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-lagoon to-mango transition-all" style={{ width: `${g.pct}%` }} /></div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass p-6">
              <h2 className="font-semibold">Milestones</h2>
              <ul className="mt-3 space-y-2">
                {milestones.map((m) => (
                  <li key={m.t} className={`flex items-center gap-3 text-sm ${m.ok ? '' : 'text-ink/40'}`}>
                    <span className={`grid size-7 place-items-center rounded-full text-xs ${m.ok ? 'bg-lagoon text-night shadow-[0_0_14px_-3px_#34E29B]' : 'ring-1 ring-white/15'}`}>{m.ok ? '✓' : ''}</span>{m.t}
                  </li>
                ))}
              </ul>
            </div>

            {KIT_URL && (
              <div className="glass flex flex-wrap items-center justify-between gap-4 p-6 lg:col-span-3">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mango">Optional · $19 one time</p>
                  <h2 className="mt-1 text-lg font-semibold">Clean Slate Kit</h2>
                  <p className="text-sm text-ink/65">A printable companion: cleanup report, 30-day boundaries plan and 12 conversation cards. The audit stays free.</p>
                </div>
                <a href={KIT_URL} target="_blank" rel="noopener noreferrer" className="glow-mango min-h-11 shrink-0 rounded-full bg-mango px-5 py-3 text-sm font-semibold text-night">Get the kit ↗</a>
              </div>
            )}
            <div className="glass p-6 lg:col-span-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">Timeline</h2>
                <button onClick={() => window.print()} className="min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15 hover:ring-lagoon/50">Print or save my report</button>
              </div>
              {timeline.length === 0 ? <p className="mt-3 text-sm text-ink/55">Each step you finish is recorded here with its date.</p> : (
                <ol className="mt-4 space-y-3 border-l border-lagoon/30 pl-5">
                  {timeline.slice(0, 8).map((x) => (
                    <li key={x.step!.id} className="relative text-sm"><span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full bg-lagoon shadow-[0_0_8px_#34E29B]" /><span className="text-ink/50">{fmt(x.at)}</span> · {x.step!.label}</li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}

        {/* APPS */}
        {tab === 'apps' && (
          <section className="mt-6">
            <div className="glass p-6">
              <h2 className="text-lg font-semibold">Which apps have you ever used?</h2>
              <p className="mt-1 text-ink/65">Tick every one, even if you only opened it once. Not sure? Use <button onClick={() => setTab('find')} className="text-teal underline">Find</button>.</p>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search apps…" aria-label="Search apps" className="mt-4 min-h-11 w-full rounded-full border border-white/15 bg-night/60 px-5 sm:w-80" />
              {cats.map((c) => {
                const items = filtered.filter((p) => p.category === c);
                if (!items.length) return null;
                return (
                  <div key={c} className="mt-6">
                    <h3 className="font-mono text-[11px] uppercase tracking-widest text-teal">{CATEGORY_LABEL[c]}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {items.map((p) => { const on = state.platformIds.includes(p.id); return (
                        <button key={p.id} onClick={() => toggle(p.id)} aria-pressed={on}
                          className={`min-h-11 rounded-full px-4 text-sm font-medium ring-1 transition ${on ? 'bg-lagoon/15 text-ink ring-lagoon/70 shadow-[0_0_18px_-6px_#34E29B]' : 'bg-white/[0.03] text-ink/75 ring-white/10 hover:ring-lagoon/40'}`}>{on ? '✓ ' : ''}{p.name}</button>
                      ); })}
                    </div>
                  </div>
                );
              })}
              <div className="mt-6 flex gap-2">
                <input value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustom()} placeholder="Another app or site" aria-label="Add another app" className="min-h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-night/60 px-5 sm:max-w-xs" />
                <button onClick={addCustom} className="min-h-11 rounded-full px-5 font-semibold ring-1 ring-white/15">Add</button>
              </div>
              {state.custom.length > 0 && <p className="mt-2 text-sm text-ink/60">Added: {state.custom.join(', ')}</p>}
            </div>
            <button onClick={() => setTab('clean')} disabled={!hasApps} className="glow-mango mt-6 min-h-12 rounded-full bg-mango px-7 font-semibold text-night disabled:opacity-40">Next: clean up →</button>
          </section>
        )}

        {/* CLEAN UP */}
        {tab === 'clean' && (
          <section className="mt-6 space-y-4">
            {groups.map((g) => (
              <details key={g.title} open={g.status !== 'Closed'} className="glass group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-3"><span className="text-lg font-semibold">{g.title}</span><span className={`rounded-full px-2 py-0.5 text-[11px] ${badge[g.status]}`}>{g.status}</span></span>
                  <span className="text-sm text-ink/55">{g.n}/{g.items.length}</span>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-lagoon to-mango transition-all" style={{ width: `${g.pct}%` }} /></div>
                </summary>
                <ul className="mt-3 space-y-1">{g.items.map(stepRow)}</ul>
                {g.title !== 'Everywhere else' && <a className="mt-2 inline-block text-sm text-teal underline" href={helpSearchUrl({ name: g.title })} target="_blank" rel="noopener noreferrer">Official help page ↗</a>}
              </details>
            ))}
            <p className="text-xs text-ink/50">Steps checked {CATALOG_VERIFIED}. Apps change their menus; if a step looks different, use the official help page.</p>
          </section>
        )}

        {/* FIND */}
        {tab === 'find' && (
          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="glass p-6">
              <h2 className="text-lg font-semibold">Search your own inbox</h2>
              <p className="mt-1 text-ink/65">Opens a search in your Gmail. We never connect to your email or see results.{state.platformIds.length ? ' Covers the apps you picked.' : ' With no apps picked it looks for all of them, to find ones you forgot.'}</p>
              <a onClick={() => track('gmail-search')} href={gmailSearchUrl(domains)} target="_blank" rel="noopener noreferrer" className="glow-lagoon mt-4 inline-flex min-h-11 items-center rounded-full bg-lagoon px-6 font-semibold text-night">Search my Gmail ↗</a>
              <h3 className="mt-6 font-semibold">Outlook, Yahoo, iCloud or other email</h3>
              <p className="text-sm text-ink/60">Copy this into your email search box:</p>
              <div className="mt-2 flex gap-2">
                <code className="block min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-night/70 p-3 text-sm text-teal">{gmailQuery(domains)}</code>
                <button onClick={() => copy(gmailQuery(domains), 'q')} className="min-h-11 rounded-lg px-4 text-sm font-semibold ring-1 ring-white/15">{copied === 'q' ? 'Copied' : 'Copy'}</button>
              </div>
            </div>
            <div className="glass p-6">
              <h2 className="text-lg font-semibold">Other places to look</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-ink/70">
                <li>Your password manager or saved passwords: search &ldquo;dating&rdquo; or app names.</li>
                <li>App store purchase history: subscriptions you forgot.</li>
                <li>Card statements from the last 3 months.</li>
                <li>Old or second email addresses.</li>
              </ul>
              <button onClick={() => setTab('apps')} className="mt-4 min-h-11 rounded-full px-5 font-semibold ring-1 ring-white/15">Found one? Add it →</button>
            </div>
          </section>
        )}

        {/* SHARE */}
        {tab === 'share' && (
          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="halo-border">
              <div className="h-full rounded-[1.75rem] bg-deep/95 p-6">
                <h2 className="text-lg font-semibold">Share your progress, if you want to</h2>
                <p className="mt-1 text-sm text-ink/60">It never names any app. Edit it any way you like.</p>
                <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-night/70 p-4 font-sans text-sm">{summary}</pre>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => { copy(summary, 's'); track('share-copied'); }} className="glow-lagoon min-h-11 rounded-full bg-lagoon px-5 font-semibold text-night">{copied === 's' ? 'Copied' : 'Copy message'}</button>
                  <button onClick={() => { if (navigator.share) navigator.share({ text: summary }).catch(() => {}); else copy(summary, 's'); }} className="min-h-11 rounded-full px-5 font-semibold ring-1 ring-white/15">Share…</button>
                </div>
              </div>
            </div>
            <div className="glass p-6">
              <h2 className="text-lg font-semibold">Talking about it</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-ink/75">
                <li>Lead with why: &ldquo;I wanted nothing from before to get in our way.&rdquo;</li>
                <li>Offer, don&apos;t demand. Your partner can do their own audit if and when they choose.</li>
                <li>Agree on boundaries together with the <a href="../worksheet/" className="text-teal underline">free worksheet</a>.</li>
                <li>Plan a check-in in a month, each on your own.</li>
                <li>Want a shared space? Try <a href="../couple/" className="text-teal underline">Couple Mode</a>: goals and only what you each choose to share.</li>
              </ul>
              <p className="mt-4 text-sm text-ink/60">If anyone pressures you to prove things, hand over passwords or be tracked, that isn&apos;t trust. Free, confidential help: National Domestic Violence Hotline, 1-800-799-7233, or text START to 88788.</p>
            </div>
          </section>
        )}

        <div className="mt-10 flex justify-end"><button onClick={reset} className="text-sm text-ink/50 underline">Clear my audit from this device</button></div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-night/85 backdrop-blur-xl md:hidden print:hidden" role="tablist" aria-label="Dashboard sections">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => { setTab(t.id); window.scrollTo({ top: 0 }); }}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${tab === t.id ? 'text-lagoon' : 'text-ink/55'}`}>
              <span className={`text-lg leading-none ${tab === t.id ? 'drop-shadow-[0_0_8px_#34E29B]' : ''}`} aria-hidden="true">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Printable report (print only) */}
      <section className="hidden p-8 text-black print:block">
        <h1 className="text-2xl font-bold">My Marriage Mode cleanup report</h1>
        <p className="mt-1 text-sm">Printed {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {s.accountsClosed} of {s.accountsTotal} accounts deleted · {s.doneCount} of {s.total} steps done</p>
        {groups.map((g) => (
          <div key={g.title} className="mt-5"><h2 className="font-bold">{g.title}: {g.status}</h2>
            <ul className="mt-1 text-sm">{g.items.map((st) => <li key={st.id}>{state.done[st.id] ? '☑' : '☐'} {st.label}{state.doneAt?.[st.id] ? ` (${fmt(state.doneAt[st.id])})` : ''}</li>)}</ul>
          </div>
        ))}
        <p className="mt-6 text-xs">Marriage Mode by Upfront Consulting with Tiff &amp; Reco LLC. This report was made on your device and is yours to keep or share.</p>
      </section>
    </div>
  );
}
