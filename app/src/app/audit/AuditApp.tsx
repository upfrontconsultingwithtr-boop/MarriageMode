'use client';
import { useEffect, useMemo, useState } from 'react';
import { PLATFORMS, CATEGORY_LABEL, BILLING_LINKS, helpSearchUrl, CATALOG_VERIFIED, type Category } from '@/lib/catalog';
import { buildSteps, score, emailDomainsFor, gmailQuery, gmailSearchUrl, shareSummary, EMPTY_STATE, type AuditState, type Step } from '@/lib/audit';

const KEY = 'marriage-mode:audit:v1';
const TABS = ['Your apps', 'Checklist', 'Email check', 'Talk & share'] as const;

function load(): AuditState {
  try { const raw = localStorage.getItem(KEY); return raw ? { ...EMPTY_STATE, ...JSON.parse(raw) } : EMPTY_STATE; }
  catch { return EMPTY_STATE; }
}
function save(s: AuditState) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: keep in memory */ } }

function Ring({ value, label }: { value: number; label: string }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-3">
      <svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label={`${label}: ${value} out of 100`}>
        <circle cx="42" cy="42" r={r} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="9" />
        <circle cx="42" cy="42" r={r} fill="none" stroke={value === 100 ? '#2BB673' : '#2CC5BD'} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform="rotate(-90 42 42)" style={{ transition: 'stroke-dashoffset .4s' }} />
        <text x="42" y="48" textAnchor="middle" fontSize="20" fontWeight="800" fill="currentColor">{value}</text>
      </svg>
      <span className="text-sm font-semibold leading-tight">{label}</span>
    </div>
  );
}

