'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from 'react';
import { cloud, signInGoogleFirebase, signOut, sendLink } from '@/lib/cloud';
import * as P from '@/lib/portal';
import { load, LANG_KEY, type AdvState } from '@/lib/adv/store';
import { reply } from '@/lib/adv/mia';
import { crisis, CRISIS_EN, CRISIS_ES, MODELS, MODELS_F32, hasF16, pickModel, canRunAI, systemPrompt } from '@/lib/coach';
import { BASE } from '@/lib/base';

type T = (en: string, es: string) => string;
const card = 'rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 ring-1 ring-white/10 shadow-[inset_0_1px_0_rgb(255_255_255/.08)] backdrop-blur-xl sm:p-6';
const btn = 'btn-press inline-flex min-h-11 items-center justify-center rounded-full px-5 text-[15px] transition disabled:opacity-40';
const primary = `${btn} bg-mango font-semibold text-night shadow-[0_10px_40px_-10px_rgb(232_164_169/.7)] hover:brightness-110`;
const ghost = `${btn} ring-1 ring-white/20 hover:bg-white/5`;
const input = 'min-h-12 w-full rounded-2xl bg-night/60 px-4 ring-1 ring-white/15 focus:ring-mango';
const TOOLS = '../advanced/app/';

export default function PortalApp({ page = 'dashboard' }: { page?: 'login' | 'dashboard' }) {
  const [es, setEs] = useState(false); const t: T = (en, sp) => (es ? sp : en);
  const [uid, setUid] = useState<string | null>(null); const [email, setEmail] = useState(''); const [level, setLevel] = useState<P.Level | 0>(0); const [ready, setReady] = useState(false); const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    let l: string | null = null; try { l = localStorage.getItem(LANG_KEY); } catch { /* blocked */ } setEs((l ?? navigator.language).startsWith('es'));
    const c = cloud(); if (!c) { setReady(true); return; }
    const onSession = async (s: any) => { if (!s) { setUid(null); setLevel(0); setReady(true); return; } setUid(s.user.id); setEmail(s.user.email ?? ''); try { setLevel(await P.join()); } catch { setLevel(1); } setReady(true); };
    c.auth.getSession().then(({ data }) => onSession(data.session));
    const { data: sub } = c.auth.onAuthStateChange((ev, s) => { if (ev === 'PASSWORD_RECOVERY') setRecovery(true); void onSession(s); });
    return () => sub.subscription.unsubscribe();
  }, []);
  const pick = (v: boolean) => { setEs(v); try { localStorage.setItem(LANG_KEY, v ? 'es' : 'en'); } catch { /* ignore */ } };
  return (
    <div className="relative isolate mx-auto max-w-6xl overflow-x-clip px-4 pb-24 pt-4">
      <div className="adv-aurora !h-[460px] opacity-60" aria-hidden="true"><span /><span /><span /></div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-ink/60">{uid && <><span className="rounded-full bg-lagoon/15 px-3 py-1 text-lagoon">{level ? P.LEVELS[level as P.Level][es ? 'es' : 'en'] : '…'}</span><span className="hidden sm:inline">{email}</span></>}</div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Language / Idioma" className="adv-glass flex rounded-full p-1">{[false, true].map((v) => <button key={String(v)} onClick={() => pick(v)} aria-pressed={es === v} className={`min-h-10 min-w-12 rounded-full px-3 text-sm ${es === v ? 'bg-mango font-semibold text-night' : 'text-ink/70'}`}>{v ? 'ES' : 'EN'}</button>)}</div>
          {uid && <button onClick={() => void signOut()} className={ghost}>{t('Sign out', 'Salir')}</button>}
        </div>
      </div>
      {!ready ? <div className="min-h-[50vh]" /> : recovery ? <NewPassword t={t} done={() => { setRecovery(false); location.replace('../portal/'); }} />
        : page === 'login' ? (uid ? <Redirect to="../portal/" /> : <SignIn t={t} />)
        : !uid ? <Redirect to="../login/" /> : <Home t={t} es={es} uid={uid} level={level as P.Level} />}
    </div>
  );
}

function Redirect({ to }: { to: string }) {
  useEffect(() => { location.replace(to); }, [to]);
  return <div className="min-h-[50vh]" />;
}

