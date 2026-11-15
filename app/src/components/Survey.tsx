'use client';
import { useEffect, useState } from 'react';
import { SURVEY, SCALE_EN, SCALE_ES, loadMine, saveMine, type Answers } from '@/lib/survey';
import * as P from '@/lib/partner';
import { cloudEnabled } from '@/lib/cloud';
import { useT, useLang } from '@/lib/i18n';
import { track } from '@/lib/track';

// Relationship survey: answer privately; linked partners see both sets of answers side by side.
export default function Survey({ partnerName }: { partnerName?: string }) {
  const t = useT(); const { lang } = useLang(); const es = lang === 'es';
  const [mine, setMine] = useState<Answers>({}); const [theirs, setTheirs] = useState<Answers | null>(null);
  const [couple, setCouple] = useState<P.Couple | null>(null); const [mode, setMode] = useState<'intro' | 'form' | 'results'>('intro'); const [msg, setMsg] = useState('');
  useEffect(() => {
    const m = loadMine().answers; setMine(m); if (Object.keys(m).length) setMode('results');
    if (cloudEnabled) void P.myCouple().then(async (c) => {
      if (!c || c.status !== 'active') return; setCouple(c);
      const rows = await P.surveys(c.id);
      const myRow = rows.find((r) => r.author_id === c.me); const other = rows.find((r) => r.author_id !== c.me);
      if (myRow && !Object.keys(m).length) { setMine(myRow.answers as Answers); setMode('results'); }
      if (other) setTheirs(other.answers as Answers);
    }).catch(() => {});
  }, []);
  const set = (id: string, v: number | string) => setMine((a) => ({ ...a, [id]: v }));
  const answered = SURVEY.filter((q) => q.kind === 'scale' && typeof mine[q.id] === 'number').length;
  const scaleCount = SURVEY.filter((q) => q.kind === 'scale').length;
  const save = async () => {
    saveMine(mine); track('survey-saved');
    if (couple) { const ok = await P.saveSurvey(couple.id, mine); setMsg(ok ? t('Saved and shared with your partner.', 'Guardado y compartido con tu pareja.') : t('Saved on this device. Sharing failed; try again.', 'Guardado en este dispositivo. No se pudo compartir; intenta otra vez.')); }
    else setMsg(t('Saved on this device. Link with your partner to see each other’s answers.', 'Guardado en este dispositivo. Conéctate con tu pareja para ver las respuestas de ambos.'));
    setMode('results');
  };
  const label = (v: unknown) => (typeof v === 'number' ? `${v}/5` : '—');
  const pname = partnerName || t('Your partner', 'Tu pareja');

  return (
    <div className="glass p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal">{t('Relationship survey · 5 minutes', 'Encuesta de pareja · 5 minutos')}</p>
      <h2 className="mt-1 text-lg font-semibold">{t('How are we really doing?', '¿Cómo estamos de verdad?')}</h2>

      {mode === 'intro' && (<>
        <p className="mt-1 text-sm text-ink/65">{t('Answer on your own, honestly. If you are linked, you will both see each other’s answers side by side, with where you agree and where to talk. Mia also uses your answers to tailor her coaching.', 'Responde a solas y con honestidad. Si están conectados, ambos verán las respuestas del otro lado a lado, con dónde coinciden y de qué hablar. Mia también usa tus respuestas para adaptar su coaching.')}</p>
        <button onClick={() => setMode('form')} className="glow-mango mt-4 min-h-11 rounded-full bg-mango px-5 font-semibold text-night">{t('Take the survey', 'Hacer la encuesta')}</button>
      </>)}

      {mode === 'form' && (<div className="mt-4 space-y-5">
        {SURVEY.map((q, i) => (
          <fieldset key={q.id}>
            <legend className="text-sm font-medium"><span className="text-ink/45">{i + 1}. </span>{es ? q.es : q.en}</legend>
            {q.kind === 'scale' ? (
              <div className="mt-2 grid grid-cols-5 gap-1.5">{[1, 2, 3, 4, 5].map((v) => (
                <button key={v} type="button" aria-pressed={mine[q.id] === v} onClick={() => set(q.id, v)} className={`min-h-11 rounded-xl px-1 text-[11px] leading-tight ring-1 ${mine[q.id] === v ? 'bg-lagoon/20 font-semibold ring-lagoon/70' : 'ring-white/15'}`}><span className="block text-base">{v}</span>{(es ? SCALE_ES : SCALE_EN)[v - 1]}</button>))}</div>
            ) : (
              <textarea value={(mine[q.id] as string) ?? ''} onChange={(e) => set(q.id, e.target.value.slice(0, 400))} rows={2} className="mt-2 w-full rounded-2xl border border-white/15 bg-night/60 p-3 text-sm" />
            )}
          </fieldset>))}
        <button onClick={save} disabled={answered < scaleCount} className="glow-mango min-h-11 rounded-full bg-mango px-6 font-semibold text-night disabled:opacity-40">{answered < scaleCount ? t(`Answer all ${scaleCount} rating questions (${answered} done)`, `Responde las ${scaleCount} preguntas de puntaje (${answered} hechas)`) : t('Save my answers', 'Guardar mis respuestas')}</button>
      </div>)}

      {mode === 'results' && (<div className="mt-3">
        {msg && <p role="status" className="mb-2 text-sm text-palm">{msg}</p>}
        {couple && !theirs && <p className="mb-2 text-sm text-ink/60">{t(`Waiting for ${pname} to take the survey. Their answers will appear here.`, `Esperando a que ${pname} haga la encuesta. Sus respuestas aparecerán aquí.`)}</p>}
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-ink/50"><th className="py-2 pr-2 font-medium">{t('Question', 'Pregunta')}</th><th className="px-2 font-medium">{t('You', 'Tú')}</th>{theirs && <th className="px-2 font-medium">{pname}</th>}</tr></thead>
          <tbody>{SURVEY.map((q) => {
            const a = mine[q.id]; const b = theirs?.[q.id];
            const gap = typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) : 0;
            const both = typeof a === 'number' && typeof b === 'number' && a >= 4 && b >= 4;
            const low = typeof a === 'number' && a <= 2;
            return (
              <tr key={q.id} className="border-t border-white/[0.06] align-top">
                <td className="py-2 pr-2"><span className="text-ink/80">{es ? q.es : q.en}</span>
                  {gap >= 2 && <span className="mt-1 block text-[11px] text-mango">↔ {t('You see this differently: a good one to talk about.', 'Lo ven distinto: buen tema para hablar.')}</span>}
                  {both && <span className="mt-1 block text-[11px] text-palm">★ {t('A shared strength.', 'Una fortaleza en común.')}</span>}
                  {(low || gap >= 2) && q.topic && <a href={`../coach/`} className="mt-1 block text-[11px] text-teal underline">{t('Talk it through with Mia →', 'Hablarlo con Mia →')}</a>}
                </td>
                <td className="whitespace-pre-line px-2 py-2 font-semibold">{q.kind === 'scale' ? label(a) : <span className="font-normal text-ink/80">{(a as string) || '—'}</span>}</td>
                {theirs && <td className="whitespace-pre-line px-2 py-2 font-semibold">{q.kind === 'scale' ? label(b) : <span className="font-normal text-ink/80">{(b as string) || '—'}</span>}</td>}
              </tr>);
          })}</tbody>
        </table></div>
        <button onClick={() => setMode('form')} className="mt-3 min-h-11 rounded-full px-5 text-sm ring-1 ring-white/15">{t('Update my answers', 'Actualizar mis respuestas')}</button>
        {!couple && <p className="mt-2 text-xs text-ink/55">{t('Link with your partner (Partner tab) to see each other’s answers.', 'Conéctate con tu pareja (pestaña Pareja) para ver las respuestas de ambos.')}</p>}
      </div>)}
    </div>
  );
}
