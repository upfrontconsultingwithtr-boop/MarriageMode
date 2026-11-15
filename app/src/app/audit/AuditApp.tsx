'use client';
import { useEffect, useMemo, useState } from 'react';
import { effort, PLATFORMS, CATEGORY_LABEL, CATEGORY_LABEL_ES, BILLING_LINKS, BILLING_LINKS_ES, helpSearchUrl, CATALOG_VERIFIED, type Category } from '@/lib/catalog';
import { buildSteps, score, emailDomainsFor, gmailQuery, gmailSearchUrl, shareSummary, EMPTY_STATE, type AuditState, type Step } from '@/lib/audit';
import { track } from '@/lib/track';
import Ring from '@/components/Ring';
import Aurora from '@/components/Aurora';
import PartnerTab from '@/components/PartnerTab';
import SettingsTab from '@/components/SettingsTab';
import WebSearch from '@/components/WebSearch';
import DataScan from '@/components/DataScan';
import DeletionRequests from '@/components/DeletionRequests';
import Recheck from '@/components/Recheck';
import ProofBox from '@/components/ProofBox';
import InstallApp from '@/components/InstallApp';
import { cloud, cloudEnabled, sendLink, pull, push, merge, signOut } from '@/lib/cloud';
import { BASE, KIT_URL } from '@/lib/base';
import { LangCtx, LOCALE, type Lang } from '@/lib/i18n';
import { BENEFITS, TOOLS } from '@/lib/value';
import { loadPrefs, savePrefs } from '@/lib/prefs';

