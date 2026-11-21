'use client';
import { useEffect, useMemo, useState } from 'react';
import { load, save, fresh, wipe, canWipe, validEmail, sweepLock, LANG_KEY, ACCT_STEPS, type AdvState, type Intake, type Stage, type Support, type AcctStep } from '@/lib/adv/store';
import { status, score, tick, remaining, accountFor, doneCount } from '@/lib/adv/accounts';
import { PLATFORMS } from '@/lib/catalog';
import { LESSONS } from '@/lib/adv/learn';
import { AdvCtx, Card, Btn, H, Pill, Check, fmtDate, type Tab, useAdv } from './ui';
import { Learn, Sweep, Review, Solo, Proof, MiaTab } from './Sections';

const TABS: { id: Tab; en: string; es: string; icon: string }[] = [
  { id: 'start', en: 'Start', es: 'Inicio', icon: '✦' }, { id: 'learn', en: 'Learn', es: 'Aprender', icon: '📖' }, { id: 'sweep', en: 'Sweep', es: 'Revisión', icon: '🔎' },
  { id: 'review', en: 'Review', es: 'Revisar', icon: '☑︎' }, { id: 'accounts', en: 'Accounts', es: 'Cuentas', icon: '🗂' }, { id: 'proof', en: 'Proof', es: 'Prueba', icon: '🏅' },
  { id: 'mia', en: 'Mia', es: 'Mia', icon: '💬' }, { id: 'solo', en: 'Solo Search', es: 'Búsqueda Solo', icon: '🧭' }, { id: 'settings', en: 'Settings', es: 'Ajustes', icon: '⚙︎' },
];