function SignIn({ t }: { t: T }) {
  const [mode, setMode] = useState<'in' | 'up' | 'reset' | 'link'>('in'); const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const here = typeof location !== 'undefined' ? location.origin + location.pathname : '';
  const go = async () => {
    setBusy(true); setMsg('');
    const r = mode === 'in' ? await P.signInPassword(email, pw) : mode === 'up' ? await P.signUpPassword(email, pw, here) : mode === 'reset' ? await P.resetPassword(email, here) : await sendLink(email, here);
    setBusy(false);
    if (r === 'check-email' || (!r && mode !== 'in')) setMsg(t('Check your email for the link to finish.', 'Revisa tu correo para terminar con el enlace.'));
    else if (r) setMsg(/invalid/i.test(r) ? t('That email and password don’t match.', 'Ese correo y contraseña no coinciden.') : r);
  };
  return (
    <div className="mx-auto grid max-w-5xl items-center gap-10 py-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="text-center lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-mango">Marriage Mode</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{t('Your private dashboard', 'Tu panel privado')}</h1>
        <p className="mt-4 text-lg text-ink/70">{t('Results, important items and updates in one calm place, plus help any time you need it.', 'Resultados, pendientes importantes y avisos en un solo lugar tranquilo, con ayuda cuando la necesites.')}</p>
        <ul className="mt-6 space-y-2 text-ink/65">{[t('Your cleanup tools stay on your device', 'Tus herramientas se quedan en tu dispositivo'), t('You choose what your team can see', 'Tú eliges qué puede ver tu equipo'), t('Private AI that runs on your device', 'IA privada que corre en tu dispositivo')].map((x) => <li key={x} className="flex gap-2"><span className="text-palm">✓</span>{x}</li>)}</ul>
      </div>
      <form className={`${card} adv-edge`} onSubmit={(e) => { e.preventDefault(); void go(); }}>
        <h2 className="font-display text-2xl font-semibold">{{ in: t('Sign in', 'Iniciar sesión'), up: t('Create your account', 'Crea tu cuenta'), reset: t('Reset your password', 'Restablece tu contraseña'), link: t('Email me a sign-in link', 'Envíame un enlace') }[mode]}</h2>
        <label className="mt-4 block text-sm text-ink/70" htmlFor="em">{t('Email', 'Correo')}</label>
        <input id="em" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${input} mt-1`} />
        {(mode === 'in' || mode === 'up') && <><label className="mt-3 block text-sm text-ink/70" htmlFor="pw">{t('Password', 'Contraseña')}</label>
          <input id="pw" type="password" autoComplete={mode === 'up' ? 'new-password' : 'current-password'} minLength={mode === 'up' ? 10 : 1} required value={pw} onChange={(e) => setPw(e.target.value)} className={`${input} mt-1`} />
          {mode === 'up' && <p className="mt-1 text-xs text-ink/50">{t('At least 10 characters.', 'Al menos 10 caracteres.')}</p>}</>}
        <button type="submit" disabled={busy} className={`${primary} mt-5 w-full`}>{busy ? '…' : { in: t('Sign in', 'Entrar'), up: t('Create account', 'Crear cuenta'), reset: t('Send reset link', 'Enviar enlace'), link: t('Send link', 'Enviar enlace') }[mode]}</button>
        <button type="button" onClick={async () => { setMsg(''); const r = await signInGoogleFirebase(); if (r) setMsg(r); }} className={`${ghost} mt-3 w-full gap-2`}><svg viewBox="0 0 24 24" className="size-5" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.8-5.4 3.8-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.8 2.4 2.6 6.6 2.6 11.9S6.8 21.4 12 21.4c6.9 0 9.2-4.8 9.2-7.3 0-.5 0-.9-.1-1.3H12z" /></svg>{t('Continue with Google', 'Continuar con Google')}</button>
        {msg && <p role="status" className="mt-3 text-sm text-lagoon">{msg}</p>}
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-ink/60">
          {mode !== 'in' && <button type="button" className="min-h-11 underline underline-offset-4" onClick={() => setMode('in')}>{t('Sign in', 'Iniciar sesión')}</button>}
          {mode !== 'up' && <button type="button" className="min-h-11 underline underline-offset-4" onClick={() => setMode('up')}>{t('Create account', 'Crear cuenta')}</button>}
          {mode !== 'reset' && <button type="button" className="min-h-11 underline underline-offset-4" onClick={() => setMode('reset')}>{t('Forgot password?', '¿Olvidaste tu contraseña?')}</button>}
          {mode !== 'link' && <button type="button" className="min-h-11 underline underline-offset-4" onClick={() => setMode('link')}>{t('Email me a link instead', 'Mejor un enlace por correo')}</button>}
        </div>
      </form>
    </div>
  );
}
function NewPassword({ t, done }: { t: T; done: () => void }) {
  const [pw, setPw] = useState(''); const [msg, setMsg] = useState('');
  return <form className={`${card} mx-auto max-w-md`} onSubmit={async (e) => { e.preventDefault(); const r = await P.setNewPassword(pw); if (r) setMsg(r); else done(); }}>
    <h2 className="font-display text-2xl font-semibold">{t('Choose a new password', 'Elige una contraseña nueva')}</h2>
    <input type="password" minLength={10} required autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className={`${input} mt-4`} aria-label={t('New password', 'Contraseña nueva')} />
    <button className={`${primary} mt-4 w-full`}>{t('Save', 'Guardar')}</button>{msg && <p className="mt-2 text-sm text-coral">{msg}</p>}</form>;
}

function Home({ t, es, uid, level }: { t: T; es: boolean; uid: string; level: P.Level }) {
  const tabs = [['dash', t('My dashboard', 'Mi panel')], ...(level >= 2 ? [['team', t('Customers', 'Clientes')]] : []), ...(level === 4 ? [['access', t('Access', 'Accesos')]] : [])] as [string, string][];
  const [tab, setTab] = useState('dash');
  return (<>
    {tabs.length > 1 && <nav className="mb-6 flex gap-1 overflow-x-auto" aria-label={t('Sections', 'Secciones')}>{tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} aria-current={tab === k ? 'page' : undefined} className={`min-h-11 shrink-0 rounded-full px-4 text-sm ${tab === k ? 'bg-mango/15 text-mango ring-1 ring-mango/40' : 'text-ink/70 hover:text-ink'}`}>{l}</button>)}</nav>}
    {tab === 'dash' && <Dashboard t={t} es={es} uid={uid} />}{tab === 'team' && <Team t={t} es={es} uid={uid} level={level} />}{tab === 'access' && <Access t={t} es={es} uid={uid} />}
  </>);
}

// ---------- Customer dashboard: results, important items, updates, AI help ----------
function Dashboard({ t, es, uid }: { t: T; es: boolean; uid: string }) {
  const [s, setS] = useState<AdvState | null>(null); const [ups, setUps] = useState<P.Update[]>([]); const [shared, setShared] = useState<string | null>(null);
  const [pair, setPair] = useState<{ partner_emails: string[]; auto_share: boolean } | null>(null); const [pd, setPd] = useState<Awaited<ReturnType<typeof P.partnerDashboard>>>(null);
  useEffect(() => {
    const st = load(); setS(st); void P.updates().then((u) => setUps(u.filter((x) => x.customer_id === uid)));
    void (async () => {
      const info = await P.partnerInfo(); setPair(info);
      if (info?.auto_share && st.intake) { if (await P.syncMine(uid, st)) setShared(new Date().toISOString()); }
      else { const d = await P.dashboards(); setShared(d.find((x) => x.customer_id === uid)?.updated_at ?? null); }
      if (info) setPd(await P.partnerDashboard(info.partner_emails));
    })();
  }, [uid]);
  const sum = useMemo(() => (s ? P.summarize(s) : null), [s]);
  if (!s || !sum) return <div className="min-h-[40vh]" />;
  const r = sum.results; const started = !!s.intake;
  return (
    <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
      <div className="grid content-start gap-5">
        <section className={`${card} adv-edge`} aria-labelledby="res">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="res" className="font-display text-2xl font-semibold">{t('Results', 'Resultados')}</h2><a href={TOOLS} className={ghost}>{t('Open my tools', 'Abrir mis herramientas')} →</a></div>
          {!started ? <p className="mt-3 text-ink/70">{t('You haven’t started yet. Open your tools to take the 1-minute intake.', 'Aún no empiezas. Abre tus herramientas para el registro de 1 minuto.')}</p> : (
            <div className="mt-4 grid items-center gap-5 sm:grid-cols-[auto_1fr]">
              <div className="adv-ring mx-auto grid size-32 place-items-center" style={{ ['--p' as string]: r.score } as React.CSSProperties}><div className="grid size-[112px] place-items-center rounded-full bg-night"><span className="font-display text-4xl font-semibold">{r.score}</span><span className="-mt-2 text-[11px] text-ink/50">{t('score', 'puntos')}</span></div></div>
              <dl className="grid grid-cols-2 gap-3 text-sm">{[[t('Accounts closed', 'Cuentas cerradas'), `${r.closed.length}/${r.total}`], [t('In progress', 'En progreso'), r.inProgress], [t('Flags found', 'Marcas encontradas'), r.flags], [t('Removals done', 'Quitados'), r.queueDone], [t('Lessons', 'Lecciones'), `${r.lessons}/6`], [t('Next re-check', 'Próxima revisión'), r.recheck]].map(([k, v]) => <div key={k as string} className="rounded-2xl bg-white/[0.04] p-3"><dt className="text-ink/55">{k}</dt><dd className="mt-0.5 font-display text-xl">{v}</dd></div>)}</dl>
            </div>)}
          {r.closed.length > 0 && <p className="mt-4 text-sm text-ink/65">{t('Verified closed', 'Cerradas y verificadas')}: {r.closed.map((c) => `${c.name} (${c.at})`).join(' · ')}</p>}
        </section>
        <section className={card} aria-labelledby="imp">
          <h2 id="imp" className="font-display text-2xl font-semibold">{t('Important items', 'Pendientes importantes')}</h2>
          {sum.items.length ? <ul className="mt-3 space-y-2">{sum.items.map((i) => <li key={i.id}><a href={`${TOOLS}#${i.tab ?? 'start'}`} className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/[0.06] hover:ring-mango/40"><span className="flex items-center gap-2">{i.urgent && <span className="size-2 shrink-0 rounded-full bg-coral" aria-label={t('urgent', 'urgente')} />}{es ? i.es : i.en}</span><span aria-hidden="true" className="text-mango">→</span></a></li>)}</ul> : <p className="mt-3 text-ink/65">{t('Nothing needs you right now.', 'Nada te necesita por ahora.')} ✓</p>}
        </section>
        <section className={card} aria-labelledby="upd">
          <h2 id="upd" className="font-display text-2xl font-semibold">{t('Updates', 'Avisos')}</h2>
          {ups.length ? <ul className="mt-3 space-y-3">{ups.map((u) => <li key={u.id} className={`rounded-2xl p-4 ring-1 ${u.urgent ? 'bg-coral/10 ring-coral/40' : 'bg-white/[0.04] ring-white/[0.06]'}`}><p className="text-xs text-ink/50">{new Date(u.created_at).toLocaleString(es ? 'es-US' : 'en-US')}{u.urgent ? ` · ${t('Important', 'Importante')}` : ''}</p><p className="mt-1 font-semibold">{u.title}</p>{u.body && <p className="mt-1 whitespace-pre-wrap text-sm text-ink/75">{u.body}</p>}</li>)}</ul> : <p className="mt-3 text-ink/65">{t('No updates from your team yet.', 'Aún no hay avisos de tu equipo.')}</p>}
        </section>
        {pair && <section className={`${card} adv-edge`} aria-labelledby="pr">
          <h2 id="pr" className="font-display text-2xl font-semibold">{t('My partner’s results', 'Resultados de mi pareja')}</h2>
          {!pd ? <p className="mt-2 text-ink/65">{t('Your partner hasn’t signed in yet. Their results show here as soon as they do.', 'Tu pareja aún no inicia sesión. Sus resultados aparecen aquí en cuanto lo haga.')}</p>
            : !pd.results ? <p className="mt-2 text-ink/65">{(pd.member.display_name || pd.member.email)} {t('has signed in but hasn’t started the intake yet.', 'ya inició sesión pero aún no empieza el registro.')}</p>
            : <><p className="mt-1 text-sm text-ink/55">{pd.member.display_name || pd.member.email} · {t('updated', 'actualizado')} {new Date(pd.updated_at).toLocaleString(es ? 'es-US' : 'en-US')}</p>
              <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">{[[t('Score', 'Puntos'), pd.results.score], [t('Closed', 'Cerradas'), `${pd.results.closed.length}/${pd.results.total}`], [t('Removals', 'Quitados'), pd.results.queueDone]].map(([k, v]) => <div key={k as string} className="rounded-2xl bg-white/[0.04] p-3"><dt className="text-ink/55">{k}</dt><dd className="mt-0.5 font-display text-xl">{v}</dd></div>)}</dl>
              {pd.results.closed.length > 0 && <p className="mt-3 text-sm text-ink/65">{t('Verified closed', 'Cerradas y verificadas')}: {pd.results.closed.map((c) => `${c.name} (${c.at})`).join(' · ')}</p>}</>}
        </section>}
        <section className={card} aria-labelledby="share">
          <h2 id="share" className="font-display text-xl font-semibold">{t('Share with my Marriage Mode team', 'Compartir con mi equipo de Marriage Mode')}</h2>
          {pair?.auto_share && <p className="mt-1 rounded-2xl bg-lagoon/10 p-3 text-sm text-lagoon ring-1 ring-lagoon/30">{t('Founder account: your results are shared with your partner automatically each time you open this dashboard, as the disclaimer says.', 'Cuenta de fundador: tus resultados se comparten con tu pareja automáticamente cada vez que abres este panel, como dice el aviso.')}</p>}
          <p className="mt-1 text-sm text-ink/65">{t('Off unless you turn it on. Sends only the numbers and to-dos above (never your exports, names you reviewed, or messages) so your coach can help. Your Company Admin and any coach assigned to you can see it.', 'Apagado salvo que lo actives. Envía solo los números y pendientes de arriba (nunca tus exportaciones, nombres ni mensajes) para que tu coach te ayude. Tu Administrador y el coach asignado pueden verlo.')}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button className={primary} onClick={async () => { if (await P.syncMine(uid, s)) setShared(new Date().toISOString()); }}>{shared ? t('Update what my team sees', 'Actualizar lo que ve mi equipo') : t('Share my results', 'Compartir mis resultados')}</button>
            {shared && <button className={ghost} onClick={async () => { if (await P.unsyncMine(uid)) setShared(null); }}>{t('Stop sharing and remove', 'Dejar de compartir y borrar')}</button>}
            <span className="text-xs text-ink/50">{shared ? `${t('Last shared', 'Compartido')}: ${new Date(shared).toLocaleString(es ? 'es-US' : 'en-US')}` : t('Not shared', 'No compartido')}</span>
          </div>
        </section>
      </div>
      <AiHelp t={t} es={es} s={s} />
    </div>
  );
}

