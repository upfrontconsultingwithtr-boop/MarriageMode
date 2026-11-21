'use client';
// Two interactive simulators for the Marriage Mode Advanced landing page.
// 1) Live Sweep: runs the REAL sweep engine on the visitor's OWN file, in their browser. Nothing uploaded or saved.
// 2) Feed simulator: shows how an attention algorithm learns from what you pause on (Learn lesson 4).
import { useEffect, useRef, useState } from 'react';
import { CAT_LABEL } from '@/lib/adv/sweep';
import { readInbox, readSocial } from '@/lib/adv/io';

type T = (en: string, es: string) => string;

export function SweepSim({ t, es }: { t: T; es: boolean }) {
  const [shown, setShown] = useState<{ who: string; why: string; evidence: string; risque: boolean; cat: string }[]>([]); const [busy, setBusy] = useState(''); const [file, setFile] = useState(''); const [err, setErr] = useState('');
  const run = async (f: File) => {
    setErr(''); setShown([]); setFile(f.name); setBusy(t('Reading on your device…', 'Leyendo en tu dispositivo…'));
    try {
      const text = /\.zip$/i.test(f.name) ? null : await f.text();
      const social = text !== null && /^\s*[[{]/.test(text) && !/^From /m.test(text);
      if (social || /\.zip$/i.test(f.name)) {
        const r = await readSocial(f.name, text, f, { exes: [], pastMatches: [] }, setBusy).catch(() => null);
        const d = await readInbox(f.name, text, f, setBusy).catch(() => null);
        setShown([...(d?.dating ?? []).map((x) => ({ who: x.name, why: t('Dating app found in your file', 'App de citas encontrada en tu archivo'), evidence: x.evidence, risque: true, cat: CAT_LABEL.dating[es ? 1 : 0] })),
          ...(r?.flags ?? []).map((x) => ({ who: x.who, why: es ? x.whyEs : x.why, evidence: x.evidence, risque: x.risque, cat: CAT_LABEL[x.category][es ? 1 : 0] }))]);
      } else {
        const d = await readInbox(f.name, text, f, setBusy);
        setShown([...d.dating.map((x) => ({ who: x.name, why: t('Dating app found in your email or receipts', 'App de citas encontrada en tu correo o recibos'), evidence: x.evidence, risque: true, cat: CAT_LABEL.dating[es ? 1 : 0] })),
          ...d.matches.map((m) => ({ who: m, why: t('A past dating match is named in your email', 'Un match de citas anterior aparece en tu correo'), evidence: f.name, risque: true, cat: CAT_LABEL.risque[es ? 1 : 0] }))]);
      }
    } catch { setErr(t('That file could not be read. Try a .txt / .mbox email export or a social media .zip / .json download.', 'No se pudo leer el archivo. Prueba un correo .txt / .mbox o una descarga .zip / .json de redes.')); }
    finally { setBusy(''); }
  };
  const risk = shown.filter((f) => f.risque).length;
  return (
    <div className="adv-glass adv-edge rounded-[2rem] p-5 sm:p-7">
      <p className="text-sm text-mango">{t('Live, private, on your device', 'En vivo, privado, en tu dispositivo')}</p>
      <h3 className="font-display text-2xl font-semibold">{t('Drop in your own email or social media download', 'Suelta tu propia descarga de correo o redes')}</h3>
      <p className="mt-1 text-sm text-ink/60">{t('The real Sweep reads it in your browser and shows what it finds. Nothing is uploaded or saved; close the page and it’s gone.', 'La Revisión real lo lee en tu navegador y muestra lo que encuentra. No se sube ni se guarda nada; cierra la página y desaparece.')}</p>
      <label className="mt-5 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-mango/40 bg-mango/[0.04] p-5 text-center hover:bg-mango/[0.08]">
        <span className="font-semibold">{t('Choose a file', 'Elegir un archivo')}</span><span className="text-xs text-ink/55">.mbox · .txt · .eml · .json · .zip ({t('Google Takeout, Instagram, Facebook, TikTok…', 'Google Takeout, Instagram, Facebook, TikTok…')})</span>
        <input type="file" accept=".mbox,.txt,.eml,.html,.json,.csv,.zip" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void run(f); e.target.value = ''; }} />
      </label>
      {busy && <p role="status" className="mt-3 text-sm text-lagoon">{busy}</p>}{err && <p role="alert" className="mt-3 text-sm text-coral">{err}</p>}
      {file && !busy && !err && <div className="mt-4">
        <p className="text-sm text-ink/70">{file}: <strong className="text-ink">{shown.length}</strong> {t('found', 'encontrados')} · <strong className="text-mango">{risk}</strong> {t('risque', 'riesgosos')}</p>
        {shown.length ? <ul aria-live="polite" className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">{shown.map((f, k) => <li key={k} className="rise rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/[0.07]">
          <div className="flex flex-wrap items-center gap-2 text-sm"><strong>{f.who}</strong><span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">{f.cat}</span>{f.risque && <span className="rounded-full bg-mango/15 px-2 py-0.5 text-[11px] text-mango">{CAT_LABEL.risque[es ? 1 : 0]}</span>}</div>
          <p className="mt-1 text-sm text-ink/75">{f.why}</p><p className="mt-0.5 truncate text-[11px] text-ink/40">{f.evidence}</p></li>)}</ul>
          : <p className="mt-3 text-sm text-palm">✓ {t('Nothing flagged in this file.', 'Nada marcado en este archivo.')}</p>}
      </div>}
    </div>
  );
}

