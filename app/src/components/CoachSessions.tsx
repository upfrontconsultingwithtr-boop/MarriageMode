'use client';
import { useEffect, useState } from 'react';
import { loadSessions, deleteSession, transcriptText, type Session } from '@/lib/sessions';
import { useT, useLang, LOCALE } from '@/lib/i18n';
import { getBlob } from '@/lib/recorder';

function PartPlayer({ k, kind, label }: { k: string; kind: 'video' | 'voice'; label: string }) {
  const [url, setUrl] = useState<string | null>(null); const [missing, setMissing] = useState(false);
  useEffect(() => { let u = ''; void getBlob(k).then((b) => { if (b) { u = URL.createObjectURL(b); setUrl(u); } else setMissing(true); }); return () => { if (u) URL.revokeObjectURL(u); }; }, [k]);
  if (missing) return null;
  if (!url) return <p className="text-xs text-ink/50">…</p>;
  return (
    <div className="mt-2">
      {kind === 'video' ? <video src={url} controls playsInline className="w-full max-w-md rounded-xl ring-1 ring-white/10" aria-label={label} /> : <audio src={url} controls className="w-full max-w-md" aria-label={label} />}
      <a href={url} download={`${k}.${kind === 'video' ? 'webm' : 'webm'}`} className="mt-1 inline-block text-xs text-teal underline">{label}</a>
    </div>
  );
}

// "Your coaching sessions": every session with Mia, saved on this device to look back on.
export default function CoachSessions() {
  const t = useT(); const { lang } = useLang();
  const [list, setList] = useState<Session[]>([]); const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { setList(loadSessions()); }, []);
  const download = (s: Session) => { const u = URL.createObjectURL(new Blob([transcriptText(s)], { type: 'text/plain' })); const a = document.createElement('a'); a.href = u; a.download = `marriage-mode-coaching-${s.startedAt.slice(0, 10)}.txt`; a.click(); URL.revokeObjectURL(u); };
  return (
    <div className="glass p-6 lg:col-span-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-violet">{t('AI coach · your sessions', 'Coach de IA · tus sesiones')}</p>
          <h2 className="mt-1 text-lg font-semibold">{t('Your coaching sessions with Mia', 'Tus sesiones de coaching con Mia')}</h2>
        </div>
        <a href="../coach/" className="glow-mango min-h-11 rounded-full bg-mango px-5 py-2.5 text-sm font-semibold text-night">{t('Start a session', 'Empezar una sesión')}</a>
      </div>
      {!list.length ? <p className="mt-3 text-sm text-ink/60">{t('After each session with Mia, it appears here to look back on: video calls as video, voice calls as audio, and every session as a written transcript. Saved only on this device.', 'Después de cada sesión con Mia, aparece aquí para volver a verla: las videollamadas como video, las llamadas de voz como audio y cada sesión como transcripción escrita. Se guarda solo en este dispositivo.')}</p> : (
        <ul className="mt-4 space-y-2">{list.map((s) => (
          <li key={s.id} className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.07]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button onClick={() => setOpen(open === s.id ? null : s.id)} className="min-h-9 text-left text-sm font-medium">{new Date(s.startedAt).toLocaleString(LOCALE[lang], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · {s.format === 'video' ? '🎥 ' : s.format === 'voice' ? '🎙 ' : '💬 '}{s.format === 'video' ? t('Video', 'Video') : s.format === 'voice' ? t('Voice', 'Voz') : t('Chat', 'Chat')} · {t(`${s.msgs.filter((m) => m.role === 'user').length} messages`, `${s.msgs.filter((m) => m.role === 'user').length} mensajes`)} <span className="text-ink/50">“{(s.msgs.find((m) => m.role === 'user')?.content ?? '').slice(0, 60)}”</span></button>
              <span className="flex gap-1.5">
                <button onClick={() => setOpen(open === s.id ? null : s.id)} className="min-h-9 rounded-full px-3 text-xs ring-1 ring-white/15">{open === s.id ? t('Hide', 'Ocultar') : t('Read', 'Leer')}</button>
                <button onClick={() => download(s)} className="min-h-9 rounded-full px-3 text-xs ring-1 ring-white/15">{t('Download', 'Descargar')}</button>
                <button onClick={() => { if (confirm(t('Delete this transcript from this device?', '¿Borrar esta transcripción de este dispositivo?'))) { deleteSession(s.id); setList(loadSessions()); } }} className="min-h-9 rounded-full px-3 text-xs text-ink/60 ring-1 ring-white/10">{t('Delete', 'Borrar')}</button>
              </span>
            </div>
            {open === s.id && s.parts?.map((p) => <PartPlayer key={p.key} k={p.key} kind={p.kind} label={p.kind === 'video' ? t('Download video', 'Descargar video') : t('Download audio', 'Descargar audio')} />)}
            {open === s.id && <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">{s.msgs.map((m, i) => <p key={i} className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm [overflow-wrap:anywhere] ${m.role === 'user' ? 'ml-auto bg-mango/15 ring-1 ring-mango/30' : 'bg-lagoon/10 ring-1 ring-lagoon/30'}`}><b className="block text-[11px] text-ink/50">{m.role === 'user' ? t('You', 'Tú') : 'Mia'}</b>{m.content}</p>)}</div>}
          </li>))}</ul>
      )}
    </div>
  );
}