const KEY = 'marriage-mode:audit:v1';
const TABS = [
  { id: 'overview', label: 'Overview', es: 'Resumen', icon: '◎' },
  { id: 'apps', label: 'My apps', es: 'Mis apps', icon: '＋' },
  { id: 'clean', label: 'Clean up', es: 'Limpieza', icon: '✓' },
  { id: 'partner', label: 'Partner', es: 'Pareja', icon: '♡' },
  { id: 'settings', label: 'Settings', es: 'Ajustes', icon: '⚙' },
] as const;
const STATUS_ES: Record<string, string> = { 'Not started': 'Sin empezar', 'In progress': 'En curso', Closed: 'Cerrada' };
const EVERYWHERE = 'Everywhere else';
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
  const [lang, setLangState] = useState<Lang>('en');
  const setLang = (l: Lang) => { setLangState(l); const p = { ...loadPrefs(), lang: l }; savePrefs(p); document.documentElement.lang = l; };
  useEffect(() => { const q = new URLSearchParams(window.location.search).get('lang'); if (q === 'es' || q === 'en') setLang(q); else setLangState(loadPrefs().lang); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const es = lang === 'es';
  const t = (en: string, sp: string) => (es ? sp : en);

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

  const steps = useMemo(() => buildSteps(state, lang), [state.platformIds, state.custom, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const s = useMemo(() => score(steps, state.done), [steps, state.done]);
  const domains = useMemo(() => emailDomainsFor(state.platformIds), [state.platformIds]);
  const hasApps = state.platformIds.length + state.custom.length > 0;

  useEffect(() => {
    if (s.progress >= 50) track('audit-half-done');
    if (s.progress === 100 && hasApps) { track('audit-complete'); setCelebrate(true); }
  }, [s.progress, hasApps]);

  const groups = useMemo(() => {
    const g: { title: string; items: Step[] }[] = [];
    for (const st of steps) { const k = st.group ?? EVERYWHERE; const x = g.find((y) => y.title === k); if (x) x.items.push(st); else g.push({ title: k, items: [st] }); }
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
    { t: t('First step', 'Primer paso'), ok: s.doneCount >= 1 },
    { t: t('First app closed', 'Primera app cerrada'), ok: groups.some((g) => g.title !== EVERYWHERE && g.status === 'Closed') },
    { t: t('Halfway', 'A mitad de camino'), ok: s.progress >= 50 },
    { t: t('All accounts deleted', 'Todas las cuentas eliminadas'), ok: s.accountsTotal > 0 && s.accountsClosed === s.accountsTotal },
    { t: t('Clean slate', 'Página limpia'), ok: hasApps && s.progress === 100 },
  ];

  const toggle = (id: string) => setState((st) => ({ ...st, platformIds: st.platformIds.includes(id) ? st.platformIds.filter((x) => x !== id) : [...st.platformIds, id], startedAt: st.startedAt ?? new Date().toISOString() }));
  const tick = (id: string) => setState((st) => {
    const on = !st.done[id]; const doneAt = { ...(st.doneAt ?? {}) };
    if (on) doneAt[id] = new Date().toISOString(); else delete doneAt[id];
    return { ...st, done: { ...st.done, [id]: on }, doneAt };
  });
  const addCustom = () => { const n = custom.trim(); if (n && !state.custom.includes(n)) setState((st) => ({ ...st, custom: [...st.custom, n] })); setCustom(''); };
  const copy = async (text: string, what: string) => { try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(''), 2000); } catch { /* ignore */ } };
  const reset = () => { if (confirm(t('Clear your audit from this device?', '¿Borrar tu revisión de este dispositivo?'))) { setState(EMPTY_STATE); setTab('apps'); } };
  const hour = new Date().getHours();
  const hello = hour < 12 ? t('Good morning', 'Buenos días') : hour < 18 ? t('Good afternoon', 'Buenas tardes') : t('Good evening', 'Buenas noches');
  const summary = shareSummary(s, new Date(), lang);
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(LOCALE[lang], { month: 'short', day: 'numeric' });
  const cats = Object.keys(CATEGORY_LABEL) as Category[];
  const filtered = PLATFORMS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  const stepRow = (st: Step) => {
    const p = PLATFORMS.find((x) => x.id === st.platformId);
    return (
      <li key={st.id}>
        <label className="flex min-h-11 cursor-pointer gap-3 rounded-xl p-2 hover:bg-white/[0.03]">
          <input type="checkbox" checked={!!state.done[st.id]} onChange={() => tick(st.id)} className="mt-1 size-5 shrink-0 accent-[#D9B77E]" />
          <span>
            <span className={`font-medium ${state.done[st.id] ? 'text-ink/60 line-through' : ''}`}>{st.label}</span>
            {st.detail && <span className="block text-sm text-ink/60">{st.detail}</span>}
            {st.kind === 'cancel_billing' && (
              <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {(p ? p.billing : (['apple', 'google', 'web'] as const)).map((b) => BILLING_LINKS[b].url
                  ? <a key={b} href={BILLING_LINKS[b].url} target="_blank" rel="noopener noreferrer" className="text-teal underline">{(es ? BILLING_LINKS_ES : BILLING_LINKS)[b].label} ↗</a>
                  : <span key={b} className="text-ink/50">{(es ? BILLING_LINKS_ES : BILLING_LINKS)[b].how}</span>)}
              </span>
            )}
          </span>
        </label>
      </li>
    );
  };

  return (
    <LangCtx.Provider value={{ lang, setLang }}>
    <div lang={lang} className="relative isolate z-10 pb-28 md:pb-10">
      <Aurora className="absolute inset-x-0 top-0 -z-10 h-[560px] w-full opacity-70 print:hidden [mask-image:linear-gradient(#000,transparent)]" />
      <div className="grid-bg absolute inset-x-0 top-0 -z-10 h-[520px] print:hidden" aria-hidden="true" />

      {/* Celebration */}
      {celebrate && (
        <div role="dialog" aria-label={t('Clean slate', 'Página limpia')} className="fixed inset-0 z-[60] grid place-items-center bg-night/80 p-4 backdrop-blur print:hidden" onClick={() => setCelebrate(false)}>
          <div className="halo-border max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-[1.75rem] bg-deep p-8">
              <div className="pulse-soft mx-auto"><Ring value={100} size={120} /></div>
              <h2 className="mt-4 text-2xl font-bold"><span className="text-glow">{t('Clean slate.', 'Página limpia.')}</span></h2>
              <p className="mt-2 text-ink/70">{t('Every step is done. That took real care. Want to share it?', 'Terminaste cada paso. Eso tomó dedicación. ¿Quieres compartirlo?')}</p>
              <div className="mt-6 flex justify-center gap-2">
                <button onClick={() => { setCelebrate(false); setTab('partner'); }} className="glow-mango rounded-full bg-mango px-5 py-3 font-semibold text-night">{t('Share my progress', 'Compartir mi avance')}</button>
                <button onClick={() => setCelebrate(false)} className="rounded-full px-5 py-3 ring-1 ring-white/15">{t('Close', 'Cerrar')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-8 print:hidden md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden md:block">
          <div className="glass sticky top-24 p-3">
            <p className="px-3 pt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-teal">{t('Dashboard', 'Panel')}</p>
            <nav className="mt-2 flex flex-col gap-1" role="tablist" aria-label={t('Dashboard menu', 'Menú del panel')}>
              {TABS.map((tb) => (
                <button key={tb.id} role="tab" aria-selected={tab === tb.id} onClick={() => setTab(tb.id)}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition ${tab === tb.id ? 'bg-lagoon/15 text-ink ring-1 ring-lagoon/50 shadow-[0_0_20px_-8px_#D9B77E]' : 'text-ink/65 hover:bg-white/[0.04] hover:text-ink'}`}>
                  <span aria-hidden="true" className={tab === tb.id ? 'text-lagoon' : ''}>{tb.icon}</span>{es ? tb.es : tb.label}
                </button>
              ))}
            </nav>
            <div className="mt-3 border-t border-white/[0.07] px-3 pb-2 pt-3">
              <p className="text-xs text-ink/50">{t('Clean-slate score', 'Puntaje de página limpia')}</p>
              <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-lagoon to-mango transition-all" style={{ width: `${s.organization}%` }} /></div>
              <p className="mt-1 text-xs text-ink/60">{s.organization} / 100</p>
            </div>
          </div>
        </aside>
        <div className="min-w-0">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-teal">{t('Private · saved on this device only', 'Privado · guardado solo en este dispositivo')}</p>
            <h1 suppressHydrationWarning className="mt-1 text-3xl font-bold">{hello}{hasApps ? t('. Here\'s where you stand.', '. Así vas.') : t('. Let\'s begin.', '. Empecemos.')}</h1>
            {cloudEnabled && (
              <button onClick={() => setSyncOpen((o) => !o)} className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-full bg-white/[0.04] px-3 text-xs ring-1 ring-white/10 hover:ring-lagoon/50">
                <span className={`size-1.5 rounded-full ${syncEmail ? 'bg-lagoon shadow-[0_0_8px_#D9B77E]' : 'bg-ink/40'}`} />{syncEmail ? t('Synced across devices', 'Sincronizado entre dispositivos') : t('Use on more than one device?', '¿Lo usas en más de un dispositivo?')}
              </button>
            )}
          </div>
          <div role="group" aria-label={t('Language', 'Idioma')} className="flex rounded-full bg-white/[0.04] p-1 text-xs ring-1 ring-white/10">
            {(['en', 'es'] as const).map((l) => <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)} className={`min-h-9 rounded-full px-3 font-semibold ${lang === l ? 'bg-lagoon/20 text-ink' : 'text-ink/60'}`}>{l === 'en' ? 'English' : 'Español'}</button>)}
          </div>
        </div>

        {syncOpen && cloudEnabled && (
          <div className="glass mt-4 max-w-xl p-5">
            {syncEmail ? (
              <>
                <p className="font-semibold">{t('Synced as', 'Sincronizado como')} {syncEmail}</p>
                <p className="mt-1 text-sm text-ink/60">{t('Your checklist is saved to your private account and stays the same on every device you sign in on. Only you can see it.', 'Tu lista se guarda en tu cuenta privada y es la misma en cada dispositivo donde entres. Solo tú puedes verla.')}</p>
                <button onClick={() => { void signOut(); setSyncOpen(false); }} className="mt-3 min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15">{t('Sign out', 'Cerrar sesión')}</button>
              </>
            ) : (
              <form onSubmit={async (e) => { e.preventDefault(); setSyncMsg(t('Sending…', 'Enviando…')); const err = await sendLink(emailInput.trim(), `${window.location.origin}${BASE}/audit/`); setSyncMsg(err ? `${t('That didn\'t work', 'No funcionó')}: ${err}` : t('Check your email and tap the link to finish. You can close this.', 'Revisa tu correo y toca el enlace para terminar. Puedes cerrar esto.')); }}>
                <p className="font-semibold">{t('Sync across your devices (optional)', 'Sincroniza tus dispositivos (opcional)')}</p>
                <p className="mt-1 text-sm text-ink/60">{t('Without signing in, your audit stays only on this device. Sign in with an email link (no password) to keep it on every device. Only you can see it, and you can sign out anytime.', 'Sin entrar, tu revisión se queda solo en este dispositivo. Entra con un enlace por correo (sin contraseña) para tenerla en todos. Solo tú puedes verla y puedes salir cuando quieras.')}</p>
                <div className="mt-3 flex gap-2">
                  <label htmlFor="sync-email" className="sr-only">{t('Email', 'Correo')}</label>
                  <input id="sync-email" type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder={t('you@email.com', 'tu@correo.com')} className="min-h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-night/60 px-4" />
                  <button className="glow-lagoon min-h-11 rounded-full bg-lagoon px-4 text-sm font-semibold text-night">{t('Email me a link', 'Envíame un enlace')}</button>
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
              <Ring value={s.organization} size={112} label={t('Clean-slate score', 'Puntaje de página limpia')} sub={t(`${s.accountsClosed} of ${s.accountsTotal} accounts deleted`, `${s.accountsClosed} de ${s.accountsTotal} cuentas eliminadas`)} />
              <Ring value={s.progress} size={88} label={t('Steps done', 'Pasos hechos')} sub={t(`${s.doneCount} of ${s.total}`, `${s.doneCount} de ${s.total}`)} />
            </div>
            <div className="halo-border">
              <div className="h-full rounded-[1.75rem] bg-deep/95 p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mango">{t('Next best step', 'Siguiente mejor paso')}</p>
                {next ? (
                  <>
                    <p className="mt-2 text-lg font-semibold">{next.label}</p>
                    {next.detail && <p className="mt-1 text-sm text-ink/60">{next.detail}</p>}
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => tick(next.id)} className="glow-mango min-h-11 rounded-full bg-mango px-5 text-sm font-semibold text-night">{t('Mark done', 'Marcar hecho')}</button>
                      <button onClick={() => setTab('clean')} className="min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15">{t('See how', 'Ver cómo')}</button>
                    </div>
                  </>
                ) : <p className="mt-2 text-lg font-semibold">{hasApps ? t('All done. Nothing left behind.', 'Todo listo. Nada pendiente.') : t('Add the apps you used to begin.', 'Agrega las apps que usaste para empezar.')}</p>}
              </div>
            </div>

            <div className="glass p-6 lg:col-span-2">
              <div className="flex items-center justify-between"><h2 className="font-semibold">{t('Apps', 'Apps')}</h2><button onClick={() => setTab('apps')} className="text-sm text-teal">{t('+ Add apps', '+ Agregar apps')}</button></div>
              {!hasApps && <p className="mt-3 text-ink/60">{t('No apps yet.', 'Aún no hay apps.')} <button onClick={() => setTab('apps')} className="text-teal underline">{t('Pick the ones you used', 'Elige las que usaste')}</button>.</p>}
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {groups.filter((g) => g.title !== EVERYWHERE).map((g) => (
                  <button key={g.title} onClick={() => setTab('clean')} className="rounded-xl bg-white/[0.03] p-3.5 text-left ring-1 ring-white/[0.07] hover:ring-lagoon/40">
                    <div className="flex items-center justify-between gap-2 text-sm"><span className="font-medium">{g.title}</span><span className={`rounded-full px-2 py-0.5 text-[11px] ${badge[g.status]}`}>{es ? STATUS_ES[g.status] : g.status}</span></div>
                    <div className="mt-2.5 h-1.5 rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-lagoon to-mango transition-all" style={{ width: `${g.pct}%` }} /></div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass p-6">
              <h2 className="font-semibold">{t('Milestones', 'Logros')}</h2>
              <ul className="mt-3 space-y-2">
                {milestones.map((m) => (
                  <li key={m.t} className={`flex items-center gap-3 text-sm ${m.ok ? '' : 'text-ink/40'}`}>
                    <span className={`grid size-7 place-items-center rounded-full text-xs ${m.ok ? 'bg-lagoon text-night shadow-[0_0_14px_-3px_#D9B77E]' : 'ring-1 ring-white/15'}`}>{m.ok ? '✓' : ''}</span>{m.t}
                  </li>
                ))}
              </ul>
            </div>

            {hasApps && <Recheck state={state} setState={setState} goApps={() => { setTab('apps'); window.scrollTo({ top: 0 }); }} />}

            <div className="glass p-6 lg:col-span-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal">{t('Your toolkit · all free', 'Tus herramientas · todas gratis')}</p>
              <h2 className="mt-1 text-lg font-semibold">{t('Everything Marriage Mode does for you', 'Todo lo que Marriage Mode hace por ti')}</h2>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 [&>*]:min-w-0">
                {TOOLS.map((x) => (
                  <button key={x.id} onClick={() => { setTab(x.tab); window.scrollTo({ top: 0 }); }} className="flex flex-col rounded-xl bg-white/[0.03] p-4 text-left ring-1 ring-white/[0.07] transition hover:ring-lagoon/50">
                    <span className="flex items-center gap-2 font-semibold"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-lagoon/15 text-teal ring-1 ring-lagoon/40" aria-hidden="true">{x.icon}</span>{es ? x.es.t : x.en.t}</span>
                    <span className="mt-2 text-sm text-ink/65">{es ? x.es.v : x.en.v}</span>
                    <span className="mt-auto pt-3 text-sm text-teal">{t('Open →', 'Abrir →')}</span>
                  </button>
                ))}
              </div>
              <div className="mt-5 grid gap-3 border-t border-white/[0.07] pt-5 sm:grid-cols-2 lg:grid-cols-4 [&>*]:min-w-0">
                {BENEFITS.map((b) => (
                  <div key={b.icon} className="flex gap-2.5 text-sm"><span aria-hidden="true">{b.icon}</span><span><b className="block text-ink">{es ? b.es.t : b.en.t}</b><span className="text-ink/60">{es ? b.es.v : b.en.v}</span></span></div>
                ))}
              </div>
            </div>

            {KIT_URL && (
              <div className="glass flex flex-wrap items-center justify-between gap-4 p-6 lg:col-span-3">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mango">{t('Optional · $19 one time', 'Opcional · $19 un solo pago')}</p>
                  <h2 className="mt-1 text-lg font-semibold">Clean Slate Kit</h2>
                  <p className="text-sm text-ink/65">{t('A printable companion: cleanup report, 30-day boundaries plan and 12 conversation cards. The audit stays free.', 'Un complemento para imprimir: reporte de limpieza, plan de límites de 30 días y 12 tarjetas de conversación. La revisión sigue gratis.')}</p>
                </div>
                <a href={KIT_URL} target="_blank" rel="noopener noreferrer" className="glow-mango min-h-11 shrink-0 rounded-full bg-mango px-5 py-3 text-sm font-semibold text-night">{t('Get the kit ↗', 'Obtener el kit ↗')}</a>
              </div>
            )}
            <div className="glass p-6 lg:col-span-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">{t('Timeline', 'Historial')}</h2>
                <button onClick={() => window.print()} className="min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15 hover:ring-lagoon/50">{t('Print or save my report', 'Imprimir o guardar mi reporte')}</button>
              </div>
              {timeline.length === 0 ? <p className="mt-3 text-sm text-ink/55">{t('Each step you finish is recorded here with its date.', 'Cada paso que termines queda aquí con su fecha.')}</p> : (
                <ol className="mt-4 space-y-3 border-l border-lagoon/30 pl-5">
                  {timeline.slice(0, 8).map((x) => (
                    <li key={x.step!.id} className="relative text-sm"><span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full bg-lagoon shadow-[0_0_8px_#D9B77E]" /><span className="text-ink/50">{fmt(x.at)}</span> · {x.step!.label}</li>
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
              <h2 className="text-lg font-semibold">{t('Which apps have you ever used?', '¿Qué apps has usado alguna vez?')}</h2>
              <p className="mt-1 text-ink/65">{t('Tick every one, even if you only opened it once. Not sure? Use the inbox search below.', 'Marca cada una, aunque solo la hayas abierto una vez. ¿No estás seguro? Usa la búsqueda de correo abajo.')}</p>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search apps…', 'Buscar apps…')} aria-label={t('Search apps', 'Buscar apps')} className="mt-4 min-h-11 w-full rounded-full border border-white/15 bg-night/60 px-5 sm:w-80" />
              {cats.map((c) => {
                const items = filtered.filter((p) => p.category === c);
                if (!items.length) return null;
                return (
                  <div key={c} className="mt-6">
                    <h3 className="font-mono text-[11px] uppercase tracking-widest text-teal">{(es ? CATEGORY_LABEL_ES : CATEGORY_LABEL)[c]}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {items.map((p) => { const on = state.platformIds.includes(p.id); return (
                        <button key={p.id} onClick={() => toggle(p.id)} aria-pressed={on}
                          className={`min-h-11 rounded-full px-4 text-sm font-medium ring-1 transition ${on ? 'bg-lagoon/15 text-ink ring-lagoon/70 shadow-[0_0_18px_-6px_#D9B77E]' : 'bg-white/[0.03] text-ink/75 ring-white/10 hover:ring-lagoon/40'}`}>{on ? '✓ ' : ''}{p.name}</button>
                      ); })}
                    </div>
                  </div>
                );
              })}
              <div className="mt-6 flex gap-2">
                <input value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustom()} placeholder={t('Another app or site', 'Otra app o sitio')} aria-label={t('Add another app', 'Agregar otra app')} className="min-h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-night/60 px-5 sm:max-w-xs" />
                <button onClick={addCustom} className="min-h-11 rounded-full px-5 font-semibold ring-1 ring-white/15">{t('Add', 'Agregar')}</button>
              </div>
              {state.custom.length > 0 && <p className="mt-2 text-sm text-ink/60">{t('Added', 'Agregadas')}: {state.custom.join(', ')}</p>}
            </div>
            <button onClick={() => setTab('clean')} disabled={!hasApps} className="glow-mango mt-6 min-h-12 rounded-full bg-mango px-7 font-semibold text-night disabled:opacity-40">{t('Next: clean up →', 'Siguiente: limpieza →')}</button>
          </section>
        )}

        {/* CLEAN UP */}
        {tab === 'clean' && (
          <section className="mt-6 space-y-4">
            <DeletionRequests apps={groups.filter((g) => g.title !== EVERYWHERE).map((g) => g.title)} state={state} setState={setState} />
            {groups.map((g) => (
              <details key={g.title} open={g.status !== 'Closed'} className="glass group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-3"><span className="text-lg font-semibold">{g.title === EVERYWHERE ? t(EVERYWHERE, 'En todos lados') : g.title}</span><span className={`rounded-full px-2 py-0.5 text-[11px] ${badge[g.status]}`}>{es ? STATUS_ES[g.status] : g.status}</span></span>
                  <span className="flex items-center gap-2 text-sm text-ink/55">{(() => { const pl = PLATFORMS.find((x) => x.name === g.title); if (!pl) return null; const ef = effort(pl); return <span title={(es ? ef.whyEs : ef.why).join(' · ')} className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${ef.level === 1 ? 'text-palm ring-palm/40' : ef.level === 2 ? 'text-mango ring-mango/40' : 'text-coral ring-coral/40'}`}>{t('Effort', 'Esfuerzo')}: {es ? ef.es : ef.label}</span>; })()}{g.n}/{g.items.length}</span>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-lagoon to-mango transition-all" style={{ width: `${g.pct}%` }} /></div>
                </summary>
                <ul className="mt-3 space-y-1">{g.items.map(stepRow)}</ul>
                {g.title !== EVERYWHERE && <ProofBox app={g.title} state={state} setState={setState} />}
                {g.title !== EVERYWHERE && <a className="mt-2 inline-block text-sm text-teal underline" href={helpSearchUrl({ name: g.title })} target="_blank" rel="noopener noreferrer">{t('Official help page ↗', 'Página oficial de ayuda ↗')}</a>}
              </details>
            ))}
            <p className="text-xs text-ink/50">{t(`Steps checked ${CATALOG_VERIFIED}. Apps change their menus; if a step looks different, use the official help page.`, `Pasos revisados ${CATALOG_VERIFIED}. Las apps cambian sus menús; si algo se ve distinto, usa la página oficial de ayuda.`)}</p>
          </section>
        )}

        {/* FIND (shown inside My apps) */}
        {tab === 'apps' && (
          <section className="mt-6 grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
            <div className="glass p-6">
              <h2 className="text-lg font-semibold">{t('Search your own inbox', 'Busca en tu propio correo')}</h2>
              <p className="mt-1 text-ink/65">{t('Opens a search in your Gmail. We never connect to your email or see results.', 'Abre una búsqueda en tu Gmail. Nunca nos conectamos a tu correo ni vemos resultados.')}{state.platformIds.length ? t(' Covers the apps you picked.', ' Cubre las apps que elegiste.') : t(' With no apps picked it looks for all of them, to find ones you forgot.', ' Sin apps elegidas busca todas, para encontrar las que olvidaste.')}</p>
              <a onClick={() => track('gmail-search')} href={gmailSearchUrl(domains)} target="_blank" rel="noopener noreferrer" className="glow-lagoon mt-4 inline-flex min-h-11 items-center rounded-full bg-lagoon px-6 font-semibold text-night">{t('Search my Gmail ↗', 'Buscar en mi Gmail ↗')}</a>
              <h3 className="mt-6 font-semibold">{t('Outlook, Yahoo, iCloud or other email', 'Outlook, Yahoo, iCloud u otro correo')}</h3>
              <p className="text-sm text-ink/60">{t('Copy this into your email search box:', 'Copia esto en el buscador de tu correo:')}</p>
              <div className="mt-2 flex gap-2">
                <code className="block min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-night/70 p-3 text-sm text-teal">{gmailQuery(domains)}</code>
                <button onClick={() => copy(gmailQuery(domains), 'q')} className="min-h-11 rounded-lg px-4 text-sm font-semibold ring-1 ring-white/15">{copied === 'q' ? t('Copied', 'Copiado') : t('Copy', 'Copiar')}</button>
              </div>
            </div>
            <DataScan selected={state.platformIds} toggle={toggle} />
            <WebSearch state={state} setState={setState} addApps={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
            <div className="glass p-6">
              <h2 className="text-lg font-semibold">{t('Other places to look', 'Otros lugares para revisar')}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-ink/70">
                <li>{t('Your password manager or saved passwords: search “dating” or app names.', 'Tu gestor de contraseñas o contraseñas guardadas: busca “dating” o nombres de apps.')}</li>
                <li>{t('App store purchase history: subscriptions you forgot.', 'Historial de compras de la tienda de apps: suscripciones olvidadas.')}</li>
                <li>{t('Card statements from the last 3 months.', 'Estados de cuenta de los últimos 3 meses.')} <a href="../charges/" className="text-teal underline">{t('How to spot dating charges →', 'Cómo encontrar cobros de citas →')}</a></li>
                <li>{t('Old or second email addresses.', 'Correos antiguos o secundarios.')}</li>
              </ul>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="mt-4 min-h-11 rounded-full px-5 font-semibold ring-1 ring-white/15">{t('Found one? Add it above ↑', '¿Encontraste una? Agrégala arriba ↑')}</button>
            </div>
          </section>
        )}

        {/* PARTNER */}
        {tab === 'partner' && (
          <PartnerTab signedIn={!!syncEmail} openSignIn={() => setSyncOpen(true)} summary={summary}
            stats={{ progress: s.progress, closed: s.accountsClosed, total: s.accountsTotal, milestones: milestones.filter((m) => m.ok).map((m) => m.t) }} />
        )}

        {/* SETTINGS */}
        {tab === 'settings' && <div className="glass mt-6 p-6"><h2 className="text-lg font-semibold">{t('Get the app', 'Obtén la app')}</h2><div className="mt-2"><InstallApp /></div></div>}
        {tab === 'settings' && <SettingsTab signedInEmail={syncEmail} openSignIn={() => { setSyncOpen(true); window.scrollTo({ top: 0 }); }} clearDevice={reset} />}

        <div className="mt-10 flex justify-end"><button onClick={reset} className="text-sm text-ink/50 underline">{t('Clear my audit from this device', 'Borrar mi revisión de este dispositivo')}</button></div>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-night/85 backdrop-blur-xl md:hidden print:hidden" role="tablist" aria-label={t('Dashboard sections', 'Secciones del panel')}>
        <div className="mx-auto grid max-w-md grid-cols-5">
          {TABS.map((tb) => (
            <button key={tb.id} role="tab" aria-selected={tab === tb.id} onClick={() => { setTab(tb.id); window.scrollTo({ top: 0 }); }}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${tab === tb.id ? 'text-lagoon' : 'text-ink/55'}`}>
              <span className={`text-lg leading-none ${tab === tb.id ? 'drop-shadow-[0_0_8px_#D9B77E]' : ''}`} aria-hidden="true">{tb.icon}</span>{es ? tb.es : tb.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Printable report (print only) */}
      <section className="hidden p-8 text-black print:block">
        <h1 className="text-2xl font-bold">{t('My Marriage Mode cleanup report', 'Mi reporte de limpieza de Marriage Mode')}</h1>
        <p className="mt-1 text-sm">{t('Printed', 'Impreso')} {new Date().toLocaleDateString(LOCALE[lang], { month: 'long', day: 'numeric', year: 'numeric' })} · {t(`${s.accountsClosed} of ${s.accountsTotal} accounts deleted · ${s.doneCount} of ${s.total} steps done`, `${s.accountsClosed} de ${s.accountsTotal} cuentas eliminadas · ${s.doneCount} de ${s.total} pasos hechos`)}</p>
        {groups.map((g) => (
          <div key={g.title} className="mt-5"><h2 className="font-bold">{g.title === EVERYWHERE ? t(EVERYWHERE, 'En todos lados') : g.title}: {es ? STATUS_ES[g.status] : g.status}</h2>
            <ul className="mt-1 text-sm">{g.items.map((st) => <li key={st.id}>{state.done[st.id] ? '☑' : '☐'} {st.label}{state.doneAt?.[st.id] ? ` (${fmt(state.doneAt[st.id])})` : ''}</li>)}</ul>
          </div>
        ))}
        <p className="mt-6 text-xs">{t('Marriage Mode by Upfront Consulting with Tiff & Reco LLC. This report was made on your device and is yours to keep or share.', 'Marriage Mode de Upfront Consulting with Tiff & Reco LLC. Este reporte se hizo en tu dispositivo y es tuyo para guardar o compartir.')}</p>
      </section>
    </div>
    </LangCtx.Provider>
  );
}