export default function AuditApp() {
  const [state, setState] = useState<AuditState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState('');
  const [custom, setCustom] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => { setState(load()); setReady(true); }, []);
  useEffect(() => { if (ready) save(state); }, [state, ready]);

  const steps = useMemo(() => buildSteps(state), [state.platformIds, state.custom]); // eslint-disable-line react-hooks/exhaustive-deps
  const s = useMemo(() => score(steps, state.done), [steps, state.done]);
  const domains = useMemo(() => emailDomainsFor(state.platformIds), [state.platformIds]);

  const toggle = (id: string) => setState((st) => ({ ...st, platformIds: st.platformIds.includes(id) ? st.platformIds.filter((x) => x !== id) : [...st.platformIds, id], startedAt: st.startedAt ?? new Date().toISOString() }));
  const tick = (id: string) => setState((st) => ({ ...st, done: { ...st.done, [id]: !st.done[id] } }));
  const addCustom = () => { const n = custom.trim(); if (n && !state.custom.includes(n)) setState((st) => ({ ...st, custom: [...st.custom, n] })); setCustom(''); };
  const copy = async (text: string, what: string) => { try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(''), 2000); } catch { /* ignore */ } };
  const reset = () => { if (confirm('Clear your audit from this device?')) setState(EMPTY_STATE); };

  const cats = Object.keys(CATEGORY_LABEL) as Category[];
  const filtered = PLATFORMS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  const groups: { title: string; items: Step[] }[] = [];
  for (const st of steps) {
    const title = st.group ?? 'Everywhere else';
    const g = groups.find((x) => x.title === title); if (g) g.items.push(st); else groups.push({ title, items: [st] });
  }
  const summary = shareSummary(s);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-5 ring-1 ring-ink/5">
        <div>
          <h1 className="text-2xl font-extrabold">Your private audit</h1>
          <p className="text-sm text-ink/70">Saved only on this device. {s.doneCount} of {s.total} steps done.</p>
        </div>
        <div className="flex flex-wrap gap-6 text-ink">
          <Ring value={s.progress} label={'Cleanup\nprogress'} />
          <Ring value={s.organization} label="Digital organization score" />
        </div>
      </div>

      <div role="tablist" className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t, i) => (
          <button key={t} role="tab" aria-selected={tab === i} onClick={() => setTab(i)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${tab === i ? 'bg-ocean text-white' : 'bg-white text-ink ring-1 ring-ink/10'}`}>
            {i + 1}. {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <section className="mt-6">
          <p className="text-ink/80">Tick every dating app or site you have <em>ever</em> used, even once. Not sure? Use the email check (step 3) to find out.</p>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search apps…" aria-label="Search apps"
            className="mt-4 w-full rounded-full border border-ink/20 bg-white px-5 py-3 sm:w-80" />
          {cats.map((c) => {
            const items = filtered.filter((p) => p.category === c);
            if (!items.length) return null;
            return (
              <div key={c} className="mt-6">
                <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-teal">{CATEGORY_LABEL[c]}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {items.map((p) => {
                    const on = state.platformIds.includes(p.id);
                    return (
                      <button key={p.id} onClick={() => toggle(p.id)} aria-pressed={on}
                        className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ${on ? 'bg-lagoon/20 ring-teal text-ink' : 'bg-white ring-ink/15'}`}>
                        {on ? '✓ ' : ''}{p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="mt-6 flex gap-2">
            <input value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustom()}
              placeholder="Another app or site" aria-label="Add another app" className="min-w-0 flex-1 rounded-full border border-ink/20 bg-white px-5 py-2.5 sm:max-w-xs" />
            <button onClick={addCustom} className="rounded-full bg-white px-5 py-2.5 font-semibold ring-1 ring-ink/20">Add</button>
          </div>
          {state.custom.length > 0 && <p className="mt-2 text-sm text-ink/70">Added: {state.custom.join(', ')}</p>}
          <button onClick={() => setTab(1)} className="mt-8 rounded-full bg-mango px-6 py-3 font-semibold text-ink">Next: my checklist →</button>
        </section>
      )}

      {tab === 1 && (
        <section className="mt-6 space-y-5">
          {state.platformIds.length + state.custom.length === 0 && (
            <p className="rounded-xl bg-mango/20 p-4">Pick your apps in step 1 to get a checklist for each one. The general steps below apply to everyone.</p>
          )}
          {groups.map((g) => {
            const p = PLATFORMS.find((x) => x.name === g.title);
            return (
              <div key={g.title} className="rounded-2xl bg-white p-5 ring-1 ring-ink/5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-bold">{g.title}</h2>
                  {g.title !== 'Everywhere else' && (
                    <a className="text-sm text-teal underline" href={helpSearchUrl({ name: g.title })} target="_blank" rel="noopener noreferrer">Find the official help page ↗</a>
                  )}
                </div>
                <ul className="mt-3 space-y-3">
                  {g.items.map((st) => (
                    <li key={st.id}>
                      <label className="flex cursor-pointer gap-3">
                        <input type="checkbox" checked={!!state.done[st.id]} onChange={() => tick(st.id)} className="mt-1 size-5 accent-[#0A7F7E]" />
                        <span>
                          <span className={`font-medium ${state.done[st.id] ? 'text-ink/50 line-through' : ''}`}>{st.label}</span>
                          {st.detail && <span className="block text-sm text-ink/70">{st.detail}</span>}
                          {st.kind === 'cancel_billing' && (
                            <span className="mt-1 flex flex-wrap gap-3 text-sm">
                              {(p ? p.billing : (['apple', 'google', 'web'] as const)).map((b) => BILLING_LINKS[b].url
                                ? <a key={b} href={BILLING_LINKS[b].url} target="_blank" rel="noopener noreferrer" className="text-teal underline" title={BILLING_LINKS[b].how}>{BILLING_LINKS[b].label} ↗</a>
                                : <span key={b} className="text-ink/60">{BILLING_LINKS[b].how}</span>)}
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <p className="text-xs text-ink/60">Steps checked {CATALOG_VERIFIED}. Apps change their menus; if a step looks different, use the official help link.</p>
        </section>
      )}

      {tab === 2 && (
        <section className="mt-6 space-y-5">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-ink/5">
            <h2 className="text-lg font-bold">Search your own inbox for dating emails</h2>
            <p className="mt-1 text-ink/75">
              This opens Gmail in a new tab and runs a search there. Marriage Mode never connects to your email or sees the results.
              {state.platformIds.length ? ' The search covers the apps you picked.' : ' Pick no apps and it searches for all of them, which helps you find accounts you forgot.'}
            </p>
            <a href={gmailSearchUrl(domains)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block rounded-full bg-ocean px-6 py-3 font-semibold text-white">Search my Gmail ↗</a>
            <h3 className="mt-6 font-semibold">Outlook, Yahoo, iCloud or other email</h3>
            <p className="text-sm text-ink/70">Copy this into your email search box:</p>
            <div className="mt-2 flex gap-2">
              <code className="block min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-mist p-3 text-sm">{gmailQuery(domains)}</code>
              <button onClick={() => copy(gmailQuery(domains), 'q')} className="rounded-lg bg-white px-4 text-sm font-semibold ring-1 ring-ink/20">{copied === 'q' ? 'Copied' : 'Copy'}</button>
            </div>
            <p className="mt-2 text-xs text-ink/60">Some email apps don&apos;t understand &ldquo;OR&rdquo;. If so, search for one name at a time.</p>
          </div>
          <div className="rounded-2xl bg-white p-6 ring-1 ring-ink/5">
            <h3 className="font-semibold">Found an app you forgot?</h3>
            <p className="text-ink/75">Go back to step 1 and tick it. Its steps appear in your checklist.</p>
            <button onClick={() => setTab(0)} className="mt-3 rounded-full bg-white px-5 py-2.5 font-semibold ring-1 ring-ink/20">← Back to my apps</button>
          </div>
        </section>
      )}

      {tab === 3 && (
        <section className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-ink/5">
            <h2 className="text-lg font-bold">Share your progress, if you want to</h2>
            <p className="mt-1 text-sm text-ink/70">It never names any app. Edit it any way you like before sending.</p>
            <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-mist p-4 font-sans text-sm">{summary}</pre>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => copy(summary, 's')} className="rounded-full bg-ocean px-5 py-2.5 font-semibold text-white">{copied === 's' ? 'Copied' : 'Copy message'}</button>
              <button onClick={() => { if (navigator.share) navigator.share({ text: summary }).catch(() => {}); else copy(summary, 's'); }}
                className="rounded-full bg-white px-5 py-2.5 font-semibold ring-1 ring-ink/20">Share…</button>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 ring-1 ring-ink/5">
            <h2 className="text-lg font-bold">Talking about it</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-ink/80">
              <li>Lead with why: &ldquo;I wanted nothing from before to get in our way.&rdquo;</li>
              <li>Offer, don&apos;t demand. Your partner can do their own audit if and when they choose.</li>
              <li>Agree on boundaries together: what counts as fine, and what doesn&apos;t, for follows, DMs and old friends.</li>
              <li>Plan a check-in. Agree to look again in a month, each on your own.</li>
            </ul>
            <p className="mt-4 text-sm text-ink/70">If anyone is pressuring you to prove things, take their passwords, or track your phone, that isn&apos;t trust. Help is free and confidential: National Domestic Violence Hotline, 1-800-799-7233, or text START to 88788.</p>
          </div>
        </section>
      )}

      <div className="mt-10 flex justify-end">
        <button onClick={reset} className="text-sm text-ink/60 underline">Clear my audit from this device</button>
      </div>
    </div>
  );
}
