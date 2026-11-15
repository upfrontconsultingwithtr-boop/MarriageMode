'use client';
import { useEffect, useState } from 'react';
import { LESSONS } from '@/lib/lessons';
import { loadPrefs } from '@/lib/prefs';
import { track } from '@/lib/track';

// Read aloud with the phone's own built-in voice (free, works offline, nothing sent anywhere).
export default function LessonsApp() {
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [canSpeak, setCanSpeak] = useState(false);
  useEffect(() => { setLang(loadPrefs().lang); setCanSpeak('speechSynthesis' in window); return () => { try { speechSynthesis.cancel(); } catch { /* none */ } }; }, []);
  const es = lang === 'es';
  const t = (en: string, sp: string) => (es ? sp : en);

  const speak = (id: string) => {
    if (speaking === id) { speechSynthesis.cancel(); setSpeaking(null); return; }
    const l = LESSONS.find((x) => x.id === id)![lang];
    const text = [l.title, l.intro, ...l.steps.map((s, i) => `${i + 1}. ${s}`), t('Try it together.', 'Inténtenlo juntos.'), l.together].join(' ');
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = es ? 'es-ES' : 'en-US'; u.rate = 0.95;
    const v = speechSynthesis.getVoices().find((x) => x.lang.startsWith(es ? 'es' : 'en')); if (v) u.voice = v;
    u.onend = () => setSpeaking(null); setSpeaking(id); speechSynthesis.speak(u); track('lesson-listen');
  };

  return (
    <div lang={lang} className="mx-auto max-w-4xl px-4 py-14">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-teal">{t('Free guided lessons · 5–8 minutes', 'Lecciones guiadas gratis · 5–8 minutos')}</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight">{t('Conversations that bring you closer', 'Conversaciones que los acercan')}</h1>
          <p className="mt-3 max-w-2xl text-ink/75">{t('Short lessons to do together. Read them, or tap Listen and your phone reads them aloud. Educational only: not therapy, and not a replacement for a licensed counselor.', 'Lecciones cortas para hacer juntos. Léanlas o toquen Escuchar y su teléfono las leerá en voz alta. Solo educativas: no es terapia ni reemplaza a un consejero con licencia.')}</p>
        </div>
        <div role="group" aria-label="Language" className="flex rounded-full bg-white/[0.04] p-1 text-xs ring-1 ring-white/10">
          {(['en', 'es'] as const).map((l) => <button key={l} aria-pressed={lang === l} onClick={() => { speechSynthesis?.cancel(); setSpeaking(null); setLang(l); }} className={`min-h-9 rounded-full px-3 font-semibold ${lang === l ? 'bg-lagoon/20 text-ink' : 'text-ink/60'}`}>{l === 'en' ? 'English' : 'Español'}</button>)}
        </div>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
        {LESSONS.map((x, i) => { const l = x[lang]; return (
          <details key={x.id} className="glass group p-6 [&_summary::-webkit-details-marker]:hidden" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
              <span><span className="font-mono text-[11px] uppercase tracking-[0.2em] text-mango">{t('Lesson', 'Lección')} {i + 1} · {x.minutes} min</span><span className="mt-1 block text-lg font-semibold">{l.title}</span></span>
              <span className="text-teal transition group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-3 text-ink/75">{l.intro}</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink/80">{l.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            <p className="mt-4 rounded-xl bg-lagoon/10 p-3 text-sm ring-1 ring-lagoon/30"><b>{t('Try it together: ', 'Inténtenlo juntos: ')}</b>{l.together}</p>
            {canSpeak && <button onClick={() => speak(x.id)} className="mt-4 min-h-11 rounded-full px-5 text-sm font-semibold ring-1 ring-white/15">{speaking === x.id ? t('■ Stop', '■ Detener') : t('▶ Listen', '▶ Escuchar')}</button>}
          </details>
        ); })}
      </div>
      <p className="mt-8 text-sm text-ink/60">{t('If anyone pressures you to give up passwords or be monitored, that is not trust. Free, confidential help: 1-800-799-7233 or text START to 88788.', 'Si alguien te presiona para dar contraseñas o ser vigilado, eso no es confianza. Ayuda gratis y confidencial (hay atención en español): 1-800-799-7233 o envía START al 88788.')}</p>
    </div>
  );
}
