'use client';
import { useEffect, useState } from 'react';
import type { AuditState } from '@/lib/audit';
import { dueDates, enablePush, disablePush, syncPush, pushOn, pushSupported, isIphone } from '@/lib/reminders';
import { useT, useLang } from '@/lib/i18n';
import { track } from '@/lib/track';

// Free phone reminders. Opt-in, off in one tap, and private: the notification only says
// "something is due", and we keep only the dates, never which app or anything about you.
export default function PushReminders({ state }: { state: AuditState }) {
  const t = useT(); const { lang } = useLang();
  const [on, setOn] = useState(false); const [ok, setOk] = useState(true); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  const dates = dueDates(state).join();
  useEffect(() => { setOk(pushSupported()); setOn(pushOn()); }, []);
  useEffect(() => { if (on) { const id = setTimeout(() => syncPush(lang, dates ? dates.split(',') : []), 1500); return () => clearTimeout(id); } }, [on, lang, dates]);
  const turnOn = async () => {
    setBusy(true); setMsg('');
    const err = await enablePush(lang, dates ? dates.split(',') : []).catch(() => 'error');
    setBusy(false);
    if (!err) { setOn(true); track('push-on'); return; }
    setMsg(err === 'denied' ? t('Notifications are blocked for this site. Allow them in your browser settings, then try again.', 'Las notificaciones están bloqueadas para este sitio. Permítelas en la configuración del navegador y vuelve a intentar.')
      : t('Could not turn on reminders on this device. The calendar reminders below still work.', 'No se pudieron activar los recordatorios en este dispositivo. Los recordatorios de calendario siguen funcionando.'));
  };
  const turnOff = async () => { setBusy(true); await disablePush().catch(() => {}); setBusy(false); setOn(false); track('push-off'); };
  return (
    <div className="glass p-6 lg:col-span-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal">{t('Phone reminders · free · private', 'Recordatorios en tu teléfono · gratis · privados')}</p>
      <h2 className="mt-1 text-lg font-semibold">{on ? t('Reminders are on for this device', 'Los recordatorios están activados en este dispositivo') : t('Get a nudge when a follow-up or re-check is due', 'Recibe un aviso cuando toque un seguimiento o una revisión')}</h2>
      <p className="mt-1 max-w-2xl text-sm text-ink/65">{t('The note only says "Something you planned is due today." It arrives at 9am your time and never names an app. We keep just the dates, no account needed, and turning it off deletes them right away.', 'El aviso solo dice "Hoy toca algo que planeaste." Llega a las 9 a. m. de tu hora y nunca nombra una app. Solo guardamos las fechas, sin cuenta, y al desactivarlo se borran de inmediato.')}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!ok ? (
          <p className="text-sm text-ink/70">{isIphone() ? t('On iPhone: tap Share, then "Add to Home Screen", open Marriage Mode from your Home Screen, and come back here.', 'En iPhone: toca Compartir, luego "Agregar a inicio", abre Marriage Mode desde tu pantalla de inicio y vuelve aquí.') : t('This browser cannot show reminders. Use the calendar reminders instead.', 'Este navegador no puede mostrar recordatorios. Usa los recordatorios de calendario.')}</p>
        ) : on ? (
          <button onClick={turnOff} disabled={busy} className="min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15">{t('Turn off and delete my dates', 'Desactivar y borrar mis fechas')}</button>
        ) : (
          <button onClick={turnOn} disabled={busy} className="glow-mango min-h-11 rounded-full bg-mango px-4 text-sm font-semibold text-night">{busy ? t('One moment…', 'Un momento…') : t('Turn on phone reminders', 'Activar recordatorios')}</button>
        )}
      </div>
      {msg && <p role="status" className="mt-2 text-sm text-ink/70">{msg}</p>}
    </div>
  );
}
