'use client';
import { useMemo, useState } from 'react';
import { buildSearches, clean, PHONE_LOGIN_APPS } from '@/lib/websearch';
import type { AuditState } from '@/lib/audit';
import { track } from '@/lib/track';

type Props = { state: AuditState; setState: (f: (s: AuditState) => AuditState) => void; addApps: () => void };

export default function WebSearch({ state, setState, addApps }: Props) {
  const web = state.web ?? { usernames: [], emails: [], results: {} };
  const [u, setU] = useState(''); const [e, setE] = useState(''); const [mine, setMine] = useState(false);
  const searches = useMemo(() => buildSearches(web.usernames, web.emails), [web.usernames, web.emails]);
  const found = searches.filter((x) => web.results[x.id] === 'found').length;
  const checked = searches.filter((x) => web.results[x.id]).length;
  const save = (w: typeof web) => setState((s) => ({ ...s, web: w }));
  const add = (kind: 'usernames' | 'emails', v: string) => {
    const val = kind === 'emails' ? v.trim().toLowerCase() : clean(v); if (!val || !mine) return;
    if (!web[kind].includes(val)) save({ ...web, [kind]: [...web[kind], val].slice(0, 10) });
    kind === 'emails' ? setE('') : setU(''); track('web-search-added');
  };
  const remove = (kind: 'usernames' | 'emails', v: string) => save({ ...web, [kind]: web[kind].filter((x) => x !== v) });
  const mark = (id: string, r: 'found' | 'none') => save({ ...web, results: { ...web.results, [id]: web.results[id] === r ? undefined! : r } });

  return (
    <div className="glass p-6 md:col-span-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mango">Search the web for you</p>
      <h2 className="mt-1 text-lg font-semibold">Find old profiles under your usernames and emails</h2>
      <p className="mt-1 text-sm text-ink/65">Add the usernames and emails you&apos;ve used. We build the searches; they open in your own browser, and nothing is sent to us. Then mark what you found to build your findings.</p>

      <label className="mt-4 flex items-start gap-3 text-sm"><input type="checkbox" checked={mine} onChange={() => setMine(!mine)} className="mt-0.5 size-5 accent-[#D9B77E]" />
        <span>These usernames and emails are <strong>mine</strong>. Marriage Mode is only for your own accounts; searching for someone else isn&apos;t allowed.</span></label>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
        <form onSubmit={(ev) => { ev.preventDefault(); add('usernames', u); }} className="flex gap-2">
          <label htmlFor="ws-u" className="sr-only">Username</label>
          <input id="ws-u" value={u} onChange={(ev) => setU(ev.target.value)} placeholder="A username you used" disabled={!mine} className="min-h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-night/60 px-4 disabled:opacity-50" />
          <button disabled={!mine} className="min-h-11 rounded-full px-4 ring-1 ring-white/15 disabled:opacity-40">Add</button>
        </form>
        <form onSubmit={(ev) => { ev.preventDefault(); add('emails', e); }} className="flex gap-2">
          <label htmlFor="ws-e" className="sr-only">Email</label>
          <input id="ws-e" type="email" value={e} onChange={(ev) => setE(ev.target.value)} placeholder="An email you used" disabled={!mine} className="min-h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-night/60 px-4 disabled:opacity-50" />
          <button disabled={!mine} className="min-h-11 rounded-full px-4 ring-1 ring-white/15 disabled:opacity-40">Add</button>
        </form>
      </div>
      {(web.usernames.length + web.emails.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">{[...web.usernames.map((x) => ['usernames', x] as const), ...web.emails.map((x) => ['emails', x] as const)].map(([k, v]) => (
          <span key={k + v} className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] py-1 pl-3 pr-1 text-sm ring-1 ring-white/10">{v}<button onClick={() => remove(k, v)} aria-label={`Remove ${v}`} className="grid size-7 place-items-center rounded-full hover:bg-white/10">×</button></span>))}</div>
      )}

      {searches.length > 0 && (
        <>
          <ul className="mt-5 space-y-2">{searches.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.07]">
              <a href={x.url} target="_blank" rel="noopener noreferrer" onClick={() => track('web-search-run')} className="min-w-0 flex-1 text-sm text-teal underline [overflow-wrap:anywhere]">{x.label} ↗</a>
              <span className="flex gap-1.5">
                <button onClick={() => mark(x.id, 'found')} aria-pressed={web.results[x.id] === 'found'} className={`min-h-9 rounded-full px-3 text-xs ring-1 ${web.results[x.id] === 'found' ? 'bg-mango/20 text-mango ring-mango/50' : 'ring-white/15'}`}>Found something</button>
                <button onClick={() => mark(x.id, 'none')} aria-pressed={web.results[x.id] === 'none'} className={`min-h-9 rounded-full px-3 text-xs ring-1 ${web.results[x.id] === 'none' ? 'bg-palm/15 text-palm ring-palm/50' : 'ring-white/15'}`}>Nothing</button>
              </span>
            </li>))}</ul>
          <div className="mt-4 rounded-xl bg-night/60 p-4">
            <p className="font-semibold">Your findings</p>
            <p className="mt-1 text-sm text-ink/70">{checked === 0 ? 'Run a search and mark what you see.' : `${checked} of ${searches.length} searches checked · ${found} with something to clean up.`}</p>
            {found > 0 && <p className="mt-2 text-sm">Found an old profile? Add that app above to get its delete steps. <button onClick={addApps} className="text-teal underline">Add an app ↑</button></p>}
            {checked === searches.length && found === 0 && <p className="mt-2 text-sm text-palm">Nothing found under these names. 🎉</p>}
          </div>
        </>
      )}

      <details className="mt-5 rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/[0.07]">
        <summary className="cursor-pointer font-semibold">Used your phone number to sign up?</summary>
        <p className="mt-2 text-sm text-ink/70">Apps like {PHONE_LOGIN_APPS.join(', ')} sign you in with a phone number. Open each app, tap <strong>Log in</strong>, and enter your number. If a code arrives and it opens an account, that account still exists: delete it from Settings. Only you get the code, so this check is private to you. We don&apos;t search phone numbers on the web, because those sites are data brokers.</p>
      </details>
    </div>
  );
}
