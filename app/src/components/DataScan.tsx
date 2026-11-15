'use client';
import { useState } from 'react';
import { scanFile, type Hit } from '@/lib/scan';
import { track } from '@/lib/track';
import { useT, useLang } from '@/lib/i18n';

type Props = { selected: string[]; toggle: (id: string) => void };

export default function DataScan({ selected, toggle }: Props) {
  const [busy, setBusy] = useState('');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [err, setErr] = useState('');
  const t = useT(); const { lang } = useLang();

  const onFile = async (f?: File) => {
    if (!f) return; setErr(''); setHits(null); setBusy(t('Starting…', 'Empezando…'));
    try { const h = await scanFile(f, setBusy); setHits(h); track('data-scan'); }
    catch (e) {
      const m = (e as Error).message;
      setErr(m === 'too_big' ? t('That file is very large. Download fewer categories (see the steps) and try again.', 'Ese archivo es muy grande. Descarga menos categorías (mira los pasos) e intenta otra vez.') : m === 'unsupported' ? t('Pick the .zip file you downloaded (or a .json, .html, .csv or .txt file).', 'Elige el archivo .zip que descargaste (o un .json, .html, .csv o .txt).') : t('That file could not be read. Try downloading it again.', 'No se pudo leer ese archivo. Intenta descargarlo otra vez.'));
    } finally { setBusy(''); }
  };

  return (
    <div className="glass p-6 md:col-span-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal">{t('Find forgotten accounts', 'Encuentra cuentas olvidadas')}</p>
      <h2 className="mt-1 text-lg font-semibold">{t('Scan your Google or Facebook data download', 'Revisa tu descarga de datos de Google o Facebook')}</h2>
      {lang === 'es' ? <p className="mt-1 text-sm text-ink/65">Tu descarga muestra las apps donde entraste y los sitios que visitaste. Elige el archivo y buscamos sitios de citas <strong>en este dispositivo</strong>; el archivo nunca se sube.</p> : <p className="mt-1 text-sm text-ink/65">Your download lists apps you signed into and sites you visited. Pick the file and we look for dating sites <strong>on this device</strong>; the file is never uploaded.</p>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
        <details className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/[0.07]">
          <summary className="cursor-pointer font-semibold">{t('Get your Facebook download', 'Obtén tu descarga de Facebook')}</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink/70">
            {lang === 'es' ? <>
            <li>En Facebook, abre Configuración y luego Centro de cuentas.</li>
            <li>Toca Tu información y permisos, luego Descargar tu información.</li>
            <li>Elige solo <strong>Apps y sitios web</strong> (muestra las apps donde entraste con Facebook), formato JSON.</li>
            <li>Cuando llegue el correo, descarga el archivo .zip.</li></> : <>
            <li>In Facebook, open Settings, then Accounts Center.</li>
            <li>Tap Your information and permissions, then Download your information.</li>
            <li>Choose only <strong>Apps and websites</strong> (it shows apps you logged into with Facebook), format JSON.</li>
            <li>When the email arrives, download the .zip file.</li></>}
          </ol>
        </details>
        <details className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/[0.07]">
          <summary className="cursor-pointer font-semibold">{t('Get your Google download', 'Obtén tu descarga de Google')}</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink/70">
            {lang === 'es' ? <>
            <li>Ve a takeout.google.com y toca Anular selección.</li>
            <li>Marca <strong>Chrome</strong> y <strong>Mi actividad</strong> (son pequeños). Gmail también sirve pero es muy grande.</li>
            <li>Crea la exportación y descarga el .zip cuando esté listo.</li></> : <>
            <li>Go to takeout.google.com and tap Deselect all.</li>
            <li>Tick <strong>Chrome</strong> and <strong>My Activity</strong> (they're small). Mail works too but is very large.</li>
            <li>Create export, then download the .zip when it's ready.</li></>}
          </ol>
        </details>
      </div>
      <p className="mt-2 text-xs text-ink/50">{t('Menu names can change a little. Look for “Download your information”.', 'Los nombres de los menús pueden cambiar un poco. Busca “Descargar tu información”.')}</p>

      <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center rounded-full bg-lagoon px-5 font-semibold text-night glow-lagoon">
        {t('Choose my download file', 'Elegir mi archivo de descarga')}
        <input type="file" accept=".zip,.json,.html,.htm,.csv,.txt,.mbox" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {busy && <p role="status" className="mt-3 text-sm text-ink/70">{busy}</p>}
      {err && <p role="alert" className="mt-3 text-sm text-coral">{err}</p>}
      {hits && (
        <div className="mt-4 rounded-xl bg-night/60 p-4">
          <p className="font-semibold">{hits.length ? t(`Found ${hits.length} dating ${hits.length === 1 ? 'site' : 'sites'} in your download`, `Encontramos ${hits.length} ${hits.length === 1 ? 'sitio' : 'sitios'} de citas en tu descarga`) : t('No dating sites found in this file. 🎉', 'No hay sitios de citas en este archivo. 🎉')}</p>
          <ul className="mt-3 space-y-2">{hits.map((h) => { const on = selected.includes(h.platformId); return (
            <li key={h.platformId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/[0.03] p-3 ring-1 ring-white/[0.07]">
              <span className="min-w-0"><span className="font-medium">{h.name}</span> <span className="text-xs text-ink/55">· {t('mentioned', 'mencionado')} {h.count}× · {h.files.map((f) => f.split('/').pop()).join(', ')}</span></span>
              <button onClick={() => toggle(h.platformId)} aria-pressed={on} className={`min-h-9 rounded-full px-3 text-xs ring-1 ${on ? 'bg-lagoon/15 ring-lagoon/60' : 'ring-white/15'}`}>{on ? t('✓ In my list', '✓ En mi lista') : t('Add to my apps', 'Agregar a mis apps')}</button>
            </li>); })}</ul>
          {hits.length > 0 && <p className="mt-2 text-xs text-ink/50">{t('A mention doesn\'t always mean an account. Add the ones you recognize; each gets its delete steps.', 'Una mención no siempre significa una cuenta. Agrega las que reconozcas; cada una tendrá sus pasos.')}</p>}
        </div>
      )}
    </div>
  );
}
