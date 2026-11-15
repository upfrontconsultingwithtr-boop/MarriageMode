'use client';
import { useEffect, useRef, useState } from 'react';
import { cloudEnabled, signOut } from '@/lib/cloud';
import { loadPrefs, savePrefs, type Prefs } from '@/lib/prefs';
import * as P from '@/lib/partner';
import { useT, useLang } from '@/lib/i18n';

type Props = { signedInEmail: string | null; openSignIn: () => void; clearDevice: () => void };

function Toggle({ id, label, sub, on, set }: { id: string; label: string; sub?: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 py-2">
      <label htmlFor={id} className="cursor-pointer"><span className="font-medium">{label}</span>{sub && <span className="block text-sm text-ink/55">{sub}</span>}</label>
      <button id={id} role="switch" aria-checked={on} onClick={() => set(!on)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-lagoon' : 'bg-white/15'}`}>
        <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}

function Choice<T extends string>({ label, value, options, set }: { label: string; value: T; options: [T, string][]; set: (v: T) => void }) {
  return (
    <fieldset className="py-2"><legend className="font-medium">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">{options.map(([v, l]) => (
        <button key={v} aria-pressed={value === v} onClick={() => set(v)} className={`min-h-11 rounded-full px-4 text-sm ring-1 ${value === v ? 'bg-lagoon/15 ring-lagoon/70 font-semibold' : 'ring-white/15'}`}>{l}</button>))}</div>
    </fieldset>
  );
}

