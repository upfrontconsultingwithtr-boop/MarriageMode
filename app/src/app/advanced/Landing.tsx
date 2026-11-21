'use client';
import { useEffect, useRef, useState } from 'react';
import { LESSONS } from '@/lib/adv/learn';
import { LANG_KEY } from '@/lib/adv/store';
import { BASE } from '@/lib/base';
import { SweepSim, FeedSim } from './Sims';
import Orbits from './Orbits';

type T = (en: string, es: string) => string;
// Sign-up / sign-in lives on the separate customer portal site when it is configured.
const START = process.env.NEXT_PUBLIC_PORTAL_URL ? `${process.env.NEXT_PUBLIC_PORTAL_URL}portal/` : './app/';
const I = {
  learn: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20',
  sweep: 'M11 4a7 7 0 1 0 4.95 11.95L21 21M8 11h6M11 8v6',
  prove: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6zM8.5 12l2.5 2.5L16 9.5',
  lock: 'M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14',
};
const Icon = ({ d, className = 'size-5' }: { d: string; className?: string }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d={d} /></svg>;

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const els = ref.current?.querySelectorAll('.adv-reveal') ?? [];
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el)); return () => io.disconnect();
  }, []);
  return ref;
}

/** A live-looking app preview built from real UI, filled with clearly labelled demo data. */
function Device({ t }: { t: T }) {
  const [p, setP] = useState(0);
  useEffect(() => { const id = setTimeout(() => setP(75), 400); return () => clearTimeout(id); }, []);
  return (
    <div className="adv-device relative mx-auto w-full max-w-[380px]">
      <div className="adv-glass adv-edge rounded-[2.4rem] p-3">
        <div className="rounded-[1.9rem] bg-night/80 p-5 ring-1 ring-white/5">
          <div className="flex items-center justify-between text-[11px] text-ink/50"><span>Marriage Mode</span><span className="rounded-full bg-lagoon/15 px-2 py-0.5 text-lagoon">{t('Demo preview', 'Vista de prueba')}</span></div>
          <div className="mt-4 flex items-center gap-4">
            <div className="adv-ring grid size-24 shrink-0 place-items-center" style={{ ['--p' as string]: p } as React.CSSProperties}><div className="grid size-[84px] place-items-center rounded-full bg-night"><span className="font-display text-3xl font-semibold">{p}</span></div></div>
            <div><p className="text-xs text-ink/55">{t('Honest score', 'Puntuación honesta')}</p><p className="font-display text-lg leading-tight">{t('3 of 4 accounts', '3 de 4 cuentas')}<br />{t('verified closed', 'cerradas y verificadas')}</p></div>
          </div>
          <div className="mt-5 space-y-2">
            {[[t('Liked 12 posts in 2 weeks', '12 me gusta en 2 semanas'), 'Instagram · close friend', true], [t('Risque group you joined', 'Grupo riesgoso al que te uniste'), 'Facebook · group', true], [t('Past dating match', 'Match de citas anterior'), 'Snapchat · friend', false]].map(([a, b, r], i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-2xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/[0.06]">
                <div className="min-w-0"><p className="truncate text-[13px]">{a as string}</p><p className="text-[11px] text-ink/45">{b as string}</p></div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${r ? 'bg-mango/15 text-mango' : 'bg-white/10 text-ink/70'}`}>{r ? t('Risque', 'Riesgoso') : t('Ex / match', 'Ex / match')}</span>
              </div>))}
          </div>
          <div className="mt-4 rounded-2xl bg-mango/10 p-3 ring-1 ring-mango/30">
            <div className="flex items-center justify-between text-[12px]"><span className="font-semibold">{t('Batch 1 · 5 items', 'Grupo 1 · 5 elementos')}</span><span className="rounded-full bg-[#4a1630] px-2 py-0.5 text-[10px] text-white">{t('Guided', 'Guiado')}</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-mango to-lagoon transition-all duration-[1600ms]" style={{ width: `${p * 0.8}%` }} /></div>
          </div>
        </div>
      </div>
      <div className="adv-glass absolute -left-10 bottom-36 hidden rounded-2xl px-3 py-2 text-xs sm:block float"><span className="text-palm">●</span> {t('Read on your device', 'Leído en tu dispositivo')}</div>
      <div className="adv-glass absolute -right-6 bottom-16 hidden rounded-2xl px-3 py-2 text-xs sm:block float float-2">🔒 {t('Nothing uploaded', 'No se sube nada')}</div>
    </div>
  );
}

export default function Landing() {
  const [es, setEs] = useState(false); const root = useReveal();
  useEffect(() => { let l: string | null = null; try { l = localStorage.getItem(LANG_KEY); } catch { /* blocked */ } setEs((l ?? navigator.language).startsWith('es')); }, []);
  const pick = (v: boolean) => { setEs(v); try { localStorage.setItem(LANG_KEY, v ? 'es' : 'en'); } catch { /* ignore */ } document.documentElement.lang = v ? 'es' : 'en'; };
  const t: T = (en, sp) => (es ? sp : en);
  const spot = (e: React.MouseEvent<HTMLElement>) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`); e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`); };
  const tile = 'adv-reveal adv-spot adv-edge rounded-[1.75rem] bg-white/[0.03] p-6 ring-1 ring-white/[0.07] backdrop-blur-xl sm:p-7';

  return (
    <div ref={root} className="relative overflow-hidden">
      {/* HERO */}
      <section className="relative isolate">
        <div className="adv-aurora" aria-hidden="true"><span /><span /><span /></div>
        <div className="grid-bg absolute inset-0 -z-10" aria-hidden="true" />
        <Orbits />
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex justify-end pt-4"><div role="group" aria-label="Language / Idioma" className="adv-glass flex rounded-full p-1">{[false, true].map((v) => <button key={String(v)} onClick={() => pick(v)} aria-pressed={es === v} className={`min-h-10 min-w-12 rounded-full px-3 text-sm transition ${es === v ? 'bg-mango font-semibold text-night' : 'text-ink/70 hover:text-ink'}`}>{v ? 'ES' : 'EN'}</button>)}</div></div>
          <div className="grid items-center gap-14 pb-24 pt-10 lg:grid-cols-[1.15fr_1fr] lg:pt-16">
            <div className="rise text-center lg:text-left">
              <span className="adv-glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide text-ink/80"><span className="size-1.5 rounded-full bg-mango shadow-[0_0_12px_rgb(232_164_169)]" />{t('Free for every couple · English & Español', 'Gratis para cada pareja · Español e inglés')}</span>
              <h1 className="mt-6 font-display text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-6xl xl:text-7xl">
                {t('End the dating era. Clean the feeds.', 'Cierra la etapa de citas. Limpia los feeds.')} <span className="adv-gradient-text">{t('Prove it - together.', 'Demuéstralo - juntos.')}</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink/70 lg:mx-0">{t('Marriage Mode closes old dating accounts, cleans up your own social media, and gives you both proof it is done. Privately, on your own device.', 'Marriage Mode cierra cuentas de citas viejas, limpia tus propias redes y les da a los dos la prueba de que está hecho. En privado, en tu propio dispositivo.')}</p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <a href={START} className="btn-press group inline-flex min-h-13 items-center gap-2 rounded-full bg-mango px-8 py-3.5 text-base font-semibold text-night shadow-[0_18px_60px_-12px_rgb(232_164_169/.85)] hover:brightness-110">{t('Start free', 'Empezar gratis')} <span className="transition group-hover:translate-x-0.5">→</span></a>
                <a href="./solo/" className="btn-press adv-glass inline-flex min-h-13 items-center rounded-full px-6 py-3.5 text-base text-ink/90 hover:text-ink">{t('Partner won’t join? Solo Search', '¿Tu pareja no participa? Búsqueda Solo')}</a>
              </div>
              <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-ink/55 lg:justify-start">{[t('No sign-up', 'Sin registro'), t('Nothing uploaded', 'No se sube nada'), t('Mutual by choice', 'Mutuo por elección')].map((x) => <li key={x} className="flex items-center gap-2"><span className="text-palm">✓</span>{x}</li>)}</ul>
            </div>
            <div className="rise rise-3"><Device t={t} /></div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        {/* HOW IT WORKS */}
        <section aria-labelledby="how" className="py-20">
          <p className="adv-reveal text-center text-xs font-semibold uppercase tracking-[0.25em] text-mango">{t('How it works', 'Cómo funciona')}</p>
          <h2 id="how" className="adv-reveal mx-auto mt-3 max-w-2xl text-center font-display text-4xl font-semibold tracking-tight sm:text-5xl">{t('Three steps. One clean slate.', 'Tres pasos. Una página en blanco.')}</h2>
          <ol className="relative mt-14 grid gap-5 md:grid-cols-3">
            <div aria-hidden="true" className="absolute left-[16%] right-[16%] top-9 hidden h-px bg-gradient-to-r from-transparent via-mango/40 to-transparent md:block" />
            {[[I.learn, t('Learn', 'Aprender'), t('Six short lessons on how feeds, temptation and the attention algorithm strain a relationship.', 'Seis lecciones cortas sobre cómo los feeds, la tentación y el algoritmo tensan una relación.')],
              [I.sweep, t('Sweep and review', 'Revisar'), t('Your own social, email and device exports, read on your device. Every flag shows why and where it came from.', 'Tus propias exportaciones de redes, correo y dispositivo, leídas en tu dispositivo. Cada marca muestra por qué y de dónde salió.')],
              [I.prove, t('Remove and prove it together', 'Quitar y demostrarlo juntos'), t('A submit-ready queue, verified-closed dates, and a report you share only the way you choose.', 'Una cola lista, fechas de cierre verificadas y un reporte que compartes solo como tú elijas.')]].map(([ic, h, p], i) => (
              <li key={i} onMouseMove={spot} className={`${tile} text-center`} style={{ transitionDelay: `${i * 90}ms` }}>
                <span className="adv-glass relative mx-auto grid size-[72px] place-items-center rounded-2xl text-mango"><Icon d={ic} className="size-7" /><span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-mango text-xs font-bold text-night">{i + 1}</span></span>
                <h3 className="mt-6 font-display text-2xl font-semibold">{h}</h3><p className="mt-2 text-ink/65">{p}</p></li>))}
          </ol>
        </section>

        {/* LIVE SIMULATOR */}
        <section aria-labelledby="try" className="py-10">
          <h2 id="try" className="adv-reveal text-center font-display text-4xl font-semibold tracking-tight sm:text-5xl">{t('See it work before you start', 'Mírala funcionar antes de empezar')}</h2>
          <div className="adv-reveal mt-10"><SweepSim t={t} es={es} /></div>
        </section>

        {/* BENTO: what is inside */}
        <section aria-labelledby="inside" className="py-16">
          <h2 id="inside" className="adv-reveal text-center font-display text-4xl font-semibold tracking-tight sm:text-5xl">{t('Everything a clean start needs', 'Todo lo que un nuevo comienzo necesita')}</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-6">
            <article onMouseMove={spot} className={`${tile} md:col-span-4`}>
              <p className="text-sm text-mango">{t('The Social Sweep', 'La Revisión social')}</p><h3 className="mt-1 font-display text-2xl font-semibold">{t('Nine platforms, email and your phone. Twelve categories.', 'Nueve plataformas, correo y tu teléfono. Doce categorías.')}</h3>
              <div className="mt-5 flex flex-wrap gap-2">{(es ? ['Amistades', 'Seguidores', 'Interacciones', 'Publicaciones', 'Me gusta', 'Contactos', 'Llamadas', 'Mensajes', 'Correo', 'Cuentas de citas', 'Quién vio tu perfil', 'Riesgoso'] : ['Friends', 'Followers', 'Interactions', 'Posts', 'Reactions', 'Contacts', 'Calls', 'Texts', 'Email', 'Dating accounts', 'Profile viewers', 'Risque']).map((c, i) => <span key={c} className={`rounded-full px-3 py-1 text-sm ring-1 ${i === 11 ? 'bg-mango/15 text-mango ring-mango/40' : 'ring-white/12 text-ink/75'}`}>{c}</span>)}</div>
              <p className="mt-5 text-sm text-ink/55">Instagram · Facebook · Threads · TikTok · Snapchat · X · YouTube · LinkedIn · Reddit</p></article>
            <article onMouseMove={spot} className={`${tile} md:col-span-2`}><Icon d={I.lock} className="size-8 text-lagoon" /><h3 className="mt-4 font-display text-2xl font-semibold">{t('Read on your device', 'Leído en tu dispositivo')}</h3><p className="mt-2 text-ink/65">{t('Exports are parsed in your browser. No uploads, no logins, no access to anyone else’s account.', 'Las exportaciones se leen en tu navegador. Sin subir nada, sin iniciar sesión, sin acceso a cuentas ajenas.')}</p></article>
            <article onMouseMove={spot} className={`${tile} md:col-span-2`}><Icon d={I.trash} className="size-8 text-mango" /><h3 className="mt-4 font-display text-2xl font-semibold">{t('Submit-ready queue', 'Cola lista para enviar')}</h3><p className="mt-2 text-ink/65">{t('We prepare every removal and deep-link the exact screen. You tap the platform’s own button, five at a time.', 'Preparamos cada paso y abrimos la pantalla exacta. Tú tocas el botón de la plataforma, de cinco en cinco.')}</p>
              <div className="mt-4 flex gap-1.5">{['Guided', 'Guided', 'Manual'].map((x, i) => <span key={i} className="rounded-full bg-[#4a1630] px-2.5 py-0.5 text-xs text-white">{x === 'Guided' ? t('Guided', 'Guiado') : t('Manual', 'Manual')}</span>)}</div></article>
            <article onMouseMove={spot} className={`${tile} md:col-span-2`}><Icon d={I.eye} className="size-8 text-violet" /><h3 className="mt-4 font-display text-2xl font-semibold">{t('Access levels', 'Niveles de acceso')}</h3><p className="mt-2 text-ink/65">{t('See who can view your stories, posts and location, most access first. Unknown is always shown as unknown.', 'Mira quién puede ver tus historias, publicaciones y ubicación, más acceso primero. Lo desconocido siempre se muestra como desconocido.')}</p></article>
            <article onMouseMove={spot} className={`${tile} flex items-center gap-5 md:col-span-2`}><video src={`${BASE}/coach/mia-idle.mp4`} poster={`${BASE}/coach/mia-poster.jpg`} muted loop playsInline autoPlay preload="metadata" aria-hidden="true" className="h-32 w-24 shrink-0 rounded-2xl object-cover ring-1 ring-mango/30" /><div><h3 className="font-display text-2xl font-semibold">Mia</h3><p className="mt-1 text-ink/65">{t('A coach who knows your progress and always gives one next step. Voice or text.', 'Una coach que conoce tu progreso y siempre te da un siguiente paso. Voz o texto.')}</p></div></article>
            <article onMouseMove={spot} className={`${tile} md:col-span-3`}><Icon d={I.prove} className="size-8 text-palm" /><h3 className="mt-4 font-display text-2xl font-semibold">{t('Verified proof, shared by choice', 'Prueba verificada, compartida por elección')}</h3><p className="mt-2 text-ink/65">{t('An account counts as closed only when all four steps are done. Your Clean Slate report shares only the sections you switch on.', 'Una cuenta cuenta como cerrada solo cuando los cuatro pasos están hechos. Tu reporte comparte solo las secciones que actives.')}</p></article>
            <article onMouseMove={spot} className={`${tile} md:col-span-3`}><Icon d={I.heart} className="size-8 text-mango" /><h3 className="mt-4 font-display text-2xl font-semibold">{t('Human, AI or Hybrid support', 'Apoyo humano, IA o híbrido')}</h3><p className="mt-2 text-ink/65">{t('Choose how you want help. Your choice follows you through lessons, Mia and your report.', 'Elige cómo quieres ayuda. Tu elección te acompaña en las lecciones, con Mia y en tu reporte.')}</p></article>
          </div>
        </section>

        {/* WHY */}
        <section aria-labelledby="why" className="py-16">
          <p className="adv-reveal text-center text-xs font-semibold uppercase tracking-[0.25em] text-mango">{t('Learn', 'Aprender')}</p>
          <h2 id="why" className="adv-reveal mx-auto mt-3 max-w-3xl text-center font-display text-4xl font-semibold tracking-tight sm:text-5xl">{t('Why social media strains a relationship', 'Por qué las redes sociales tensan una relación')}</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{LESSONS.map((l, i) => (
            <article key={l.id} onMouseMove={spot} className={tile} style={{ transitionDelay: `${(i % 3) * 80}ms` }}><span className="font-display text-sm text-lagoon">0{i + 1}</span><h3 className="mt-2 font-display text-xl font-semibold">{l.title[es ? 1 : 0]}</h3><p className="mt-2 line-clamp-4 text-ink/65">{l.body[es ? 1 : 0][0]}</p></article>))}</div>
        </section>

        <section aria-label={t('Feed simulator', 'Simulador de feed')} className="pb-10"><div className="adv-reveal"><FeedSim t={t} es={es} /></div></section>

        {/* TRUST */}
        <section aria-labelledby="trust" className="py-16">
          <div className="adv-reveal adv-edge adv-glass relative overflow-hidden rounded-[2.25rem] p-8 sm:p-12">
            <div aria-hidden="true" className="absolute -right-24 -top-24 size-80 rounded-full bg-mango/20 blur-[90px]" />
            <h2 id="trust" className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{t('Trust and privacy promises', 'Promesas de confianza y privacidad')}</h2>
            <ul className="mt-10 grid gap-x-10 gap-y-7 md:grid-cols-2">{[
              [t('On-device parsing', 'Lectura en tu dispositivo'), t('Your exports are read in your browser. Nothing is uploaded to us.', 'Tus exportaciones se leen en tu navegador. No se nos sube nada.')],
              [t('Mutual by choice', 'Mutuo por elección'), t('Each partner opts in on their own device and shares only the sections they switch on.', 'Cada persona participa desde su dispositivo y comparte solo lo que activa.')],
              [t('No secret checking of a partner', 'Nada de revisar a tu pareja en secreto'), t('No screen lets one partner see the other’s data without their own opt-in.', 'Ninguna pantalla permite ver los datos de la otra persona sin su consentimiento.')],
              [t('Results go to your partner only as disclosed', 'Los resultados van a tu pareja solo como se indicó'), t('You see exactly what will be sent. Nothing sends without your confirm tap.', 'Ves exactamente lo que se enviará. Nada se envía sin tu confirmación.')],
              [t('Clear data at any time', 'Borra tus datos cuando quieras'), t('Type CLEAR in Settings and everything on the device is gone.', 'Escribe CLEAR en Ajustes y todo desaparece del dispositivo.')],
              [t('Free on purpose', 'Gratis a propósito'), t('No paywall, no checkout, no sign-up for the core cleanup.', 'Sin muro de pago, sin cobro y sin registro para la limpieza principal.')],
            ].map(([h, p]) => <li key={h} className="flex gap-4"><span className="adv-glass grid size-10 shrink-0 place-items-center rounded-xl text-mango"><Icon d={I.lock} /></span><span><strong className="block text-lg">{h}</strong><span className="text-ink/65">{p}</span></span></li>)}</ul>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <h2 className="adv-reveal font-display text-4xl font-semibold tracking-tight sm:text-6xl">{t('Start your clean slate', 'Empieza tu página en blanco')} <span className="adv-gradient-text">{t('today.', 'hoy.')}</span></h2>
          <p className="adv-reveal mx-auto mt-4 max-w-lg text-ink/65">{t('One minute to start. Free, private and in your language.', 'Un minuto para empezar. Gratis, privado y en tu idioma.')}</p>
          <a href={START} className="adv-reveal btn-press mt-8 inline-flex min-h-13 items-center gap-2 rounded-full bg-mango px-9 py-4 text-lg font-semibold text-night shadow-[0_18px_60px_-12px_rgb(232_164_169/.85)] hover:brightness-110">{t('Start free', 'Empezar gratis')} →</a>
        </section>
      </div>
    </div>
  );
}
