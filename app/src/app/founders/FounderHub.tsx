'use client';
import { useCallback, useEffect, useState } from 'react';
import { cloud, cloudEnabled, sendLink, signInGoogle, googleEnabled, amIComped, signOut } from '@/lib/cloud';
import { BASE } from '@/lib/base';
import FounderCounselors from './FounderCounselors';

// Tiffany & Reco's founder hub, live on the Marriage Mode site (not hosted by Claude).
// Founders only: data lives in app.hub_tasks / app.hub_messages behind row-level security.
type Task = { id: string; title: string; why?: string; owner: 'you' | 'claude'; status: string; priority: number; steps?: string[]; doneAt?: string; preview?: { image?: string; alt?: string; meta?: string; text?: string } };
type Msg = { id: string; from: string; text: string; at: string; taskId?: string; handled?: boolean };

function Linked({ text }: { text: string }) {
  return <>{String(text).split(/(https?:\/\/[^\s)]+)/g).map((p, i) => (i % 2 ? <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="break-all text-teal underline">{p}</a> : <span key={i}>{p}</span>))}</>;
}
const PILL: Record<string, string> = { todo: 'To do', doing: 'Working', blocked: 'Needs your yes', done: 'Done' };

export default function FounderHub() {
  const [state, setState] = useState<'loading' | 'signin' | 'denied' | 'ok'>('loading');
  const [email, setEmail] = useState(''); const [sent, setSent] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]); const [msgs, setMsgs] = useState<Msg[]>([]); const [chat, setChat] = useState(''); const [gOn, setGOn] = useState(false);
  useEffect(() => { void googleEnabled().then(setGOn); }, []);

  const load = useCallback(async () => {
    const c = cloud(); if (!c) return;
    const [t, m] = await Promise.all([c.from('hub_tasks').select('id,data'), c.from('hub_messages').select('id,data,created_at').order('created_at').limit(500)]);
    setTasks((t.data ?? []).map((r) => ({ id: r.id, ...(r.data as object) } as Task)));
    setMsgs((m.data ?? []).map((r) => ({ id: r.id, at: r.created_at, ...(r.data as object) } as Msg)).sort((a, b) => String(a.at).localeCompare(String(b.at))));
  }, []);

  useEffect(() => {
    const c = cloud(); if (!c) { setState('signin'); return; }
    const check = async () => {
      const h = new URLSearchParams(window.location.hash.slice(1));
      if (h.get('access_token') && h.get('refresh_token')) { await c.auth.setSession({ access_token: h.get('access_token')!, refresh_token: h.get('refresh_token')! }); history.replaceState(null, '', window.location.pathname); }
      const { data } = await c.auth.getSession(); if (!data.session) { setState('signin'); return; } if (!(await amIComped())) { setState('denied'); return; } setState('ok'); await load(); };
    void check();
    const { data: sub } = c.auth.onAuthStateChange(() => void check());
    return () => sub.subscription.unsubscribe();
  }, [load]);

  useEffect(() => {
    if (state !== 'ok') return; const c = cloud()!;
    const ch = c.channel('hub').on('postgres_changes', { event: '*', schema: 'app', table: 'hub_tasks' }, () => void load()).on('postgres_changes', { event: '*', schema: 'app', table: 'hub_messages' }, () => void load()).subscribe();
    const i = setInterval(load, 30000);
    return () => { void c.removeChannel(ch); clearInterval(i); };
  }, [state, load]);

  const send = async (text: string, task?: Task) => {
    const v = text.trim(); if (!v) return false;
    const { error } = await cloud()!.from('hub_messages').insert({ data: { from: 'you', text: task ? `About “${task.title}”: ${v}` : v, at: new Date().toISOString(), handled: false, ...(task ? { taskId: task.id } : {}) } });
    if (!error) await load(); return !error;
  };
  const markDone = async (t: Task) => { const { id, ...data } = t; await cloud()!.from('hub_tasks').update({ data: { ...data, status: 'done', doneAt: new Date().toISOString() }, updated_at: new Date().toISOString() }).eq('id', id); await send('I did this ✓', t); };

  if (!cloudEnabled) return <p className="p-10 text-center">The hub needs the database connection.</p>;
  if (state === 'loading') return <p className="p-10 text-center text-ink/60">Loading your hub…</p>;
  if (state === 'signin' || state === 'denied') return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-teal">Founders only</p>
      <h1 className="mt-3 text-3xl font-bold">Your Marriage Mode hub</h1>
      {state === 'denied' && <p className="mt-3 text-sm text-coral">This email isn’t on the founders’ list. Sign in with tiffanyh9218@gmail.com or williamrec04@gmail.com.</p>}
      {gOn && <><button type="button" onClick={async () => { if (state === 'denied') await signOut(); const err = await signInGoogle(`${window.location.origin}${BASE}/founders/`); if (err) setSent(`That didn’t work: ${err}`); }} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white font-semibold text-night"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.6 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>Sign in with Google</button>
      <p className="mt-4 text-xs text-ink/50">or get an email link</p></>}
      <form className="mt-2 flex flex-col gap-2" onSubmit={async (e) => { e.preventDefault(); if (state === 'denied') await signOut(); const err = await sendLink(email.trim(), `${window.location.origin}${BASE}/founders/`); setSent(err ? `That didn’t work: ${err}` : 'Check your email and tap the link to open your hub.'); }}>
        <label htmlFor="fh-email" className="sr-only">Email</label>
        <input id="fh-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your founder email" className="min-h-12 rounded-full border border-white/15 bg-night/60 px-5" />
        <button className="glow-mango min-h-12 rounded-full bg-mango font-semibold text-night">Email me a sign-in link</button>
      </form>
      {sent && <p role="status" className="mt-3 text-sm text-ink/75">{sent}</p>}
    </div>
  );

  const open = (o: 'you' | 'claude') => tasks.filter((t) => t.owner === o && t.status !== 'done').sort((a, b) => a.priority - b.priority);
  const you = open('you'); const claude = open('claude'); const reviews = you.filter((t) => t.preview);
  const done = tasks.filter((t) => t.status === 'done').sort((a, b) => String(b.doneAt ?? '').localeCompare(String(a.doneAt ?? '')));
  const general = msgs.filter((m) => !m.taskId).slice(-60);
  const thread = (id: string) => msgs.filter((m) => m.taskId === id).slice(-4);
  const Thread = ({ id }: { id: string }) => <>{thread(id).map((m) => <p key={m.id} className={`mt-1 rounded-xl px-3 py-1.5 text-xs ${m.from === 'you' ? 'bg-mango/10' : 'bg-lagoon/10'}`}><b>{m.from === 'you' ? 'You: ' : 'Claude: '}</b><Linked text={m.text} /></p>)}</>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {process.env.NEXT_PUBLIC_HUB_SITE !== '1' && <a href="https://marriage-mode-hub.web.app/" className="mb-6 block rounded-2xl bg-mango/15 px-4 py-3 text-sm ring-1 ring-mango/40">Your hub now has its own private site: <b>marriage-mode-hub.web.app</b> → open it (same sign-in, same data)</a>}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="font-mono text-[11px] uppercase tracking-[0.25em] text-teal">Your hub · Marriage Mode</p><h1 className="mt-1 text-3xl font-bold">Good to see you</h1><p className="text-sm text-ink/60">Live: updates as Claude works. Claude checks your messages every hour (at :15) and replies here. If Claude is out of usage, the next check after it returns catches up on everything.</p></div>
        <button onClick={() => void signOut()} className="min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15">Sign out</button>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[[you.length, 'for you to do'], [claude.filter((t) => t.status !== 'blocked').length, 'Claude is working on'], [claude.filter((t) => t.status === 'blocked').length, 'waiting on your yes'], [done.length, 'done']].map(([n, l]) => <div key={l as string} className="glass p-4"><b className="text-2xl">{n}</b><p className="text-sm text-ink/60">{l}</p></div>)}
      </div>

      <FounderCounselors />
      {reviews.length > 0 && <section className="glass mt-6 p-5"><h2 className="text-lg font-semibold">📣 Posts to review</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">{reviews.map((t) => (
          <div key={t.id} className="overflow-hidden rounded-2xl ring-1 ring-white/10">
            {t.preview?.image && <img src={t.preview.image} alt={t.preview.alt ?? 'Post picture'} className="w-full" />}
            <div className="p-4"><p className="font-semibold">{t.title}</p><p className="text-xs text-ink/55">{t.preview?.meta}</p><p className="mt-2 max-h-60 overflow-y-auto whitespace-pre-line text-sm"><Linked text={t.preview?.text ?? ''} /></p>
              <button onClick={() => void send('approve', t)} className="glow-mango mt-3 min-h-11 rounded-full bg-mango px-5 text-sm font-semibold text-night">Approve this post</button>
              <Thread id={t.id} /><Reply send={send} t={t} ph="Want a change? Type it here…" /></div>
          </div>))}</div></section>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <div className="space-y-6">
          <section className="glass p-5"><h2 className="text-lg font-semibold">Your to-dos</h2>
            {!you.length && <p className="mt-2 text-sm text-ink/60">Nothing needs you right now. 🎉</p>}
            <ul className="mt-3 space-y-3">{you.map((t, i) => (
              <li key={t.id} className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/[0.07]">
                <details><summary className="cursor-pointer list-none"><span className="text-ink/45">{i + 1}. </span><b>{t.title}</b> <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px]">{PILL[t.status] ?? 'To do'}</span>{t.why && <p className="mt-1 text-sm text-ink/60"><Linked text={t.why} /></p>}<p className="text-[11px] text-mango">Tap for step-by-step help</p></summary>
                  {t.steps && <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{t.steps.map((s, j) => <li key={j}><Linked text={s} /></li>)}</ol>}
                </details>
                <button onClick={() => void markDone(t)} className="mt-2 min-h-11 rounded-full bg-palm/15 px-4 text-sm font-semibold text-palm ring-1 ring-palm/40">I did this</button>
                <Thread id={t.id} /><Reply send={send} t={t} ph="Type here: done, a question, or help…" />
              </li>))}</ul></section>
          <section className="glass p-5"><h2 className="text-lg font-semibold">Claude’s work, in priority order</h2>
            <ul className="mt-3 space-y-2">{claude.map((t) => <li key={t.id} className="rounded-xl bg-white/[0.03] p-3 text-sm ring-1 ring-white/[0.07]"><b>{t.title}</b> <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px]">{PILL[t.status] ?? 'To do'}</span>{t.why && <p className="mt-1 text-ink/60"><Linked text={t.why} /></p>}<Thread id={t.id} /><Reply send={send} t={t} ph="Tell Claude anything about this…" /></li>)}</ul></section>
          <section className="glass p-5"><details><summary className="cursor-pointer text-lg font-semibold">History ({done.length})</summary>
            <ul className="mt-2 space-y-1 text-sm">{done.map((t) => <li key={t.id}><span className="text-ink/50">{t.doneAt ? new Date(t.doneAt).toLocaleDateString() : ''}</span> · {t.title}</li>)}</ul></details></section>
        </div>
        <section className="glass flex flex-col p-5"><h2 className="text-lg font-semibold">Chat with Claude</h2>
          <div className="mt-3 flex max-h-[640px] min-h-64 flex-col gap-2 overflow-y-auto">{general.map((m) => <p key={m.id} className={`max-w-[88%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${m.from === 'you' ? 'self-end bg-mango/15' : 'self-start bg-lagoon/10'}`}><b className="block text-[11px] text-ink/50">{m.from === 'you' ? 'You' : 'Claude'}{m.from === 'you' && m.handled ? ' · read ✓' : ''}</b><Linked text={m.text} /></p>)}</div>
          <form onSubmit={async (e) => { e.preventDefault(); if (await send(chat)) setChat(''); }} className="mt-3 flex gap-2">
            <label htmlFor="fh-chat" className="sr-only">Message Claude</label>
            <input id="fh-chat" value={chat} onChange={(e) => setChat(e.target.value)} placeholder="Ask a question or ask for something to be done…" className="min-h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-night/60 px-4" />
            <button className="glow-mango min-h-11 rounded-full bg-mango px-5 font-semibold text-night">Send</button>
          </form></section>
      </div>
    </div>
  );
}

// Defined outside the hub so live refreshes never reset what's being typed.
function Reply({ t, ph, send }: { t: Task; ph: string; send: (text: string, task?: Task) => Promise<boolean> }) {
  const [v, setV] = useState('');
  return (
    <form onSubmit={async (e) => { e.preventDefault(); if (await send(v, t)) setV(''); }} className="mt-2 flex gap-2">
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder={ph} aria-label={`Reply about ${t.title}`} className="min-h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-night/60 px-4 text-sm" />
      <button className="min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15">Send</button>
    </form>);
}
