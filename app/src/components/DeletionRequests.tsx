'use client';
import { useState } from 'react';
import type { AuditState } from '@/lib/audit';
import { track } from '@/lib/track';
import { useT, useLang, LOCALE } from '@/lib/i18n';
import { gmailEnabled, sendAll, type Mail } from '@/lib/gmailSend';

// Official request pages confirmed from the company's own help center.
// Privacy emails confirmed on each company's own privacy policy (checked 2026-11-15).
// Only add an address after reading it on the company's own site.
const EMAIL: Record<string, string> = {
  Bumble: 'DPO@bumble.com',        // bumble.com/en/privacy: "exercise your rights ... email our Data Protection Officer"
  eharmony: 'privacy@eharmony.com', // eharmony.com/about/privacy: "submit a privacy rights request ... privacy@eharmony.com"
  // Checked 2026-11-16 on each company's own privacy policy:
  Grindr: 'privacy@grindr.com',     // grindr.com/privacy-policy: "request to exercise these rights by emailing us at privacy@grindr.com"
  Feeld: 'privacy@feeld.co',        // feeld.co/privacy: "in relation to the exercise of any of your rights ... privacy@feeld.co"
  Taimi: 'gdpr@taimi.com',          // taimi.com/privacy-policy: "our Data Protection Officer (DPO), please email: gdpr@taimi.com"
  Muzz: 'privacy@muzz.com',         // muzz.com/en-GB/privacy: "Our data protection officer can be contacted at privacy@muzz.com"
};

const OFFICIAL: Record<string, string> = {
  Bumble: 'https://bumble.com/en/privacy',
  eharmony: 'https://www.eharmony.com/about/privacy/',
  Tinder: 'https://www.help.tinder.com/hc/en-us/articles/5349453268877',
  Grindr: 'https://www.grindr.com/privacy-policy',
  Feeld: 'https://feeld.co/privacy',
  Taimi: 'https://www.taimi.com/privacy-policy',
  Muzz: 'https://muzz.com/en-GB/privacy/',
};

export function letter(app: string, name: string, email: string, user: string) {
  return `Subject: Request to delete my account and personal data

To the ${app} privacy team,

I am requesting that you delete my ${app} account and all personal data you hold about me, and that you confirm in writing when this is done. Please also tell me if you keep any data and why.

I make this request under my privacy rights, including, where they apply to me, the California Consumer Privacy Act (as amended), other U.S. state privacy laws, and the GDPR / UK GDPR.

Details to find my account:
- Name: ${name || '[your name]'}
- Email used for ${app}: ${email || '[your email]'}${user ? `\n- Username or phone: ${user}` : ''}

Please send your confirmation to the email above.

Thank you,
${name || '[your name]'}`;
}