// ---------- AI in times of need: private on-device AI, built-in helper fallback, crisis first ----------
function AiHelp({ t, es, s }: { t: T; es: boolean; s: AdvState }) {
  type Msg = { role: 'user' | 'assistant'; content: string };
  const [msgs, setMsgs] = useState<Msg[]>([]); const [text, setText] = useState(''); const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState<'none' | 'loading' | 'on' | 'unsupported'>('none'); const [pct, setPct] = useState(0); const engine = useRef<any>(null); const end = useRef<HTMLDivElement>(null);
  useEffect(() => { void canRunAI().then((ok) => { if (!ok) setAi('unsupported'); }); }, []);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs.length, busy]);
  const ctx = () => { const r = P.summarize(s).results; return `\nWhat you know about this person's progress (from their own device): score ${r.score}/100, ${r.closed.length} of ${r.total} dating accounts verified closed${r.closed.length ? ` (${r.closed.map((c) => c.name).join(', ')})` : ''}, ${r.inProgress} in progress, ${r.flags} items flagged (${r.risque} risque), ${r.queueDone} removals done, ${r.queueLeft} waiting, ${r.lessons} of 6 lessons read, next re-check ${r.recheck}. Support choice: ${s.intake?.support ?? 'unknown'}. Refer to this progress specifically and end with one concrete next step.`; };
  const model = async () => { const f16 = await hasF16(); const k = pickModel() === 'smart' ? 'full' : pickModel(); return (f16 ? MODELS : MODELS_F32)[k]; };
  const turnOn = async () => {
    setAi('loading');
    try { const webllm = await import('@mlc-ai/web-llm'); const m = await model(); engine.current = await webllm.CreateMLCEngine(m.id, { initProgressCallback: (r: { progress: number }) => setPct(Math.round(r.progress * 100)) }); setAi('on'); }
    catch { setAi('unsupported'); }
  };
  const send = async (q: string) => {
    if (!q.trim() || busy) return; const next: Msg[] = [...msgs, { role: 'user', content: q }]; setMsgs(next); setText('');
    if (crisis(q)) { setMsgs([...next, { role: 'assistant', content: es ? CRISIS_ES : CRISIS_EN }]); return; }
    if (ai !== 'on') { setMsgs([...next, { role: 'assistant', content: reply(q, { s, es }) }]); return; }
    setBusy(true); let out = '';
    try {
      const stream = await engine.current.chat.completions.create({ stream: true, temperature: 0.6, max_tokens: 380, messages: [{ role: 'system', content: systemPrompt(es) + ctx() }, ...next.slice(-8)] });
      setMsgs([...next, { role: 'assistant', content: '' }]);
      for await (const ch of stream) { out += ch.choices[0]?.delta?.content ?? ''; setMsgs([...next, { role: 'assistant', content: out }]); }
    } catch { setMsgs([...next, { role: 'assistant', content: reply(q, { s, es }) }]); }
    setBusy(false);
  };
  return (
    <aside className={`${card} adv-edge flex min-h-[70vh] flex-col lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)]`} aria-labelledby="aih">
      <div className="flex items-center gap-3"><img src={`${BASE}/coach/mia-poster.jpg`} alt="" className="size-12 rounded-2xl object-cover ring-1 ring-mango/30" /><div><h2 id="aih" className="font-display text-xl font-semibold">{t('Talk to Mia, your AI', 'Habla con Mia, tu IA')}</h2><p className="text-xs text-ink/55">{ai === 'on' ? t('Private AI on this device', 'IA privada en este dispositivo') : t('Built-in helper', 'Asistente integrado')}</p></div></div>
      <div className="mt-3 rounded-2xl bg-coral/10 p-3 text-sm ring-1 ring-coral/40" role="note"><strong>{t('In danger or crisis?', '¿En peligro o crisis?')}</strong> {t('Call 911 · call or text 988 · Domestic Violence Hotline 1-800-799-7233 (text START to 88788).', 'Llama al 911 · llama o envía un mensaje al 988 · Línea de Violencia Doméstica 1-800-799-7233 (envía START al 88788).')}</div>
      {ai === 'none' && <div className="mt-3 rounded-2xl bg-white/[0.04] p-3 text-sm"><p>{t('Turn on Mia’s private AI for deeper conversations. It downloads once and runs only on this device: free, and your words never leave it.', 'Activa la IA privada de Mia para conversaciones más profundas. Se descarga una vez y corre solo en este dispositivo: gratis, y tus palabras nunca salen de aquí.')}</p><button onClick={() => void turnOn()} className={`${ghost} mt-2`}>{t('Turn on private AI (Wi-Fi recommended)', 'Activar IA privada (mejor con Wi-Fi)')}</button></div>}
      {ai === 'loading' && <div className="mt-3 text-sm"><p>{t('Getting Mia ready on your device…', 'Preparando a Mia en tu dispositivo…')} {pct}%</p><div className="mt-1 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-mango transition-all" style={{ width: `${pct}%` }} /></div></div>}
      {ai === 'unsupported' && <p className="mt-3 text-xs text-ink/50">{t('This device can’t run the private AI, so Mia uses her built-in helper, which still knows your progress.', 'Este dispositivo no puede correr la IA privada, así que Mia usa su asistente integrado, que igual conoce tu progreso.')}</p>}
      <div className="mt-3 grow space-y-3 overflow-y-auto" aria-live="polite">
        {!msgs.length && <p className="rounded-2xl bg-white/[0.04] p-3 text-sm">{reply('hi', { s, es })}</p>}
        {msgs.map((m, i) => <div key={i} className={`max-w-[90%] whitespace-pre-wrap rounded-2xl p-3 text-sm ${m.role === 'user' ? 'ml-auto bg-mango/15' : 'bg-white/[0.05]'}`}>{m.content || '…'}</div>)}<div ref={end} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">{[t('I’m struggling right now', 'Estoy pasándola mal ahora'), t('What should I do next?', '¿Qué hago ahora?'), t('How do I talk to my partner?', '¿Cómo hablo con mi pareja?')].map((q) => <button key={q} onClick={() => void send(q)} className="min-h-10 rounded-full px-3 text-xs ring-1 ring-white/15 hover:bg-white/5">{q}</button>)}</div>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); void send(text); }}><input value={text} onChange={(e) => setText(e.target.value)} aria-label={t('Message Mia', 'Escribe a Mia')} placeholder={t('Type here…', 'Escribe aquí…')} className={input} /><button disabled={busy} className={primary}>{t('Send', 'Enviar')}</button></form>
      <p className="mt-2 text-[11px] text-ink/45">{t('Mia is an AI coach, not a therapist. Conversations stay on this device.', 'Mia es una coach de IA, no una terapeuta. Las conversaciones se quedan en este dispositivo.')}</p>
    </aside>
  );
}

