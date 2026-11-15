'use client';
import { useEffect, useState } from 'react';
import { loadAssignments, toggleAssignment, removeAssignment, markShared, type Assignment } from '@/lib/assignments';
import * as P from '@/lib/partner';
import { cloudEnabled } from '@/lib/cloud';
import { useT, useLang, LOCALE } from '@/lib/i18n';

// "Your assignments from Mia": personal homework from coaching sessions, ticked off as you go.
export default function Assignments() {
  const t = useT(); const { lang } = useLang();
  const [list, setList] = useState<Assignment[]>([]);
  const [couple, setCouple] = useState<P.Couple | null>(null); const [msg, setMsg] = useState('');
  useEffect(() => { setList(loadAssignments()); if (cloudEnabled) void P.myCouple().then((c) => setCouple(c && c.status === 'active' ? c : null)).catch(() => {}); }, []);
  const share = async (a: Assignment) => {
    if (!couple) return;
    const ok = await P.addGoal(couple.id, couple.me, `📌 ${t('Assignment', 'Tarea')}: ${a.text}`);
    if (ok) { markShared(a.id); setList(loadAssignments()); setMsg(t('Shared. It’s now in your partner space, where you can both tick it off.', 'Compartida. Ya está en su espacio de pareja, donde ambos pueden marcarla.')); }
    else setMsg(t('Could not share. Try again.', 'No se pudo compartir. Intenta otra vez.'));
  };
  if (!list.length) return null;
  const open = list.filter((a) => !a.doneAt); const done = list.filter((a) => a.doneAt);
  return (
    <div className="halo-border lg:col-span-3"><div className="rounded-[1.75rem] bg-deep/95 p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mango">{t('From your coaching sessions', 'De tus sesiones de coaching')}</p>
      <h2 className="mt-1 text-lg font-semibold">{t('Your assignments from Mia', 'Tus tareas de Mia')} <span className="text-sm font-normal text-ink/55">· {t(`${done.length} of ${list.length} done`, `${done.length} de ${list.length} hechas`)}</span></h2>
      <ul className="mt-3 space-y-2">{[...open, ...done].map((a) => (
        <li key={a.id} className="flex items-start gap-3 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.07]">
          <input type="checkbox" checked={!!a.doneAt} onChange={() => { toggleAssignment(a.id); setList(loadAssignments()); }} className="mt-1 size-5 shrink-0 accent-[#D9B77E]" aria-label={t('Mark done', 'Marcar hecha')} />
          <div className="min-w-0 flex-1"><p className={`text-sm ${a.doneAt ? 'text-ink/50 line-through' : ''}`}>{a.text}</p><p className="mt-0.5 text-[11px] text-ink/45">{t('Given', 'Asignada')} {new Date(a.createdAt).toLocaleDateString(LOCALE[lang], { month: 'short', day: 'numeric' })}{a.doneAt ? ` · ${t('done', 'hecha')} ${new Date(a.doneAt).toLocaleDateString(LOCALE[lang], { month: 'short', day: 'numeric' })}` : ''}</p></div>
          <span className="flex shrink-0 flex-col items-end gap-1">
            {couple && (a.sharedAt ? <span className="text-[11px] text-palm">💞 {t('Shared', 'Compartida')}</span> : <button onClick={() => share(a)} className="min-h-9 rounded-full bg-lagoon/15 px-3 text-xs ring-1 ring-lagoon/50">{t('Share with my partner', 'Compartir con mi pareja')}</button>)}
            <button onClick={() => { removeAssignment(a.id); setList(loadAssignments()); }} className="text-xs text-ink/40 underline">{t('Remove', 'Quitar')}</button>
          </span>
        </li>))}</ul>
      {msg && <p role="status" className="mt-2 text-sm text-palm">{msg}</p>}
      {!couple && <p className="mt-2 text-xs text-ink/55">{t('Link with your partner in the Partner tab to share assignments and do them together.', 'Conéctate con tu pareja en la pestaña Pareja para compartir tareas y hacerlas juntos.')}</p>}
      <a href="../coach/" className="mt-3 inline-block text-sm text-teal underline">{t('Tell Mia how it went →', 'Cuéntale a Mia cómo te fue →')}</a>
    </div></div>
  );
}