export default function AdvApp({ only }: { only?: 'solo' }) {
  const [s, setS] = useState<AdvState>(fresh); const [ready, setReady] = useState(false); const [tab, setTab] = useState<Tab>('start'); const [lang, setLang] = useState<'en' | 'es'>('en');
  useEffect(() => { const st = load(); setS(st); let l: string | null = null; try { l = localStorage.getItem(LANG_KEY); } catch { /* blocked */ } setLang((st.intake?.lang ?? l ?? (navigator.language.startsWith('es') ? 'es' : 'en')) as 'en' | 'es'); const h = location.hash.slice(1); if (TABS.some((x) => x.id === h)) setTab(h as Tab); if (location.hash.startsWith('#p=')) setTab('proof'); setReady(true); }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const ctx = useMemo(() => ({ s, es: lang === 'es', t: (en: string, es: string) => (lang === 'es' ? es : en), go: (t: Tab) => { setTab(t); history.replaceState(null, '', `#${t}`); scrollTo({ top: 0, behavior: 'smooth' }); },
    set: (f: (x: AdvState) => AdvState) => setS((x) => { const n = f(x); save(n); return n; }) }), [s, lang]);
  const setLanguage = (l: 'en' | 'es') => { setLang(l); try { localStorage.setItem(LANG_KEY, l); } catch { /* ignore */ } ctx.set((x) => (x.intake ? { ...x, intake: { ...x.intake, lang: l } } : x)); };
  if (!ready) return <div className="min-h-[60vh]" />;
  return (
    <AdvCtx.Provider value={ctx}>
      <div className="relative isolate mx-auto max-w-5xl overflow-x-clip px-4 pb-28 pt-4">
        <div className="adv-aurora !h-[420px] opacity-50" aria-hidden="true"><span /><span /><span /></div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <Pill tone="gold">{ctx.t('Free · private · on your device', 'Gratis · privado · en tu dispositivo')}</Pill>
          <div role="group" aria-label="Language / Idioma" className="flex rounded-full ring-1 ring-white/15">
            {(['en', 'es'] as const).map((l) => <button key={l} onClick={() => setLanguage(l)} aria-pressed={lang === l} className={`min-h-11 min-w-12 rounded-full px-3 text-sm ${lang === l ? 'bg-mango text-night font-semibold' : 'text-ink/70'}`}>{l === 'en' ? 'EN' : 'ES'}</button>)}
          </div>
        </div>
        {only === 'solo' ? <><Solo /><p className="mt-6 text-sm text-ink/60"><a href="../app/" className="underline underline-offset-4">{ctx.t('Doing this together with your partner? Start the full Marriage Mode', '¿Lo hacen juntos? Empieza Marriage Mode completo')} →</a></p></> : !s.intake ? <IntakeFlow /> : (<>
          <nav aria-label={ctx.t('Sections', 'Secciones')} className="sticky top-[57px] z-40 -mx-4 mb-6 overflow-x-auto border-b border-white/[0.06] bg-night/85 px-4 backdrop-blur-xl [scrollbar-width:none]">
            <div className="flex gap-1 py-2">{TABS.map((x) => <button key={x.id} onClick={() => ctx.go(x.id)} aria-current={tab === x.id ? 'page' : undefined} className={`min-h-11 shrink-0 rounded-full px-4 text-sm transition ${tab === x.id ? 'bg-mango/15 text-mango ring-1 ring-mango/40' : 'text-ink/70 hover:text-ink'}`}><span aria-hidden="true" className="mr-1.5">{x.icon}</span>{lang === 'es' ? x.es : x.en}</button>)}</div>
          </nav>
          <div key={tab} className="rise">
            {tab === 'start' && <Start />}{tab === 'learn' && <Learn />}{tab === 'sweep' && <Sweep />}{tab === 'review' && <Review />}{tab === 'accounts' && <Accounts />}
            {tab === 'solo' && <Solo />}{tab === 'proof' && <Proof />}{tab === 'mia' && <MiaTab />}{tab === 'settings' && <Settings />}
          </div>
        </>)}
        <a href="https://www.google.com/" className="fixed bottom-4 right-4 z-50 inline-flex min-h-11 items-center rounded-full bg-coral px-4 text-sm font-semibold text-night shadow-lg" rel="noreferrer">{ctx.t('Quick exit', 'Salida rápida')}</a>
      </div>
    </AdvCtx.Provider>
  );
}

// ---------- Job 1 + Job 6: intake (disclaimer first, then one decision per screen) ----------
function IntakeFlow() {
  const { set, t, es } = useAdv();
  const [step, setStep] = useState(0); const [d, setD] = useState<Partial<Intake>>({ lang: es ? 'es' : 'en' }); const [touched, setTouched] = useState(false);
  const [onFile, setOnFile] = useState(false);
  useEffect(() => { void import('@/lib/portal').then((P) => P.partnerInfo()).then((info) => { if (info?.partner_emails[0]) { setD((x) => ({ ...x, partnerEmail: info.partner_emails[0] })); setOnFile(true); } }).catch(() => {}); }, []);
  const lock = sweepLock(d); const emailBad = touched && !!d.partnerEmail && !validEmail(d.partnerEmail);
  const stages: [Stage, string, string][] = [['dating', 'Dating seriously', 'En una relación seria'], ['engaged', 'Engaged', 'Comprometidos'], ['newlywed', 'Newly married', 'Recién casados'], ['married', 'Married', 'Casados'], ['rebuilding', 'Rebuilding trust', 'Reconstruyendo la confianza']];
  const supports: [Support, string, string, string, string][] = [['human', 'Human', 'Humano', 'A real counselor walks with you.', 'Un consejero real te acompaña.'], ['ai', 'AI', 'IA', 'Mia, our AI coach, guides you any time.', 'Mia, nuestra coach de IA, te guía cuando quieras.'], ['hybrid', 'Hybrid', 'Híbrido', 'Mia day to day, a real person when it matters.', 'Mia en el día a día, una persona real cuando importa.']];
  const finish = (sup: Support) => set((x) => ({ ...x, intake: { stage: d.stage!, lang: d.lang ?? 'en', support: sup, partnerEmail: d.partnerEmail!.trim(), ack: true, ackAt: new Date().toISOString(), name: d.name?.trim() || undefined } }));
  const dots = <div className="mb-6 flex gap-1.5" aria-label={t(`Step ${step + 1} of 4`, `Paso ${step + 1} de 4`)}>{[0, 1, 2, 3].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-mango' : 'bg-white/10'}`} />)}</div>;
  return (
    <div className="mx-auto max-w-xl">
      <p className="mb-2 text-sm text-ink/60">{t('1-minute intake', 'Registro de 1 minuto')}</p>{dots}
      {step === 0 && (<>
        <div className="mb-5 w-full rounded-3xl bg-mango/10 p-5 ring-1 ring-mango/40" role="note">
          <p className="text-xs font-semibold uppercase tracking-wider text-mango">{t('Before anything else', 'Antes que nada')}</p>
          <p className="mt-2 font-display text-2xl leading-snug">“If you use this product, your results will go to your partner.”</p>
          <p className="mt-2 font-display text-xl leading-snug text-ink/80">“Si usas este producto, tus resultados irán a tu pareja.”</p>
        </div>
        <Card>
          {onFile ? <p className="rounded-2xl bg-palm/10 p-3 text-sm ring-1 ring-palm/30">✓ {t('We already have your partner’s email on file. Nothing to type.', 'Ya tenemos el correo de tu pareja. No tienes que escribir nada.')}</p> : <>
          <label htmlFor="pe" className="block font-medium">{t('Your partner’s email (required)', 'Correo de tu pareja (obligatorio)')}</label>
          <input id="pe" type="email" inputMode="email" autoComplete="off" value={d.partnerEmail ?? ''} onChange={(e) => setD({ ...d, partnerEmail: e.target.value })} onBlur={() => setTouched(true)} aria-invalid={emailBad} aria-describedby="pe-err" className="mt-2 min-h-12 w-full rounded-2xl bg-night/60 px-4 ring-1 ring-white/15 focus:ring-mango" placeholder="partner@example.com" />
          <p id="pe-err" className="mt-1 min-h-5 text-sm text-coral">{emailBad ? t('That email doesn’t look right. Check it and try again.', 'Ese correo no parece correcto. Revísalo e inténtalo otra vez.') : ''}</p></>}
          <Check id="ack" checked={!!d.ack} onChange={(v) => setD({ ...d, ack: v })}>{t('I understand my results will go to my partner.', 'Entiendo que mis resultados irán a mi pareja.')}</Check>
          <p className="mt-2 text-sm text-ink/60">{t('Nothing is ever sent without you seeing exactly what will be sent and tapping confirm. You choose each section to share.', 'Nunca se envía nada sin que veas exactamente qué se enviará y toques confirmar. Tú eliges cada sección que compartes.')}</p>
          {lock.length > 0 && <p className="mt-3 text-sm text-ink/70" role="status">🔒 {t('The Sweep stays locked until', 'La Revisión sigue bloqueada hasta que')}: {lock.map((w) => ({ 'email-missing': t('partner email is entered', 'escribas el correo de tu pareja'), 'email-invalid': t('partner email is valid', 'el correo sea válido'), 'ack-missing': t('you tick the box', 'marques la casilla') }[w])).join(' · ')}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-3"><Btn disabled={lock.length > 0} onClick={() => setStep(1)}>{t('Continue', 'Continuar')}</Btn>
            <a href="../solo/" className="inline-flex min-h-11 items-center text-sm text-ink/60 underline underline-offset-4">{t('Partner won’t join? Use free Solo Search instead', '¿Tu pareja no participa? Usa la Búsqueda Solo gratis')}</a></div>
        </Card>
      </>)}
      {step === 1 && <Card><H sub={t('This shapes your lessons, Mia and your report.', 'Esto ajusta tus lecciones, a Mia y tu reporte.')}>{t('Where are you two right now?', '¿En qué etapa están?')}</H>
        <div className="grid gap-2">{stages.map(([k, en, sp]) => <Btn key={k} kind={d.stage === k ? 'primary' : 'ghost'} className="justify-start" onClick={() => { setD({ ...d, stage: k }); setStep(2); }}>{es ? sp : en}</Btn>)}</div></Card>}
      {step === 2 && <Card><H>{t('Which language?', '¿Qué idioma?')}</H><div className="grid gap-2">
        <Btn kind={d.lang === 'en' ? 'primary' : 'ghost'} onClick={() => { setD({ ...d, lang: 'en' }); setStep(3); }}>English</Btn><Btn kind={d.lang === 'es' ? 'primary' : 'ghost'} onClick={() => { setD({ ...d, lang: 'es' }); setStep(3); }}>Español</Btn></div></Card>}
      {step === 3 && <Card><H sub={t('You can change this any time in Settings.', 'Puedes cambiarlo cuando quieras en Ajustes.')}>{t('How would you like support?', '¿Qué tipo de apoyo prefieres?')}</H>
        <div className="grid gap-2">{supports.map(([k, en, sp, den, dsp]) => <button key={k} onClick={() => finish(k)} className="btn-press min-h-14 rounded-2xl p-4 text-left ring-1 ring-white/15 hover:bg-white/5"><span className="font-semibold">{es ? sp : en}</span><span className="block text-sm text-ink/65">{es ? dsp : den}</span></button>)}</div></Card>}
      {step > 0 && <button onClick={() => setStep(step - 1)} className="mt-4 min-h-11 text-sm text-ink/60 underline underline-offset-4">{t('Back', 'Atrás')}</button>}
      <p className="mt-6 text-xs text-ink/50">{t('Everything stays on this device. Clear it any time in Settings.', 'Todo se queda en este dispositivo. Bórralo cuando quieras en Ajustes.')}</p>
    </div>
  );
}

// ---------- Start: score + the 7-step guided checklist ----------
const STAGE_LINE: Record<Stage, [string, string]> = { dating: ['Building something serious? Start clean.', '¿Construyendo algo serio? Empiecen en limpio.'], engaged: ['Before the wedding: close the dating chapter together.', 'Antes de la boda: cierren juntos la etapa de citas.'], newlywed: ['New marriage, clean slate.', 'Matrimonio nuevo, página en blanco.'], married: ['Protect what you have built.', 'Protejan lo que han construido.'], rebuilding: ['Rebuilding trust, one verified step at a time.', 'Reconstruyendo la confianza, un paso verificado a la vez.'] };
export function useChecklist() {
  const { s } = useAdv();
  return [
    { id: 'intake', en: 'Complete the 1-minute intake, partner disclaimer and partner email', es: 'Completa el registro, el aviso a tu pareja y su correo', done: !!s.intake?.ack, tab: 'start' as Tab },
    { id: 'support', en: 'Choose Human, AI, or Hybrid support', es: 'Elige apoyo Humano, IA o Híbrido', done: !!s.intake?.support, tab: 'settings' as Tab },
    { id: 'learn', en: 'Complete the 6 Learn topics and the boundaries worksheet', es: 'Completa los 6 temas y la hoja de límites', done: LESSONS.every((l) => s.learnRead[l.id]) && !!s.worksheet.aDone && !!s.worksheet.bDone, tab: 'learn' as Tab },
    { id: 'export', en: 'Connect or export each platform, email and device source', es: 'Conecta o exporta cada plataforma, correo y dispositivo', done: s.sources.length >= 3, tab: 'sweep' as Tab },
    { id: 'review', en: 'Run the Sweep, review every flag, check access levels', es: 'Haz la Revisión, revisa cada marca y los niveles de acceso', done: s.flags.length > 0 && s.flags.every((f) => s.queue.some((q) => q.flagId === f.id) || s.checklist[`kept-${f.id}`]), tab: 'review' as Tab },
    { id: 'queue', en: 'Select, confirm the backup, work the queue in batches of 5', es: 'Selecciona, confirma el respaldo y trabaja la cola de 5 en 5', done: s.queue.length > 0 && s.queue.every((q) => q.state !== 'queued'), tab: 'review' as Tab },
    { id: 'proof', en: 'Verify proof, download the report, share, set the monthly re-check', es: 'Verifica, descarga el reporte, comparte y programa la revisión mensual', done: s.sent.length > 0 && !!s.lastCheck, tab: 'proof' as Tab },
  ];
}
function Start() {
  const { s, t, es, go } = useAdv(); const sc = score(s.accounts); const list = useChecklist(); const next = list.find((x) => !x.done);
  return (<>
    <H sub={STAGE_LINE[s.intake!.stage][es ? 1 : 0]}>{t('Your Clean Slate', 'Tu Clean Slate')}{s.intake?.name ? `, ${s.intake.name}` : ''}</H>
    <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
      <Card tone="rose" className="text-center">
        <p className="text-sm text-ink/70">{t('Honest score', 'Puntuación honesta')}</p>
        <p className="font-display text-7xl font-semibold text-mango" aria-live="polite">{sc.score}</p>
        <p className="text-sm text-ink/70">{t(`${sc.closed} of ${sc.total} accounts fully closed`, `${sc.closed} de ${sc.total} cuentas cerradas por completo`)}{sc.inProgress ? t(` · ${sc.inProgress} in progress`, ` · ${sc.inProgress} en progreso`) : ''}</p>
        <p className="mt-3 text-xs text-ink/55">{t('An account counts only when all 4 steps are done.', 'Una cuenta cuenta solo cuando los 4 pasos están hechos.')}</p>
      </Card>
      <Card>
        <h2 className="font-display text-xl font-semibold">{t('Your step-by-step', 'Tu paso a paso')}</h2>
        <ol className="mt-3 space-y-1">{list.map((x, i) => <li key={x.id}><button onClick={() => go(x.tab)} className="flex min-h-11 w-full items-start gap-3 rounded-2xl px-2 py-2 text-left hover:bg-white/5"><span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs ${x.done ? 'bg-palm text-night' : 'ring-1 ring-white/25'}`} aria-hidden="true">{x.done ? '✓' : i + 1}</span><span className={x.done ? 'text-ink/55 line-through' : ''}>{es ? x.es : x.en}<span className="sr-only">{x.done ? t(' (done)', ' (hecho)') : ''}</span></span></button></li>)}</ol>
        {next && <Btn className="mt-4" onClick={() => go(next.tab)}>{t('Continue', 'Continuar')}: {(es ? next.es : next.en).split(',')[0]}</Btn>}
      </Card>
    </div>
  </>);
}

// ---------- Job 1: honest dating-account cleanup (29 apps from v1) ----------
const STEP_LABEL: Record<AcctStep, [string, string]> = { delete: ['Delete the account', 'Borrar la cuenta'], billing: ['Cancel billing / subscription', 'Cancelar cobro / suscripción'], app: ['Remove the app', 'Quitar la app'], emails: ['Unsubscribe from emails', 'Darse de baja de los correos'] };
function Accounts() {
  const { s, set, t, es } = useAdv(); const [add, setAdd] = useState('');
  const sc = score(s.accounts); const avail = PLATFORMS.filter((p) => !s.accounts.some((a) => a.id === p.id));
  return (<>
    <H sub={t('Tick each step as you finish it. “Closed” only appears when all 4 are done.', 'Marca cada paso al terminarlo. “Cerrada” solo aparece cuando los 4 están hechos.')}>{t('Dating accounts', 'Cuentas de citas')}</H>
    <Card className="mb-4"><div className="flex flex-wrap items-end gap-3">
      <label className="grow"><span className="text-sm text-ink/70">{t('Add an app (29 in the list)', 'Agrega una app (29 en la lista)')}</span>
        <select value={add} onChange={(e) => setAdd(e.target.value)} className="mt-1 min-h-12 w-full rounded-2xl bg-night/60 px-3 ring-1 ring-white/15"><option value="">{t('Choose…', 'Elige…')}</option>{avail.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <Btn disabled={!add} onClick={() => { set((x) => ({ ...x, accounts: [...x.accounts, accountFor(add, t('Added by you', 'Agregada por ti'))] })); setAdd(''); }}>{t('Add', 'Agregar')}</Btn></div>
      <p className="mt-3 text-sm text-ink/60">{t('Tip: the Sweep finds these for you from your inbox and receipts.', 'Consejo: la Revisión las encuentra por ti en tu correo y recibos.')} · {t('Score', 'Puntuación')}: <strong className="text-mango">{sc.score}</strong></p></Card>
    {s.accounts.length === 0 && <Card><p className="text-ink/70">{t('No accounts yet. Run the Sweep or add one above.', 'Aún no hay cuentas. Haz la Revisión o agrega una arriba.')}</p></Card>}
    <div className="grid gap-3 md:grid-cols-2">{s.accounts.map((a) => { const st = status(a); const p = PLATFORMS.find((x) => x.id === a.id); return (
      <Card key={a.id} tone={st === 'closed' ? 'ok' : undefined}>
        <div className="flex items-center justify-between gap-2"><h3 className="font-display text-xl font-semibold">{a.name}</h3>
          {st === 'closed' ? <Pill tone="ok">{t('Closed · verified', 'Cerrada · verificada')} {fmtDate(a.closedAt, es)}</Pill> : st === 'progress' ? <Pill tone="gold">{t('In progress', 'En progreso')} · {doneCount(a)}/4</Pill> : <Pill>{t('Open', 'Abierta')}</Pill>}</div>
        {a.evidence && <p className="mt-1 text-xs text-ink/55">{t('Found by', 'Encontrada por')}: {a.source} · {a.evidence}</p>}
        <div className="mt-2">{ACCT_STEPS.map((k) => <Check key={k} id={`${a.id}-${k}`} checked={!!a.steps[k]} onChange={(v) => set((x) => ({ ...x, accounts: x.accounts.map((y) => (y.id === a.id ? tick(y, k, v) : y)) }))}>{STEP_LABEL[k][es ? 1 : 0]}</Check>)}</div>
        {st === 'progress' && <p className="text-sm text-ink/65">{t('Still to do', 'Falta')}: {remaining(a).map((k) => STEP_LABEL[k][es ? 1 : 0]).join(' · ')}</p>}
        {p && st !== 'closed' && <p className="mt-2 text-sm text-ink/60">{p.deletePath}</p>}
      </Card>); })}</div>
  </>);
}

// ---------- Settings: support choice, Mia provider, Clear Data ----------
function Settings() {
  const { s, set, t, es } = useAdv(); const [typed, setTyped] = useState(''); const [wiped, setWiped] = useState(false);
  if (wiped) return <Card tone="ok"><H>{t('All local data is cleared.', 'Se borraron todos los datos locales.')}</H><p>{t('Your intake, progress, sweep results, queue and partner settings are gone from this device.', 'Tu registro, progreso, resultados, cola y ajustes de pareja ya no están en este dispositivo.')}</p><Btn className="mt-4" onClick={() => location.reload()}>{t('Start fresh', 'Empezar de nuevo')}</Btn></Card>;
  return (<>
    <H>{t('Settings', 'Ajustes')}</H>
    <div className="grid gap-4">
      <Card><h2 className="font-semibold">{t('Support', 'Apoyo')}</h2><div className="mt-2 flex flex-wrap gap-2">{(['human', 'ai', 'hybrid'] as Support[]).map((k) => <Btn key={k} kind={s.intake?.support === k ? 'primary' : 'ghost'} onClick={() => set((x) => ({ ...x, intake: { ...x.intake!, support: k } }))}>{{ human: t('Human', 'Humano'), ai: t('AI', 'IA'), hybrid: t('Hybrid', 'Híbrido') }[k]}</Btn>)}</div>
        <p className="mt-2 text-sm text-ink/60">{t('Partner email', 'Correo de tu pareja')}: {s.intake?.partnerEmail} · {t('acknowledged', 'confirmado')} {fmtDate(s.intake?.ackAt, es)}</p></Card>
      <Card><h2 className="font-semibold">{t('How Mia runs', 'Cómo funciona Mia')}</h2>
        <div className="mt-2 flex flex-wrap gap-2"><Btn kind={s.miaProvider === 'device' ? 'primary' : 'ghost'} onClick={() => set((x) => ({ ...x, miaProvider: 'device' }))}>{t('On this device (free)', 'En este dispositivo (gratis)')}</Btn><Btn kind="ghost" disabled>{t('Hosted (needs approval)', 'En servidor (requiere aprobación)')}</Btn></div>
        <p className="mt-2 text-sm text-ink/60">{t('Hosted inference is switched off until the founder approves its cost and data path (Ruling 4). Mia works fully without it.', 'La opción en servidor está apagada hasta que la fundadora apruebe su costo y manejo de datos (Decisión 4). Mia funciona por completo sin ella.')}</p></Card>
      <Card tone="warn"><h2 className="font-semibold">{t('Clear Data', 'Borrar datos')}</h2>
        <p className="mt-1 text-sm text-ink/70">{t('Removes intake, progress, sweep results, queue and partner settings from this device. Type CLEAR to unlock.', 'Quita registro, progreso, resultados, cola y ajustes de pareja de este dispositivo. Escribe CLEAR para desbloquear.')}</p>
        <div className="mt-3 flex flex-wrap gap-2"><input aria-label={t('Type CLEAR', 'Escribe CLEAR')} value={typed} onChange={(e) => setTyped(e.target.value)} autoCapitalize="characters" className="min-h-11 rounded-2xl bg-night/60 px-4 ring-1 ring-white/15" placeholder="CLEAR" />
          <Btn kind="danger" disabled={!canWipe(typed)} onClick={() => { if (wipe(typed)) setWiped(true); }}>{t('Wipe everything', 'Borrar todo')}</Btn></div></Card>
      <Card><p className="text-sm text-ink/70">{t('Is someone pressuring you to use this?', '¿Alguien te presiona para usar esto?')} {t('Free, confidential help', 'Ayuda gratis y confidencial')}: 1-800-799-7233 · {t('text START to 88788', 'envía START al 88788')} · thehotline.org</p></Card>
    </div>
  </>);
}