// ---------- Staff: customers they can see (managers: all; coaches: assigned) ----------
function Team({ t, es, uid, level }: { t: T; es: boolean; uid: string; level: P.Level }) {
  const [mem, setMem] = useState<P.Member[]>([]); const [dash, setDash] = useState<Awaited<ReturnType<typeof P.dashboards>>>([]); const [ups, setUps] = useState<P.Update[]>([]); const [sel, setSel] = useState<string | null>(null);
  const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [urgent, setUrgent] = useState(false); const [msg, setMsg] = useState('');
  const refresh = () => { void P.members().then(setMem); void P.dashboards().then(setDash); void P.updates().then(setUps); };
  useEffect(refresh, []);
  const customers = mem.filter((m) => m.user_id !== uid && (m.level === 1 || level >= 3));
  const cur = customers.find((c) => c.user_id === sel); const d = dash.find((x) => x.customer_id === sel);
  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <section className={card}><h2 className="font-display text-xl font-semibold">{level >= 3 ? t('All customers', 'Todos los clientes') : t('Your assigned customers', 'Tus clientes asignados')}</h2>
        <ul className="mt-3 space-y-1">{customers.map((c) => { const dd = dash.find((x) => x.customer_id === c.user_id); return <li key={c.user_id}><button onClick={() => setSel(c.user_id)} className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-2xl px-3 text-left text-sm ${sel === c.user_id ? 'bg-mango/15 ring-1 ring-mango/40' : 'hover:bg-white/5'}`}><span className="truncate">{c.display_name || c.email}</span><span className="text-xs text-ink/50">{dd ? `${dd.results.score}` : t('not shared', 'no compartido')}</span></button></li>; })}
          {!customers.length && <li className="text-sm text-ink/60">{t('No customers yet.', 'Aún no hay clientes.')}</li>}</ul></section>
      {cur ? <section className={card}>
        <h2 className="font-display text-2xl font-semibold">{cur.display_name || cur.email}</h2><p className="text-sm text-ink/55">{cur.email} · {P.LEVELS[cur.level][es ? 'es' : 'en']}</p>
        {d ? <><p className="mt-3 text-sm">{t('Score', 'Puntuación')} <strong>{d.results.score}</strong> · {t('closed', 'cerradas')} {d.results.closed.length}/{d.results.total} · {t('flags', 'marcas')} {d.results.flags} · {t('removals', 'quitados')} {d.results.queueDone} · {t('shared', 'compartido')} {new Date(d.updated_at).toLocaleDateString()}</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-ink/75">{d.items.map((i) => <li key={i.id}>{es ? i.es : i.en}</li>)}</ul></> : <p className="mt-3 text-sm text-ink/60">{t('This customer has not shared results. Only what they choose to share appears here.', 'Este cliente no ha compartido resultados. Solo aparece lo que elija compartir.')}</p>}
        <form className="mt-5 space-y-2" onSubmit={async (e) => { e.preventDefault(); const r = await P.postUpdate(uid, cur.user_id, title, body, urgent); setMsg(r ?? t('Update posted.', 'Aviso publicado.')); if (!r) { setTitle(''); setBody(''); setUrgent(false); refresh(); } }}>
          <h3 className="font-semibold">{t('Post an update to their dashboard', 'Publicar un aviso en su panel')}</h3>
          <input required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('Title', 'Título')} className={input} />
          <textarea maxLength={2000} rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder={t('Message (optional)', 'Mensaje (opcional)')} className={`${input} py-3`} />
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="size-5 accent-[#E8A4A9]" />{t('Mark as important', 'Marcar como importante')}</label>
          <button className={primary}>{t('Post update', 'Publicar')}</button>{msg && <p role="status" className="text-sm text-lagoon">{msg}</p>}</form>
        <ul className="mt-5 space-y-2 text-sm">{ups.filter((u) => u.customer_id === cur.user_id).map((u) => <li key={u.id} className="rounded-xl bg-white/[0.04] p-3">{u.urgent && '❗ '}<strong>{u.title}</strong> <span className="text-ink/50">· {new Date(u.created_at).toLocaleDateString()}</span></li>)}</ul>
      </section> : <section className={`${card} grid place-items-center text-ink/55`}>{t('Choose a customer.', 'Elige un cliente.')}</section>}
    </div>
  );
}

// ---------- Company Admin: security levels and access assignments ----------
function Access({ t, es, uid }: { t: T; es: boolean; uid: string }) {
  const [mem, setMem] = useState<P.Member[]>([]); const [asg, setAsg] = useState<{ staff_id: string; customer_id: string }[]>([]); const [msg, setMsg] = useState('');
  const refresh = () => { void P.members().then(setMem); void P.assignments().then(setAsg); };
  useEffect(refresh, []);
  const admins = mem.filter((m) => m.level === 4).length; const coaches = mem.filter((m) => m.level === 2); const customers = mem.filter((m) => m.level === 1);
  return (<div className="grid gap-5">
    <section className={card}><h2 className="font-display text-2xl font-semibold">{t('Security levels', 'Niveles de seguridad')}</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">{([4, 3, 2, 1] as P.Level[]).map((l) => <li key={l} className="rounded-2xl bg-white/[0.04] p-3 text-sm"><strong>{l} · {P.LEVELS[l][es ? 'es' : 'en']}</strong><p className="mt-0.5 text-ink/65">{es ? P.LEVELS[l].canEs : P.LEVELS[l].can}</p></li>)}</ul>
      <p className="mt-3 text-sm text-ink/60">{t(`Company Admins: ${admins}. At least one must always have Company Admin Access; the system blocks removing the last one.`, `Administradores: ${admins}. Siempre debe haber al menos uno; el sistema no deja quitar al último.`)}</p></section>
    <section className={card}><h2 className="font-display text-2xl font-semibold">{t('People and access', 'Personas y accesos')}</h2>
      <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="text-ink/55"><th className="py-2 font-medium">{t('Person', 'Persona')}</th><th className="font-medium">{t('Level', 'Nivel')}</th><th className="font-medium">{t('Joined', 'Desde')}</th></tr></thead>
        <tbody>{mem.map((m) => <tr key={m.user_id} className="border-t border-white/10"><td className="py-2 pr-3">{m.display_name || m.email}{m.user_id === uid && <span className="text-ink/45"> ({t('you', 'tú')})</span>}<div className="text-xs text-ink/45">{m.email}</div></td>
          <td className="pr-3"><select aria-label={`${t('Level for', 'Nivel de')} ${m.email}`} value={m.level} onChange={async (e) => { const r = await P.setLevel(m.user_id, Number(e.target.value) as P.Level); setMsg(r ? (r.includes('at least one') ? t('Blocked: at least one Company Admin Access account must remain.', 'Bloqueado: debe quedar al menos un Administrador.') : r) : t('Saved.', 'Guardado.')); refresh(); }} className="min-h-11 rounded-xl bg-night/60 px-2 ring-1 ring-white/15">{([4, 3, 2, 1] as P.Level[]).map((l) => <option key={l} value={l}>{l} · {P.LEVELS[l][es ? 'es' : 'en']}</option>)}</select></td>
          <td className="text-ink/55">{new Date(m.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>
      {msg && <p role="status" className="mt-2 text-sm text-lagoon">{msg}</p>}</section>
    <section className={card}><h2 className="font-display text-2xl font-semibold">{t('Coach assignments', 'Asignación de coaches')}</h2><p className="mt-1 text-sm text-ink/60">{t('A coach sees and posts updates only for the customers ticked here.', 'Un coach ve y publica avisos solo para los clientes marcados aquí.')}</p>
      {!coaches.length ? <p className="mt-3 text-sm text-ink/60">{t('No one has the Coach / Support level yet. Set a level above first.', 'Nadie tiene el nivel Coach / Soporte todavía. Asigna un nivel arriba primero.')}</p> :
        <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="py-2 font-medium text-ink/55">{t('Customer', 'Cliente')}</th>{coaches.map((c) => <th key={c.user_id} className="px-2 font-medium text-ink/55">{c.display_name || c.email}</th>)}</tr></thead>
          <tbody>{customers.map((cu) => <tr key={cu.user_id} className="border-t border-white/10"><td className="py-2 pr-3">{cu.display_name || cu.email}</td>{coaches.map((co) => { const on = asg.some((a) => a.staff_id === co.user_id && a.customer_id === cu.user_id); return <td key={co.user_id} className="px-2"><input type="checkbox" checked={on} aria-label={`${co.email} → ${cu.email}`} onChange={async () => { await P.assign(co.user_id, cu.user_id, !on); refresh(); }} className="size-5 accent-[#E8A4A9]" /></td>; })}</tr>)}</tbody></table></div>}
    </section>
  </div>);
}