export function followUp(app: string, name: string, email: string, sentIso: string) {
  const d = new Date(sentIso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return `Subject: Follow-up: request to delete my account and personal data (sent ${d})

To the ${app} privacy team,

On ${d} I asked you to delete my ${app} account and all personal data you hold about me. I have not yet received confirmation that this is complete.

Please complete the deletion and confirm in writing. Where U.S. state privacy laws such as the California Consumer Privacy Act apply, businesses must respond within 45 days of receiving a request.

Account details: ${name || '[your name]'}, ${email || '[your email]'}.

Thank you,
${name || '[your name]'}`;
}

function reminderIcs(app: string, whenIso: string) {
  const d = new Date(whenIso); const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Upfront Consulting with Tiff & Reco LLC//Marriage Mode//EN', 'BEGIN:VEVENT', `UID:mm-followup-${ymd}-${encodeURIComponent(app)}@marriagemode`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd}`,
    `SUMMARY:Marriage Mode: follow up with ${app} about your deletion request`, 'DESCRIPTION:Open Marriage Mode > Clean up > Deletion requests for your ready follow-up letter.', 'BEGIN:VALARM', 'TRIGGER:PT9H', 'ACTION:DISPLAY', 'DESCRIPTION:Follow up on your deletion request', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}

const DAY = 86400000;

type Props = { apps: string[]; state: AuditState; setState: (f: (s: AuditState) => AuditState) => void };

export default function DeletionRequests({ apps, state, setState }: Props) {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [user, setUser] = useState('');
  const [open, setOpen] = useState<string | null>(null); const [copied, setCopied] = useState('');
  const t = useT(); const { lang } = useLang();
  const sent = state.requests ?? {};
  if (!apps.length) return null;
  const copy = async (app: string) => { try { await navigator.clipboard.writeText(letter(app, name, email, user)); setCopied(app); setTimeout(() => setCopied(''), 2000); track('deletion-request-copied'); } catch { /* ignore */ } };
  const markSent = (app: string) => setState((s) => ({ ...s, requests: { ...(s.requests ?? {}), [app]: s.requests?.[app] ? undefined! : new Date().toISOString() } }));
  const done = apps.filter((a) => sent[a]).length;
  const replied = state.replied ?? {};
  const markReplied = (app: string) => setState((s) => ({ ...s, replied: { ...(s.replied ?? {}), [app]: s.replied?.[app] ? undefined! : new Date().toISOString() } }));
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(LOCALE[lang], { month: 'short', day: 'numeric' });
  const calendar = (app: string, iso: string) => { const u = URL.createObjectURL(new Blob([reminderIcs(app, iso)], { type: 'text/calendar' })); const el = document.createElement('a'); el.href = u; el.download = `follow-up-${app.replace(/\W+/g, '-').toLowerCase()}.ics`; el.click(); URL.revokeObjectURL(u); track('followup-calendar'); };
  // "Do it for me": every request (and any due follow-up) that has a confirmed privacy email.
  const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [note, setNote] = useState(''); const [prog, setProg] = useState(0);
  const queue = apps.filter((a) => EMAIL[a] && !replied[a] && (!sent[a] || Date.now() - Date.parse(sent[a]) >= 30 * DAY));
  const mails: (Mail & { app: string })[] = queue.map((a) => { const txt = sent[a] ? followUp(a, name, email, sent[a]) : letter(a, name, email, user); return { app: a, to: EMAIL[a], subject: txt.split('\n')[0].replace('Subject: ', ''), body: txt.replace(/^Subject:.*\n\n/, '') }; });
  const doIt = async () => {
    setBusy(true); setNote('');
    try {
      setProg(0); const r = await sendAll(mails, setProg);
      const now = new Date().toISOString(); const ok = r.sent.map((i) => mails[i].app);
      if (ok.length) setState((s) => ({ ...s, requests: { ...(s.requests ?? {}), ...Object.fromEntries(ok.map((a) => [a, now])) } }));
      track('gmail-send');
      setNote(r.error ? t(`Sent ${ok.length} of ${mails.length}. Gmail stopped the rest; you can still use the buttons below.`, `Se enviaron ${ok.length} de ${mails.length}. Gmail detuvo el resto; aún puedes usar los botones de abajo.`) : t(`Done: ${ok.length} sent from your Gmail. We dropped the access right after. Next: watch your inbox for 2 days. Most companies send a link to confirm it's you, and the deletion only happens after you click it.`, `Listo: ${ok.length} enviadas desde tu Gmail. Quitamos el acceso enseguida. Ahora: revisa tu correo por 2 días. La mayoría de las empresas envía un enlace para confirmar que eres tú, y la eliminación solo ocurre después de que lo abras.`));
    } catch { setNote(t('Nothing was sent. You can try again or use the buttons below.', 'No se envió nada. Puedes intentar de nuevo o usar los botones de abajo.')); }
    setBusy(false); setConfirm(false);
  };
  const copyText = async (key: string, text: string) => { try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 2000); } catch { /* ignore */ } };

  return (
    <div className="halo-border"><div className="rounded-[1.75rem] bg-deep/95 p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mango">{t('We write it for you', 'Lo escribimos por ti')}</p>
      <h2 className="mt-1 text-xl font-semibold">{t('Deletion requests, ready to send', 'Solicitudes de eliminación, listas para enviar')}</h2>
      <p className="mt-1 text-sm text-ink/65">{t('Deleting a profile doesn\'t always erase your data. For each app, we write a formal request asking the company to delete your account and data. You send it from your own email or their privacy form; we never need your password.', 'Eliminar un perfil no siempre borra tus datos. Para cada app escribimos una solicitud formal pidiendo a la empresa que elimine tu cuenta y tus datos. Tú la envías desde tu correo o su formulario de privacidad; nunca necesitamos tu contraseña. La carta va en inglés porque estas empresas responden en inglés.')} {done > 0 && <strong className="text-ink">{t(`${done} of ${apps.length} sent.`, `${done} de ${apps.length} enviadas.`)}</strong>}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3 [&>*]:min-w-0">
        <label className="text-sm text-ink/70">{t('Your name', 'Tu nombre')}<input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 min-h-11 w-full rounded-full border border-white/15 bg-night/60 px-4" /></label>
        <label className="text-sm text-ink/70">{t('Email you used', 'Correo que usaste')}<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 min-h-11 w-full rounded-full border border-white/15 bg-night/60 px-4" /></label>
        <label className="text-sm text-ink/70">{t('Username or phone (optional)', 'Usuario o teléfono (opcional)')}<input value={user} onChange={(e) => setUser(e.target.value)} className="mt-1 min-h-11 w-full rounded-full border border-white/15 bg-night/60 px-4" /></label>
      </div>
      <p className="mt-2 text-xs text-ink/50">{t('These stay on your device and only fill in the letters.', 'Esto se queda en tu dispositivo y solo llena las cartas.')}</p>
      {gmailEnabled && (mails.length > 0 || note) && (
        <div className="mt-4 rounded-xl bg-mango/10 p-4 ring-1 ring-mango/40">
          <p className="font-semibold">{t('Do it for me', 'Hazlo por mí')}</p>
          <p className="mt-1 text-sm text-ink/70">{t(`Send ${mails.length} request${mails.length === 1 ? '' : 's'} from your own Gmail in one step. Google asks you to allow "send email" only: we can't read your inbox, we keep nothing, and the access is dropped right after.`, `Envía ${mails.length} solicitud${mails.length === 1 ? '' : 'es'} desde tu propio Gmail en un paso. Google solo te pide permitir "enviar correo": no podemos leer tu bandeja, no guardamos nada y el acceso se quita enseguida.`)}</p>
          {confirm ? (
            <div className="mt-3 text-sm">
              <p className="inline-block rounded-full bg-palm/15 px-3 py-1 text-xs text-palm">{t('🔒 Send-only: we can\'t read your inbox. Access is removed the moment sending ends.', '🔒 Solo enviar: no podemos leer tu correo. El acceso se quita al terminar de enviar.')}</p>
              <p className="mt-2 text-ink/80">{t('These will be sent from your Gmail (tap "See letter" below to read each one):', 'Se enviarán desde tu Gmail (toca "Ver carta" abajo para leer cada una):')}</p>
              <ul className="mt-1 list-disc pl-5 text-ink/70">{mails.map((m) => <li key={m.app}>{m.app} → {m.to}{sent[m.app] ? t(' (follow-up)', ' (seguimiento)') : ''}</li>)}</ul>
              <span className="mt-3 flex flex-wrap gap-2">
                <button onClick={doIt} disabled={busy} className="min-h-11 rounded-full bg-mango px-4 font-semibold text-night">{busy ? t(`Sending ${prog + 1} of ${mails.length}…`, `Enviando ${prog + 1} de ${mails.length}…`) : t('Send them now', 'Enviarlas ahora')}</button>
                <button onClick={() => setConfirm(false)} disabled={busy} className="min-h-11 rounded-full px-4 ring-1 ring-white/15">{t('Cancel', 'Cancelar')}</button>
              </span>
            </div>
          ) : mails.length > 0 && (
            <button onClick={() => (email.trim() && name.trim() ? setConfirm(true) : setNote(t('Add your name and the email you used above first, so the letters can find your account.', 'Primero agrega tu nombre y el correo que usaste arriba, para que las cartas encuentren tu cuenta.')))} className="glow-mango mt-3 min-h-11 rounded-full bg-mango px-4 text-sm font-semibold text-night">{t('Send with my Gmail', 'Enviar con mi Gmail')}</button>
          )}
          {note && <p role="status" className="mt-2 text-sm text-ink/80">{note}</p>}
        </div>
      )}
      <ul className="mt-4 space-y-2">{apps.map((a) => (
        <li key={a} className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.07]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">{a} {sent[a] && <span className="ml-1 rounded-full bg-palm/15 px-2 py-0.5 text-[11px] text-palm">{t('Sent', 'Enviada')} {new Date(sent[a]).toLocaleDateString(LOCALE[lang], { month: 'short', day: 'numeric' })}</span>}</span>
            <span className="flex flex-wrap gap-1.5">
              <button onClick={() => setOpen(open === a ? null : a)} className="min-h-9 rounded-full px-3 text-xs ring-1 ring-white/15">{open === a ? t('Hide letter', 'Ocultar carta') : t('See letter', 'Ver carta')}</button>
              <button onClick={() => copy(a)} className="min-h-9 rounded-full bg-lagoon/15 px-3 text-xs ring-1 ring-lagoon/50">{copied === a ? t('Copied ✓', 'Copiada ✓') : t('Copy letter', 'Copiar carta')}</button>
              {EMAIL[a] && <a href={`mailto:${EMAIL[a]}?subject=${encodeURIComponent('Request to delete my account and personal data')}&body=${encodeURIComponent(letter(a, name, email, user).replace(/^Subject:.*\n\n/, ''))}`} onClick={() => track('deletion-request-email')} className="inline-flex min-h-9 items-center rounded-full bg-mango px-3 text-xs font-semibold text-night">{t('Send from my email ✉', 'Enviar desde mi correo ✉')}</a>}
              <a href={OFFICIAL[a] ?? 'https://www.google.com/search?q=' + encodeURIComponent(`${a} official privacy request delete my personal data`)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center rounded-full px-3 text-xs ring-1 ring-white/15">{t(`Open ${a}'s privacy page ↗`, `Abrir la página de privacidad de ${a} ↗`)}</a>
              <button onClick={() => markSent(a)} aria-pressed={!!sent[a]} className={`min-h-9 rounded-full px-3 text-xs ring-1 ${sent[a] ? 'bg-palm/15 text-palm ring-palm/40' : 'ring-white/15'}`}>{sent[a] ? t('Sent ✓', 'Enviada ✓') : t('I sent it', 'La envié')}</button>
            </span>
          </div>
          {open === a && <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-night/70 p-3 font-sans text-xs text-ink/80">{letter(a, name, email, user)}</pre>}
          {sent[a] && (() => {
            if (replied[a]) return <p className="mt-2 text-xs text-palm">✓ {t(`${a} confirmed on ${fmt(replied[a])}. Keep their email as proof.`, `${a} confirmó el ${fmt(replied[a])}. Guarda su correo como prueba.`)} <button onClick={() => markReplied(a)} className="ml-1 text-ink/50 underline">{t('undo', 'deshacer')}</button></p>;
            const days = Math.floor((Date.now() - Date.parse(sent[a])) / DAY);
            const dueIso = new Date(Date.parse(sent[a]) + 30 * DAY).toISOString();
            const fu = followUp(a, name, email, sent[a]);
            return (
              <div className={`mt-2 rounded-lg p-3 text-xs ring-1 ${days >= 30 ? 'bg-mango/10 ring-mango/40' : 'bg-white/[0.02] ring-white/[0.07]'}`}>
                <p className="font-semibold">{days >= 30 ? t(`Follow-up due: no reply after ${days} days`, `Toca dar seguimiento: sin respuesta tras ${days} días`) : t(`Waiting for their reply · follow up on ${fmt(dueIso)} if you hear nothing`, `Esperando respuesta · da seguimiento el ${fmt(dueIso)} si no responden`)}</p>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  <button onClick={() => markReplied(a)} className="min-h-9 rounded-full bg-palm/15 px-3 text-palm ring-1 ring-palm/40">{t('They confirmed ✓', 'Confirmaron ✓')}</button>
                  {days < 30 && <button onClick={() => calendar(a, dueIso)} className="min-h-9 rounded-full px-3 ring-1 ring-white/15">{t('Remind me on my calendar', 'Recordármelo en mi calendario')}</button>}
                  {days >= 30 && (EMAIL[a]
                    ? <a href={`mailto:${EMAIL[a]}?subject=${encodeURIComponent(fu.split('\n')[0].replace('Subject: ', ''))}&body=${encodeURIComponent(fu.replace(/^Subject:.*\n\n/, ''))}`} className="inline-flex min-h-9 items-center rounded-full bg-mango px-3 font-semibold text-night">{t('Send follow-up ✉', 'Enviar seguimiento ✉')}</a>
                    : <button onClick={() => copyText('fu-' + a, fu)} className="min-h-9 rounded-full bg-mango px-3 font-semibold text-night">{copied === 'fu-' + a ? t('Copied ✓', 'Copiada ✓') : t('Copy follow-up letter', 'Copiar carta de seguimiento')}</button>)}
                </span>
                {days >= 45 && <p className="mt-2 text-ink/70">{t('Still nothing after 45 days? You can report it to the FTC at ', 'Si después de 45 días no hay nada, puedes reportarlo a la FTC en ')}<a href="https://reportfraud.ftc.gov/" target="_blank" rel="noopener noreferrer" className="text-teal underline">reportfraud.ftc.gov</a>{t(' and to your state attorney general’s consumer protection office.', ' y a la oficina de protección al consumidor del fiscal general de tu estado.')}</p>}
              </div>
            );
          })()}
        </li>))}</ul>
      <p className="mt-3 text-xs text-ink/50">{t('Most companies first email you a link to confirm it\'s you; the deletion only happens after you click it. They usually answer within 30–45 days. After you tap “I sent it”, Marriage Mode keeps the date, reminds you when to follow up and writes the follow-up letter for you.', 'La mayoría primero te envía un enlace para confirmar que eres tú; la eliminación solo ocurre después de abrirlo. Las empresas suelen responder en 30 a 45 días. Cuando tocas “La envié”, Marriage Mode guarda la fecha, te recuerda cuándo dar seguimiento y escribe la carta de seguimiento por ti.')}</p>
    </div></div>
  );
}
