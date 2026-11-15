'use client';
import { useCallback, useEffect, useState } from 'react';
import * as P from '@/lib/partner';
import { QUESTIONS, questionFor, streak, today } from '@/lib/questions';
import { useT, useLang } from '@/lib/i18n';
import { track } from '@/lib/track';

// One shared question a day. You see your partner's answer once you've answered too.
export default function DailyQuestion({ coupleId, me, partnerName }: { coupleId: string; me: string; partnerName: string }) {
  const t = useT(); const { lang } = useLang();
  const day = today(); const q = questionFor(day);
  const [rows, setRows] = useState<P.Answer[]>([]);
  const [text, setText] = useState(''); const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const since = new Date(); since.setDate(since.getDate() - 120);
    setRows(await P.answers(coupleId, today(since)));
  }, [coupleId]);
  useEffect(() => { void load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, [load]);

  const todays = rows.filter((r) => r.day === day);
  const mine = todays.find((r) => r.author_id === me);
  const theirs = todays.find((r) => r.author_id !== me);
  const byDay = new Map<string, Set<string>>();
  rows.forEach((r) => { if (!byDay.has(r.day)) byDay.set(r.day, new Set()); byDay.get(r.day)!.add(r.author_id); });
  const both = new Set([...byDay].filter(([, s]) => s.size >= 2).map(([d]) => d));
  const run = streak(both);

  const send = async (e: React.FormEvent) => {
    e.preventDefault(); const v = text.trim(); if (!v) return;
    if (await P.answerToday(coupleId, day, q, v)) { setText(''); track('daily-answer'); await load(); }
    else setMsg(t('Not saved. Check your connection and try again.', 'No se guardó. Revisa tu conexión e intenta otra vez.'));
  };

  return (
    <div className="halo-border"><div className="rounded-[1.75rem] bg-deep/95 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mango">{t('Today’s question for you two', 'La pregunta de hoy para ustedes')}</p>
        <span className="rounded-full bg-mango/15 px-3 py-1 text-xs font-semibold text-mango ring-1 ring-mango/40" aria-label={t(`${run} day streak`, `Racha de ${run} días`)}>🔥 {run} {t(run === 1 ? 'day' : 'days', run === 1 ? 'día' : 'días')}</span>
      </div>
      <p className="mt-3 font-display text-xl font-semibold sm:text-2xl">{QUESTIONS[q][lang === 'es' ? 1 : 0]}</p>
      {!mine ? (
        <form onSubmit={send} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="dq" className="sr-only">{t('Your answer', 'Tu respuesta')}</label>
          <input id="dq" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder={t('Your answer…', 'Tu respuesta…')} className="min-h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-night/60 px-4" />
          <button className="glow-mango min-h-11 rounded-full bg-mango px-5 font-semibold text-night">{t('Answer', 'Responder')}</button>
        </form>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 [&>*]:min-w-0">
          <p className="rounded-2xl bg-mango/10 p-3 text-sm ring-1 ring-mango/30 [overflow-wrap:anywhere]"><b className="block text-xs text-ink/60">{t('You', 'Tú')}</b>{mine.answer}</p>
          <p className="rounded-2xl bg-lagoon/10 p-3 text-sm ring-1 ring-lagoon/30 [overflow-wrap:anywhere]"><b className="block text-xs text-ink/60">{partnerName}</b>{theirs ? theirs.answer : t('Waiting for their answer. You’ll both see each other’s once you’ve both answered.', 'Esperando su respuesta. Se verán las respuestas cuando los dos hayan respondido.')}</p>
        </div>
      )}
      {!mine && theirs && <p className="mt-2 text-xs text-ink/60">{t(`${partnerName} has answered. Answer to see it.`, `${partnerName} ya respondió. Responde para verlo.`)}</p>}
      {msg && <p role="status" className="mt-2 text-sm text-coral">{msg}</p>}
      <p className="mt-3 text-xs text-ink/50">{t('Answer on the same day to grow your streak. Only you two can read these.', 'Respondan el mismo día para aumentar su racha. Solo ustedes dos pueden leerlas.')}</p>
    </div></div>
  );
}
