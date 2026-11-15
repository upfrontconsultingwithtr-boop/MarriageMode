'use client';
import type { AuditState } from '@/lib/audit';
import { recheckIcs } from '@/lib/questions';
import { BASE } from '@/lib/base';
import { useT, useLang, LOCALE } from '@/lib/i18n';
import { track } from '@/lib/track';

// Monthly re-check: like a removal service's re-scan, but self-led and private.
export default function Recheck({ state, setState, goApps }: { state: AuditState; setState: (f: (s: AuditState) => AuditState) => void; goApps: () => void }) {
  const t = useT(); const { lang } = useLang();
  const list = state.recheckedAt ?? [];
  const last = list[list.length - 1];
  const next = new Date(last ?? state.startedAt ?? Date.now()); next.setDate(next.getDate() + 30);
  const due = next.getTime() <= Date.now();
  const fmt = (d: Date) => d.toLocaleDateString(LOCALE[lang], { month: 'long', day: 'numeric' });
  const addCal = () => {
    const url = URL.createObjectURL(new Blob([recheckIcs(`${window.location.origin}${BASE}`)], { type: 'text/calendar' }));
    const a = document.createElement('a'); a.href = url; a.download = 'marriage-mode-monthly-recheck.ics'; a.click(); URL.revokeObjectURL(url); track('recheck-calendar');
  };
  const done = () => { setState((s) => ({ ...s, recheckedAt: [...(s.recheckedAt ?? []), new Date().toISOString()].slice(-24) })); track('recheck-done'); };
  return (
    <div className="glass p-6 lg:col-span-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal">{t('Monthly re-check · 5 minutes', 'Revisión mensual · 5 minutos')}</p>
          <h2 className="mt-1 text-lg font-semibold">{due ? t('Your re-check is due', 'Te toca tu revisión') : t(`Next re-check: ${fmt(next)}`, `Próxima revisión: ${fmt(next)}`)}</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink/65">{t('Old accounts and emails can come back. Once a month: run the inbox search again, glance at your card statement, and check that nothing reopened.', 'Las cuentas y correos viejos pueden volver. Una vez al mes: repite la búsqueda en tu correo, revisa tu estado de cuenta y confirma que nada se reabrió.')}</p>
          {last && <p className="mt-1 text-xs text-ink/50">{t(`Last re-check: ${fmt(new Date(last))} · ${list.length} done`, `Última revisión: ${fmt(new Date(last))} · ${list.length} hechas`)}</p>}
        </div>
        <span aria-hidden="true" className={`grid size-12 shrink-0 place-items-center rounded-full text-xl ${due ? 'bg-mango text-night shadow-[0_0_18px_-4px_#E7A3AE]' : 'bg-lagoon/15 text-teal ring-1 ring-lagoon/40'}`}>↻</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={goApps} className="min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15">{t('Run the searches', 'Hacer las búsquedas')}</button>
        <button onClick={done} className="glow-mango min-h-11 rounded-full bg-mango px-4 text-sm font-semibold text-night">{t('I re-checked today ✓', 'Hoy hice la revisión ✓')}</button>
        <button onClick={addCal} className="min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15">{t('Add a monthly reminder to my calendar', 'Agregar recordatorio mensual a mi calendario')}</button>
      </div>
    </div>
  );
}