const POSTS = [
  { k: 'friends', e: '🏡', en: 'Your cousin’s new house', es: 'La casa nueva de tu prima' }, { k: 'fitness', e: '💪', en: 'Leg-day routine', es: 'Rutina de piernas' },
  { k: 'attractive', e: '😍', en: 'A stranger’s beach selfie', es: 'Selfie de playa de un desconocido' }, { k: 'news', e: '📰', en: 'Local news', es: 'Noticias locales' },
  { k: 'ex', e: '💔', en: '“People you may know”: your ex', es: '“Personas que quizás conozcas”: tu ex' }, { k: 'food', e: '🍝', en: 'Pasta recipe', es: 'Receta de pasta' },
];
const LABEL: Record<string, [string, string]> = { friends: ['Friends & family', 'Familia y amigos'], fitness: ['Fitness', 'Ejercicio'], attractive: ['Attractive strangers', 'Desconocidos atractivos'], news: ['News', 'Noticias'], ex: ['Exes & old matches', 'Exparejas y matches'], food: ['Food', 'Comida'] };

export function FeedSim({ t, es }: { t: T; es: boolean }) {
  const [w, setW] = useState<Record<string, number>>(() => Object.fromEntries(POSTS.map((p) => [p.k, 1])));
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  const feed = [...POSTS].sort((a, b) => w[b.k] - w[a.k]).slice(0, 4);
  const linger = (k: string) => setW((x) => ({ ...x, [k]: x[k] + 1.5 }));
  const notInterested = (k: string) => setW((x) => ({ ...x, [k]: Math.max(0.2, x[k] * 0.4) }));
  return (
    <div className="adv-glass adv-edge rounded-[2rem] p-5 sm:p-7">
      <p className="text-sm text-mango">{t('Simulator', 'Simulador')}</p>
      <h3 className="font-display text-2xl font-semibold">{t('Watch a feed learn from you', 'Mira cómo un feed aprende de ti')}</h3>
      <p className="mt-1 text-sm text-ink/60">{t('Tap “Pause on it” and the ranking shifts toward it. Tap “Not interested” to retrain. This is a simplified model of how attention ranking works.', 'Toca “Detenerte” y el orden cambia hacia eso. Toca “No me interesa” para reentrenar. Es un modelo simplificado de cómo funciona el orden por atención.')}</p>
      <div className="mt-5 grid gap-5 md:grid-cols-[1fr_1fr]">
        <ol className="space-y-2">{feed.map((p, i) => <li key={p.k} className="rise flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/[0.07]">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/5 text-2xl" aria-hidden="true">{p.e}</span>
          <span className="min-w-0 grow text-sm"><span className="text-[11px] text-ink/45">#{i + 1} {t('in your feed', 'en tu feed')}</span><span className="block truncate">{es ? p.es : p.en}</span></span>
          <span className="flex shrink-0 flex-col gap-1"><button onClick={() => linger(p.k)} className="min-h-9 rounded-full bg-mango/15 px-3 text-xs text-mango">{t('Pause on it', 'Detenerte')}</button><button onClick={() => notInterested(p.k)} className="min-h-9 rounded-full px-3 text-xs text-ink/60 ring-1 ring-white/15">{t('Not interested', 'No me interesa')}</button></span></li>)}</ol>
        <div>
          <p className="text-sm font-medium">{t('What the algorithm thinks you want', 'Lo que el algoritmo cree que quieres')}</p>
          <ul className="mt-3 space-y-2.5">{POSTS.map((p) => { const pct = Math.round((w[p.k] / total) * 100); return <li key={p.k}><div className="flex justify-between text-xs text-ink/65"><span>{LABEL[p.k][es ? 1 : 0]}</span><span>{pct}%</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className={`h-full rounded-full transition-all duration-700 ${p.k === 'attractive' || p.k === 'ex' ? 'bg-gradient-to-r from-coral to-mango' : 'bg-gradient-to-r from-lagoon/70 to-lagoon'}`} style={{ width: `${pct}%` }} /></div></li>; })}</ul>
          <button onClick={() => setW(Object.fromEntries(POSTS.map((p) => [p.k, 1])))} className="mt-4 min-h-10 text-sm text-ink/60 underline underline-offset-4">{t('Reset', 'Reiniciar')}</button>
        </div>
      </div>
    </div>
  );
}