export default function SettingsTab({ signedInEmail, openSignIn, clearDevice }: Props) {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<P.Profile | null>(null);
  const [name, setName] = useState('');
  const [stage, setStage] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState('');
  const [exportUrl, setExportUrl] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const t = useT(); const { lang, setLang } = useLang();

  useEffect(() => {
    if (!signedInEmail) return;
    (async () => {
      const id = await P.me(); setUid(id); if (!id) return;
      const pr = (await P.profiles([id]))[id] ?? { user_id: id, display_name: null, avatar_path: null, relationship_stage: null };
      setProfile(pr); setName(pr.display_name ?? ''); setStage(pr.relationship_stage ?? '');
    })();
  }, [signedInEmail]);

  const update = (patch: Partial<Prefs>) => { const p = { ...prefs, ...patch, lang: patch.lang ?? loadPrefs().lang }; setPrefs(p); savePrefs(p); if (uid) void P.savePrefsToAccount(uid, p); };
  const saveProfile = async () => { if (!uid) return; const ok = await P.saveProfile(uid, { display_name: name.trim().slice(0, 40) || null, relationship_stage: stage || null }); setMsg(ok ? t('Profile saved.', 'Perfil guardado.') : t('Could not save. Try again.', 'No se pudo guardar. Intenta otra vez.')); };
  const onPhoto = async (f?: File) => { if (!uid || !f) return; setMsg(t('Uploading photo…', 'Subiendo foto…')); const path = await P.uploadAvatar(uid, f); if (path) { setProfile((p) => (p ? { ...p, avatar_path: path } : p)); setMsg(t('Photo updated.', 'Foto actualizada.')); } else setMsg(t('Could not upload that photo. Try a JPG or PNG.', 'No se pudo subir esa foto. Prueba con JPG o PNG.')); };
  const doExport = async () => { if (!uid) return; const data = await P.exportMyData(uid); setExportUrl(URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))); };
  const doDelete = async () => { if (confirmDelete !== 'DELETE') return; const ok = await P.deleteMyAccount(); setMsg(ok ? t('Your account and synced data are deleted.', 'Tu cuenta y tus datos sincronizados se eliminaron.') : t('Could not delete. Try again.', 'No se pudo eliminar. Intenta otra vez.')); if (ok) { setUid(null); setProfile(null); } };
  const photo = P.avatarUrl(profile?.avatar_path ?? null);

  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
      {msg && <p role="status" className="rounded-xl bg-lagoon/10 p-3 text-sm ring-1 ring-lagoon/30 lg:col-span-2">{msg}</p>}

      <div className="glass p-6">
        <h2 className="text-lg font-semibold">{t('Profile', 'Perfil')}</h2>
        {!signedInEmail ? (
          <><p className="mt-1 text-sm text-ink/60">{t('A profile (name and photo your partner sees) needs the free sign-in.', 'Un perfil (nombre y foto que ve tu pareja) requiere entrar gratis.')}</p>
            {cloudEnabled && <button onClick={openSignIn} className="glow-mango mt-3 min-h-11 rounded-full bg-mango px-5 font-semibold text-night">{t('Sign in', 'Entrar')}</button>}</>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-4">
              {photo ? <img src={photo} alt={t('Your profile photo', 'Tu foto de perfil')} width={72} height={72} className="size-[72px] rounded-full object-cover ring-2 ring-lagoon/60" />
                : <span className="grid size-[72px] place-items-center rounded-full bg-lagoon/15 text-2xl font-semibold text-teal ring-2 ring-lagoon/40">{(name || signedInEmail).charAt(0).toUpperCase()}</span>}
              <div>
                <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} id="photo" />
                <button onClick={() => file.current?.click()} className="min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15">{photo ? t('Change photo', 'Cambiar foto') : t('Add a photo', 'Agregar una foto')}</button>
                <p className="mt-1 text-xs text-ink/50">{t('Only you and your linked partner see it.', 'Solo tú y tu pareja conectada la ven.')}</p>
              </div>
            </div>
            <label htmlFor="pf-name" className="block text-sm text-ink/70">{t('Name your partner sees', 'Nombre que ve tu pareja')}</label>
            <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} className="min-h-11 w-full rounded-full border border-white/15 bg-night/60 px-4" />
            <label htmlFor="pf-stage" className="block text-sm text-ink/70">{t('Where are you?', '¿En qué etapa están?')}</label>
            <select id="pf-stage" value={stage} onChange={(e) => setStage(e.target.value)} className="min-h-11 w-full rounded-full border border-white/15 bg-night/60 px-4">
              <option value="">{t('Choose…', 'Elige…')}</option><option value="exclusive">{t('Newly exclusive', 'Recién exclusivos')}</option><option value="engaged">{t('Engaged', 'Comprometidos')}</option><option value="married">{t('Married', 'Casados')}</option><option value="rebuilding">{t('Rebuilding trust', 'Reconstruyendo la confianza')}</option><option value="other">{t('Other', 'Otra')}</option>
            </select>
            <button onClick={saveProfile} className="glow-lagoon min-h-11 rounded-full bg-lagoon px-5 font-semibold text-night">{t('Save profile', 'Guardar perfil')}</button>
            <p className="text-xs text-ink/50">{t('Signed in as', 'Sesión iniciada como')} {signedInEmail}</p>
          </div>
        )}
      </div>

      <div className="glass p-6">
        <h2 className="text-lg font-semibold">{t('Appearance', 'Apariencia')}</h2>
        <Choice label={t('Language', 'Idioma')} value={lang} options={[['en', 'English'], ['es', 'Español']]} set={(v) => { setLang(v); if (uid) void P.savePrefsToAccount(uid, { ...prefs, lang: v }); }} />
        <Choice label={t('Theme', 'Tema')} value={prefs.theme} options={[['dark', t('Dark', 'Oscuro')], ['light', t('Light', 'Claro')]]} set={(v) => update({ theme: v })} />
        <Choice label={t('Text size', 'Tamaño del texto')} value={prefs.textSize} options={[['s', t('Small', 'Pequeño')], ['m', t('Default', 'Normal')], ['l', t('Large', 'Grande')], ['xl', t('Extra large', 'Muy grande')]]} set={(v) => update({ textSize: v })} />
      </div>

      <div className="glass p-6">
        <h2 className="text-lg font-semibold">{t('Accessibility', 'Accesibilidad')}</h2>
        <Toggle id="a-motion" label={t('Reduce motion', 'Reducir movimiento')} sub={t('Turns off glowing animations and transitions.', 'Apaga las animaciones y transiciones.')} on={prefs.reduceMotion} set={(v) => update({ reduceMotion: v })} />
        <Toggle id="a-contrast" label={t('High contrast', 'Alto contraste')} sub={t('Brighter text and stronger edges.', 'Texto más brillante y bordes más marcados.')} on={prefs.highContrast} set={(v) => update({ highContrast: v })} />
        <Toggle id="a-links" label={t('Underline all links', 'Subrayar todos los enlaces')} on={prefs.underlineLinks} set={(v) => update({ underlineLinks: v })} />
        <p className="mt-2 text-xs text-ink/50">{t('Text size is under Appearance. Your phone\'s screen reader and zoom work everywhere too.', 'El tamaño del texto está en Apariencia. El lector de pantalla y el zoom de tu teléfono también funcionan en todo.')}</p>
      </div>

      <div className="glass p-6">
        <h2 className="text-lg font-semibold">{t('Privacy & security', 'Privacidad y seguridad')}</h2>
        <Toggle id="p-analytics" label={t('Count my visits anonymously', 'Contar mis visitas de forma anónima')} sub={t('Helps us improve. Never includes which apps you pick or anything you type.', 'Nos ayuda a mejorar. Nunca incluye qué apps eliges ni lo que escribes.')} on={prefs.analytics} set={(v) => update({ analytics: v })} />
        <ul className="mt-2 space-y-1 text-sm text-ink/65">
          <li>✓ {t('No passwords: sign-in uses a one-time email link.', 'Sin contraseñas: se entra con un enlace de un solo uso por correo.')}</li>
          <li>✓ {t('Your checklist and messages are visible only to you (and your partner, for what you share).', 'Tu lista y tus mensajes solo los ves tú (y tu pareja, en lo que compartes).')}</li>
          <li>✓ {t('We never sell data or show ads.', 'Nunca vendemos datos ni mostramos anuncios.')}</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={clearDevice} className="min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15">{t('Clear data on this device', 'Borrar datos de este dispositivo')}</button>
          {signedInEmail && <>
            <button onClick={doExport} className="min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15">{t('Download my data', 'Descargar mis datos')}</button>
            <button onClick={() => void signOut()} className="min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15">{t('Sign out', 'Cerrar sesión')}</button>
          </>}
        </div>
        {exportUrl && <a href={exportUrl} download="marriage-mode-my-data.json" className="mt-2 inline-block text-sm text-teal underline">{t('Save my data file', 'Guardar mi archivo de datos')}</a>}
        {signedInEmail && (
          <div className="mt-5 rounded-xl bg-coral/10 p-4 ring-1 ring-coral/30">
            <p className="font-semibold text-coral">{t('Delete my account', 'Eliminar mi cuenta')}</p>
            <p className="mt-1 text-sm text-ink/65">{t('Deletes your account, synced checklist, profile and partner space for good. Type DELETE to confirm.', 'Elimina para siempre tu cuenta, lista sincronizada, perfil y espacio de pareja. Escribe DELETE para confirmar.')}</p>
            <div className="mt-2 flex gap-2">
              <label htmlFor="del" className="sr-only">{t('Type DELETE', 'Escribe DELETE')}</label>
              <input id="del" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} className="min-h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-night/60 px-4" />
              <button onClick={doDelete} disabled={confirmDelete !== 'DELETE'} className="min-h-11 rounded-full bg-coral/25 px-4 text-sm font-semibold text-coral disabled:opacity-40">{t('Delete', 'Eliminar')}</button>
            </div>
          </div>
        )}
        <p className="mt-4 text-sm"><a href="../privacy/" className="text-teal underline">{t('Privacy', 'Privacidad')}</a> · <a href="../safety/" className="text-teal underline">{t('Safety & consent', 'Seguridad y consentimiento')}</a></p>
      </div>
    </section>
  );
}
