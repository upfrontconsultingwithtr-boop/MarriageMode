'use client';
import { useState } from 'react';
import type { AuditState } from '@/lib/audit';
import { useT, useLang, LOCALE } from '@/lib/i18n';
import { track } from '@/lib/track';

// Shrink a photo on the device so it stays small (about 50 KB) and private.
async function shrink(f: File): Promise<string> {
  const img = await createImageBitmap(f);
  const k = Math.min(1, 720 / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.6);
}

// Optional proof for one app: a note and/or a screenshot of the confirmation.
export default function ProofBox({ app, state, setState }: { app: string; state: AuditState; setState: (f: (s: AuditState) => AuditState) => void }) {
  const t = useT(); const { lang } = useLang();
  const p = state.proof?.[app];
  const [open, setOpen] = useState(false); const [note, setNote] = useState(p?.note ?? ''); const [err, setErr] = useState('');
  const save = (patch: { note?: string; photo?: string }) => setState((s) => ({ ...s, proof: { ...(s.proof ?? {}), [app]: { ...(s.proof?.[app] ?? {}), ...patch, at: new Date().toISOString() } } }));
  const remove = () => setState((s) => { const pr = { ...(s.proof ?? {}) }; delete pr[app]; return { ...s, proof: pr }; });
  if (!open && !p) return <button onClick={() => setOpen(true)} className="mt-2 text-sm text-teal underline">{t('+ Keep proof it’s closed (optional)', '+ Guardar prueba de que está cerrada (opcional)')}</button>;
  return (
    <div className="mt-3 rounded-xl bg-night/50 p-3 ring-1 ring-white/[0.07]">
      <p className="text-sm font-semibold">{t('Proof it’s closed', 'Prueba de que está cerrada')} {p && <span className="font-normal text-ink/50">· {new Date(p.at).toLocaleDateString(LOCALE[lang], { month: 'short', day: 'numeric' })}</span>}</p>
      <p className="text-xs text-ink/55">{t('A screenshot of the “account deleted” screen or email, or a note. Saved on your device (and your private sync, if on). Only shared if you choose.', 'Una captura de la pantalla o correo de “cuenta eliminada”, o una nota. Se guarda en tu dispositivo (y tu sincronización privada, si la usas). Solo se comparte si tú quieres.')}</p>
      {p?.photo && <img src={p.photo} alt={t(`Proof for ${app}`, `Prueba de ${app}`)} className="mt-2 max-h-48 rounded-lg ring-1 ring-white/10" />}
      <div className="mt-2 flex flex-wrap gap-2">
        <label htmlFor={`proof-${app}`} className="sr-only">{t('Note', 'Nota')}</label>
        <input id={`proof-${app}`} value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} onBlur={() => note.trim() && save({ note: note.trim() })} placeholder={t('e.g. Deleted Nov 15, confirmation email saved', 'p. ej. Eliminada el 15 nov, correo de confirmación guardado')} className="min-h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-night/60 px-4 text-sm" />
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 text-sm ring-1 ring-white/15">
          {p?.photo ? t('Replace screenshot', 'Cambiar captura') : t('Add screenshot', 'Agregar captura')}
          <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { save({ photo: await shrink(f) }); track('proof-added'); setErr(''); } catch { setErr(t('That picture could not be read. Try a JPG or PNG.', 'No se pudo leer esa imagen. Prueba con JPG o PNG.')); } }} />
        </label>
        {p && <button onClick={() => { remove(); setNote(''); setOpen(false); }} className="min-h-11 rounded-full px-4 text-sm text-ink/60 ring-1 ring-white/10">{t('Remove', 'Quitar')}</button>}
      </div>
      {err && <p role="alert" className="mt-1 text-xs text-coral">{err}</p>}
    </div>
  );
}
