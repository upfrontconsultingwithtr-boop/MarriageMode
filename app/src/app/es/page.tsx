import type { Metadata } from 'next';
import Link from 'next/link';
import Halo from '@/components/Halo';
import Ring from '@/components/Ring';
import Aurora from '@/components/Aurora';
import Marquee from '@/components/Marquee';
import { PLATFORMS } from '@/lib/catalog';
import { BENEFITS, TOOLS } from '@/lib/value';
import { SITE } from '@/lib/base';

export const metadata: Metadata = {
  title: 'Marriage Mode en español: cierra tu etapa de citas, en privado',
  description: 'Una lista gratis y privada para cerrar tus cuentas de citas, cancelar los cobros y detener los correos, para que nada viejo sorprenda a tu relación. De Upfront Consulting with Tiff & Reco LLC.',
  alternates: { canonical: `${SITE}/es/`, languages: { en: `${SITE}/`, es: `${SITE}/es/` } },
  openGraph: { title: 'Marriage Mode en español', description: 'Cierra tu etapa de citas. Por completo. Privado, gratis y a tu ritmo.', locale: 'es_ES' },
};

const faqs = [
  { q: '¿De verdad es gratis?', a: 'Sí. La revisión completa, las guías y la hoja de trabajo son gratis, sin cuenta y sin tarjeta.' },
  { q: '¿Ustedes ven mis respuestas?', a: 'No. La revisión funciona en tu navegador y se guarda solo en tu dispositivo. Solo contamos visitas anónimas, nunca qué apps eliges.' },
  { q: '¿Puedo usarla para revisar a mi pareja?', a: 'No, y es a propósito. Marriage Mode solo funciona con tus propias cuentas, hecho por ti. La confianza se construye eligiendo compartir, no revisando.' },
  { q: '¿Borrar la app cierra mi cuenta?', a: 'Normalmente no. Debes eliminar el perfil dentro de la app o en el sitio web, y cancelar el cobro donde pagaste. La lista cubre cada paso.' },
  { q: '¿La herramienta está en español?', a: 'Sí. El panel completo está en español: tus apps, la limpieza, la pareja y los ajustes. Puedes cambiar el idioma cuando quieras con el botón English / Español.' },
  { q: '¿Cómo funciona el Modo Pareja?', a: 'Cada uno agrega lo que decide compartir, más metas en común. Vive dentro de un enlace privado que se envían. Cualquiera de los dos puede parar cuando quiera.' },
];

const steps = [
  ['1', 'Elige tus apps', `Marca las apps y sitios de citas que alguna vez usaste. Tenemos pasos para ${PLATFORMS.length} y puedes agregar cualquier otra por nombre.`],
  ['2', 'Ciérralas de verdad', 'Para cada una: eliminar el perfil, cancelar el cobro, quitar la app y detener los correos. Te mostramos dónde tocar.'],
  ['3', 'Comparte la página limpia', 'Si quieres, envía a tu pareja solo el resumen que tú eliges. Nada más.'],
];

const quick = [
  ['Eliminar el perfil', 'Entra a la app o al sitio, busca Configuración y luego Eliminar cuenta. Borrar la app del teléfono no cierra la cuenta.'],
  ['Cancelar el cobro', 'iPhone: Ajustes, tu nombre, Suscripciones. Android: Google Play, tu foto, Pagos y suscripciones. Si pagaste en el sitio, cancela allí.'],
  ['Quitar la app', 'Mantén presionado el ícono y elige Eliminar app. Revisa también tus otros dispositivos.'],
  ['Detener los correos', 'Abre un correo de la app y toca "Unsubscribe" (cancelar suscripción) al final del mensaje.'],
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-teal">{children}</p>;
}

export default function Espanol() {
  return (
    <div lang="es">
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.lang='es'" }} />
      <section className="relative isolate overflow-hidden">
        <Aurora className="absolute inset-0 -z-20 h-full w-full" />
        <div className="noise absolute inset-0 -z-10" aria-hidden="true" />
        <div className="grid-bg absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 text-center md:pt-24">
          <span className="rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-ink/80 backdrop-blur">
            <span className="size-1.5 rounded-full bg-lagoon shadow-[0_0_10px_#D9B77E]" /> Gratis · privado · hecho para parejas
          </span>
          <h1 className="rise rise-2 mx-auto mt-7 max-w-5xl text-[clamp(2.6rem,8.5vw,6.5rem)] font-bold leading-[0.95] tracking-[-0.04em]">
            Cierra tu etapa de citas. <span className="text-shimmer">Por completo.</span>
          </h1>
          <p className="rise rise-3 mx-auto mt-7 max-w-2xl text-lg text-ink/75 sm:text-xl">
            Marriage Mode te ayuda a encontrar cada cuenta de citas que abriste y a cerrarla para siempre: perfil, cobros, app y correos. Luego, si quieres, comparte la página limpia con tu pareja.
          </p>
          <div className="rise rise-4 mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/audit/?lang=es" className="glow-mango min-h-12 rounded-full bg-mango px-8 py-4 text-lg font-semibold text-night hover:brightness-110">Empezar mi revisión gratis →</Link>
            <Link href="#como" className="min-h-12 rounded-full border border-white/15 bg-white/5 px-8 py-4 text-lg font-semibold backdrop-blur hover:border-lagoon/60">Cómo funciona</Link>
          </div>
          <p className="mt-5 text-sm text-ink/55"><Link href="/" className="underline hover:text-ink" hrefLang="en">English</Link></p>
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-white/[0.02]">
        <p className="pt-6 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-ink/50">Pasos para {PLATFORMS.length} apps y sitios de citas</p>
        <Marquee />
      </section>

      <section id="como" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-24">
        <Eyebrow>Cómo funciona</Eyebrow>
        <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Tres pasos para una página limpia</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3 [&>*]:min-w-0">
          {steps.map(([n, t, d]) => (
            <div key={n} className="glass p-6">
              <span className="grid size-10 place-items-center rounded-full bg-lagoon font-bold text-night shadow-[0_0_16px_#D9B77E]">{n}</span>
              <p className="mt-4 text-xl font-semibold">{t}</p>
              <p className="mt-2 text-ink/70">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VALUE: benefits */}
      <section id="valor" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-24">
        <Eyebrow>Por qué importa</Eyebrow>
        <h2 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">Lo que ganas con una página limpia</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 [&>*]:min-w-0">
          {BENEFITS.map((b) => (
            <div key={b.icon} className="glass p-6">
              <span className="grid size-12 place-items-center rounded-2xl bg-lagoon/15 text-2xl ring-1 ring-lagoon/40" aria-hidden="true">{b.icon}</span>
              <h3 className="mt-4 text-xl font-semibold">{b.es.t}</h3>
              <p className="mt-2 text-ink/70">{b.es.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VALUE: tools */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <Eyebrow>Todo incluido, gratis</Eyebrow>
        <h2 className="mt-3 max-w-3xl text-3xl font-bold sm:text-4xl">Cada herramienta que necesitas, en un lugar privado</h2>
        <p className="mt-3 max-w-2xl text-ink/70">Cada una hace un trabajo real, para que nada viejo quede atrás.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
          {TOOLS.map((x) => (
            <div key={x.id} className="glass flex gap-4 p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-lagoon text-lg font-bold text-night shadow-[0_0_16px_-4px_#D9B77E]" aria-hidden="true">{x.icon}</span>
              <div><h3 className="font-semibold">{x.es.t}</h3><p className="mt-1 text-sm text-ink/70">{x.es.v}</p></div>
            </div>
          ))}
        </div>
        <Link href="/audit/?lang=es" className="glow-mango mt-8 inline-block rounded-full bg-mango px-8 py-4 text-lg font-semibold text-night hover:brightness-110">Empezar mi revisión gratis →</Link>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-24">
        <div className="grid gap-6 md:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
          <div className="glass p-7">
            <Eyebrow>Guía rápida</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold">Lo que cierra una cuenta de verdad</h2>
            <ol className="mt-6 space-y-4">
              {quick.map(([t, d], i) => (
                <li key={t} className="flex gap-3"><span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-semibold text-lagoon">{i + 1}</span><div><p className="font-semibold">{t}</p><p className="text-sm text-ink/70">{d}</p></div></li>
              ))}
            </ol>
          </div>
          <div className="halo-border"><div className="flex h-full flex-col items-center justify-center gap-4 rounded-[1.75rem] bg-deep/95 p-7 text-center">
            <Ring value={100} size={150} />
            <p className="text-2xl font-bold">Página limpia.</p>
            <p className="max-w-xs text-ink/65">Perfiles eliminados, cobros cancelados, apps fuera, correos detenidos. Nada viejo en el camino.</p>
          </div></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-24">
        <div className="glass grid gap-6 p-7 sm:p-10 md:grid-cols-[1fr_1.4fr]">
          <div><Eyebrow>Basado en confianza</Eyebrow><h2 className="mt-3 text-3xl font-bold">Una herramienta para ti. Nunca para revisar a alguien.</h2></div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[['Solo tus cuentas', 'Funciona solo con cuentas tuyas, hecho por ti.'], ['Nada se sube', 'Tu revisión vive en tu dispositivo.'], ['Tú eliges qué compartir', 'Tu pareja ve solo el resumen que envías.'], ['Sal cuando quieras', 'Borra todo con un toque.']].map(([t, d]) => (
              <li key={t} className="flex gap-3"><span className="mt-1 text-lagoon">✓</span><div><p className="font-semibold">{t}</p><p className="text-sm text-ink/65">{d}</p></div></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-24">
        <div className="glass grid items-center gap-8 p-7 sm:p-10 md:grid-cols-[auto_1fr]">
          <div className="relative mx-auto size-36 shrink-0" aria-hidden="true"><Halo className="h-full w-full" /></div>
          <div>
            <Eyebrow>Quiénes lo hicieron</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold">Hecho por una pareja, para parejas</h2>
            <p className="mt-3 text-ink/75">Marriage Mode viene de Tiffany y Reco, de Upfront Consulting with Tiff &amp; Reco LLC. La fe, la confianza y la familia son la base de su relación y de este producto. Construyeron la herramienta que les hubiera gustado tener: privada, amable y de tu lado.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pt-24">
        <Eyebrow>Preguntas</Eyebrow>
        <h2 className="mt-3 text-3xl font-bold">Bueno saber</h2>
        <div className="mt-8 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="glass group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{f.q}<span className="text-teal transition group-open:rotate-45">+</span></summary>
              <p className="mt-3 text-ink/70">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="relative isolate mx-auto mt-28 max-w-6xl overflow-hidden rounded-[2.5rem] px-4 py-24 text-center">
        <Aurora className="absolute inset-0 -z-10 h-full w-full" />
        <h2 className="text-4xl font-bold sm:text-6xl">Veinte minutos. <span className="text-shimmer">Nada pendiente.</span></h2>
        <Link href="/audit/?lang=es" className="glow-mango mt-9 inline-block rounded-full bg-mango px-9 py-4 text-lg font-semibold text-night hover:brightness-110">Empezar mi revisión gratis →</Link>
        <p className="mt-6 text-sm text-ink/55">Marriage Mode de Upfront Consulting with Tiff &amp; Reco LLC</p>
      </section>
    </div>
  );
}
