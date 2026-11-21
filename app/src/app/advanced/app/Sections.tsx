/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LESSONS, WS_ITEMS, answer, differences, type Answer } from '@/lib/adv/learn';
import { sweepLock, type Stage, type AdvState } from '@/lib/adv/store';
import { CATEGORIES, CAT_LABEL, sortMostAccess, type Category, type Flag, type Rel } from '@/lib/adv/sweep';
import { SOCIALS } from '@/lib/adv/platforms';
import { DEMO_FILES, DEMO_EXES } from '@/lib/adv/demo';
import { readInbox, readSocial, readDevice, type Kind, type SweepResult } from '@/lib/adv/io';
import { accountFor, status } from '@/lib/adv/accounts';
import { backupOf, enqueue, nextBatch, confirmBatch, undoItem, BATCH, PAUSE_MS } from '@/lib/adv/queue';
import { searchesFor, DEMO_IDS, type IdType } from '@/lib/adv/solo';
import { reply, MIA_SAFETY } from '@/lib/adv/mia';
import { buildReport, reportText, encodeReport, decodeReport, bothView, nextRecheck, recheck, type Report } from '@/lib/adv/report';
import { BASE } from '@/lib/base';
import { Card, Btn, H, Pill, Check, HumanLink, fmtDate, useAdv } from './ui';

// ---------- Job 2: Learn ----------
const ORDER: Record<Stage, string[]> = { dating: ['comparison', 'temptation', 'boundaries'], engaged: ['exes', 'boundaries', 'comparison'], newlywed: ['boundaries', 'burden', 'exes'], married: ['burden', 'algorithm', 'boundaries'], rebuilding: ['boundaries', 'exes', 'temptation'] };
export function Learn() {
  const { s, set, t, es } = useAdv(); const [open, setOpen] = useState<string | null>(null);
  const first = ORDER[s.intake!.stage]; const lessons = [...LESSONS].sort((a, b) => (first.indexOf(a.id) + 1 || 9) - (first.indexOf(b.id) + 1 || 9));
  const L = lessons.find((l) => l.id === open);
  if (L) return (<article className="mx-auto max-w-2xl">
    <button onClick={() => setOpen(null)} className="mb-3 min-h-11 text-sm text-ink/60 underline underline-offset-4">← {t('All lessons', 'Todas las lecciones')}</button>
    <H sub={t('About 3 minutes', 'Unos 3 minutos')}>{L.title[es ? 1 : 0]}</H>
    <div className="space-y-4 text-[17px] leading-relaxed text-ink/90">{L.body[es ? 1 : 0].map((p, i) => <p key={i}>{p}</p>)}</div>
    <Card tone="gold" className="mt-6"><p className="text-sm font-semibold text-lagoon">{t('Reflect', 'Reflexiona')}</p><p className="mt-1">{L.reflect[es ? 1 : 0]}</p></Card>
    <Card tone="rose" className="mt-3"><p className="text-sm font-semibold text-mango">{t('Do this', 'Haz esto')}</p><p className="mt-1">{L.action[es ? 1 : 0]}</p></Card>
    <div className="mt-5 flex flex-wrap gap-3"><Btn onClick={() => { set((x) => ({ ...x, learnRead: { ...x.learnRead, [L.id]: true } })); setOpen(null); }}>{s.learnRead[L.id] ? t('Read ✓ · back', 'Leída ✓ · volver') : t('Mark as read', 'Marcar como leída')}</Btn><HumanLink /></div>
  </article>);
  return (<>
    <H sub={t('Six short lessons on why social media strains relationships. Ordered for your stage.', 'Seis lecciones cortas sobre por qué las redes tensan las relaciones. En orden para tu etapa.')}>{t('Learn', 'Aprender')}</H>
    <div className="grid gap-3 sm:grid-cols-2">{lessons.map((l, i) => <button key={l.id} onClick={() => setOpen(l.id)} className="btn-press flex min-h-20 items-center justify-between gap-3 rounded-3xl bg-white/[0.035] p-5 text-left ring-1 ring-white/10 hover:ring-mango/40">
      <span><span className="text-xs text-ink/50">{i + 1} · {t('3 min', '3 min')}{i < 3 ? ` · ${t('suggested for you', 'sugerida para ti')}` : ''}</span><span className="block font-display text-lg font-semibold">{l.title[es ? 1 : 0]}</span></span>
      {s.learnRead[l.id] ? <Pill tone="ok">✓ {t('Read', 'Leída')}</Pill> : <span aria-hidden="true" className="text-mango">→</span>}</button>)}</div>
    <Worksheet />
  </>);
}
function Worksheet() {
  const { s, set, t, es } = useAdv(); const [who, setWho] = useState<'a' | 'b'>(s.worksheet.aDone ? 'b' : 'a'); const ws = s.worksheet;
  const both = !!ws.aDone && !!ws.bDone; const diffs = new Set(differences(ws)); const done = who === 'a' ? ws.aDone : ws.bDone;
  const OPTS: [Answer, string, string][] = [['ok', 'OK with me', 'Está bien'], ['talk', 'Talk first', 'Hablemos antes'], ['no', 'Not OK', 'No está bien']];
  const label = (a?: Answer) => OPTS.find((o) => o[0] === a)?.[es ? 2 : 1] ?? '—';
  return (<Card className="mt-6">
    <h2 className="font-display text-2xl font-semibold">{t('Couple agreement worksheet', 'Hoja de acuerdos de pareja')}</h2>
    <p className="mt-1 text-sm text-ink/65">{t('Each partner answers separately first. Answers stay hidden until both are finished, and nobody can edit the other’s answers.', 'Cada uno responde por separado primero. Las respuestas quedan ocultas hasta que ambos terminen, y nadie puede editar las del otro.')}</p>
    {!both ? (<>
      <div role="tablist" className="mt-4 flex gap-2">{(['a', 'b'] as const).map((w) => <Btn key={w} kind={who === w ? 'primary' : 'ghost'} onClick={() => setWho(w)} role="tab" aria-selected={who === w}>{w === 'a' ? t('Partner A', 'Pareja A') : t('Partner B', 'Pareja B')}{(w === 'a' ? ws.aDone : ws.bDone) ? ' ✓' : ''}</Btn>)}</div>
      {done ? <p className="mt-4 text-ink/70">{t('Finished and locked. Waiting for the other partner.', 'Terminado y bloqueado. Esperando a la otra persona.')}</p> : (<>
        <ul className="mt-4 space-y-3">{WS_ITEMS.map((i) => <li key={i.id}><p className="font-medium">{i.q[es ? 1 : 0]}</p><div className="mt-1 flex flex-wrap gap-2">{OPTS.map(([v, en, sp]) => <Btn key={v} kind={ws[who][i.id] === v ? 'primary' : 'ghost'} className="!min-h-11 !px-4 !py-1.5 text-sm" onClick={() => set((x) => ({ ...x, worksheet: answer(x.worksheet, who, i.id, v) }))}>{es ? sp : en}</Btn>)}</div></li>)}</ul>
        <Btn className="mt-4" disabled={WS_ITEMS.some((i) => !ws[who][i.id])} onClick={() => { set((x) => ({ ...x, worksheet: { ...x.worksheet, [who === 'a' ? 'aDone' : 'bDone']: true } })); setWho(who === 'a' ? 'b' : 'a'); }}>{t('I’m finished: lock my answers', 'Terminé: bloquear mis respuestas')}</Btn>
      </>)}
    </>) : (<div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="text-ink/60"><th className="py-2 pr-3 font-medium">{t('Topic', 'Tema')}</th><th className="py-2 pr-3 font-medium">A</th><th className="py-2 font-medium">B</th></tr></thead>
      <tbody>{WS_ITEMS.map((i) => <tr key={i.id} className={`border-t border-white/10 ${diffs.has(i.id) ? 'bg-mango/10' : ''}`}><td className="py-2 pr-3">{i.q[es ? 1 : 0]}{diffs.has(i.id) && <span className="ml-2"><Pill tone="rose">{t('Talk about this', 'Hablen de esto')}</Pill></span>}</td><td className="py-2 pr-3">{label(ws.a[i.id])}</td><td className="py-2">{label(ws.b[i.id])}</td></tr>)}</tbody></table>
      <p className="mt-3 text-sm text-ink/70">{diffs.size ? t(`${diffs.size} difference${diffs.size > 1 ? 's' : ''} to talk through. Start with the smallest.`, `${diffs.size} diferencia(s) para hablar. Empiecen por la más pequeña.`) : t('You agree on everything here.', 'Están de acuerdo en todo.')}</p></div>)}
  </Card>);
}

// ---------- Jobs 3 + 4: the Sweep ----------
export function Sweep() {
  const { s, set, t, es, go } = useAdv(); const lock = sweepLock(s.intake); const [busy, setBusy] = useState(''); const [err, setErr] = useState(''); const [exes, setExes] = useState(s.exes);
  const known = () => ({ exes: exes.split(/[,\n]/).map((x) => x.trim()).filter(Boolean), pastMatches: s.matches });
  const apply = (r: SweepResult, file: string) => set((x) => {
    const matches = [...new Set([...x.matches, ...r.matches])];
    const accounts = [...x.accounts]; for (const d of r.dating) if (!accounts.some((a) => a.id === d.id)) accounts.push(accountFor(d.id, t('Sweep auto-discovery', 'Detección automática'), d.evidence));
    const flags = [...x.flags.filter((f) => !f.source.includes(`(${file})`)), ...r.flags];
    return { ...x, accounts, flags, sources: [...new Set([...x.sources, file])], matches, exes };
  });
  async function run(kind: Kind, name: string, text: string | null, file?: File) {
    setErr(''); setBusy(t('Reading on this device…', 'Leyendo en este dispositivo…'));
    try {
      if (kind === 'inbox') { const r = await readInbox(name, text, file, setBusy); apply(r, name); return r; }
      const k = known();
      const r = kind === 'social' ? await readSocial(name, text, file, k, setBusy) : readDevice(name, text ?? await file!.text(), k);
      apply(r, name); if (r.note) setErr(r.note); return r;
    } catch { setErr(t('That file could not be read. Use the platform’s JSON or ZIP download, a .txt/.mbox inbox export, or a .vcf / SMS Backup XML device export.', 'No se pudo leer ese archivo. Usa la descarga JSON o ZIP de la plataforma, un correo .txt/.mbox o un .vcf / XML de SMS Backup.')); }
    finally { setBusy(''); }
  }
  async function demo() {
    setExes(DEMO_EXES.join(', '));
    const inbox = await readInbox('demo-inbox.txt', DEMO_FILES[0].text);
    const k = { exes: DEMO_EXES, pastMatches: inbox.matches };
    const soc = await readSocial('demo-social.json', DEMO_FILES[1].text, undefined, k); const dev = readDevice('demo-device.json', DEMO_FILES[2].text, k);
    set((x) => { const accounts = [...x.accounts]; for (const d of inbox.dating) if (!accounts.some((a) => a.id === d.id)) accounts.push(accountFor(d.id, t('Sweep auto-discovery (demo)', 'Detección automática (prueba)'), d.evidence));
      return { ...x, accounts, flags: [...x.flags.filter((f) => !/demo-/.test(f.source)), ...inbox.flags, ...soc.flags, ...dev.flags], sources: [...new Set([...x.sources, ...DEMO_FILES.map((f) => f.name)])], matches: [...new Set([...x.matches, ...inbox.matches])], exes: DEMO_EXES.join(', ') }; });
  }
  if (lock.length) return <Card tone="warn"><H>🔒 {t('The Sweep is locked', 'La Revisión está bloqueada')}</H><p>{t('Add a valid partner email and tick “I understand my results will go to my partner” to unlock it.', 'Agrega un correo válido de tu pareja y marca “Entiendo que mis resultados irán a mi pareja” para desbloquearla.')}</p></Card>;
  const counts = CATEGORIES.map((c) => [c, s.flags.filter((f) => (c === 'risque' ? f.risque : f.category === c)).length] as const);
  return (<>
    <H sub={t('Your own exports, read on this device. Nothing is uploaded. No logins, no access to anyone else’s account.', 'Tus propias exportaciones, leídas en este dispositivo. No se sube nada. Sin inicios de sesión ni acceso a cuentas de otros.')}>{t('Social Sweep', 'Revisión social')}</H>
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid gap-4">
        <Card tone="rose"><h2 className="font-semibold">{t('Try it with demo data first', 'Pruébala primero con datos de prueba')}</h2><p className="mt-1 text-sm text-ink/70">{t('Three fictional files (inbox, social, device). No real people.', 'Tres archivos ficticios (correo, redes, dispositivo). Sin personas reales.')}</p><Btn className="mt-3" onClick={demo}>{t('Run the demo Sweep', 'Hacer la Revisión de prueba')}</Btn></Card>
        <Card><label htmlFor="exes" className="font-semibold">{t('Exes and people you want the Sweep to watch for', 'Exparejas y personas que la Revisión debe buscar')}</label><p className="text-sm text-ink/60">{t('Names or usernames, separated by commas. Past dating matches are found from your inbox automatically.', 'Nombres o usuarios separados por comas. Los matches anteriores se encuentran en tu correo automáticamente.')}</p>
          <textarea id="exes" value={exes} onChange={(e) => setExes(e.target.value)} rows={2} className="mt-2 w-full rounded-2xl bg-night/60 p-3 ring-1 ring-white/15" /></Card>
        {([['inbox', t('Email inbox + receipts (finds dating accounts)', 'Correo + recibos (encuentra cuentas de citas)'), '.txt,.mbox,.eml,.html,.json,.csv,.zip'], ['social', t('Social media data download', 'Descarga de datos de redes sociales'), '.zip,.json,.html,.csv'], ['device', t('Device: contacts, call log, text log (times only)', 'Dispositivo: contactos, llamadas y mensajes (solo horas)'), '.vcf,.xml,.json']] as const).map(([k, label, accept]) => (
          <Card key={k}><label className="font-semibold" htmlFor={`f-${k}`}>{label}</label>
            <input id={`f-${k}`} type="file" accept={accept} className="mt-2 block w-full text-sm file:mr-3 file:min-h-11 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:text-ink" onChange={(e) => { const f = e.target.files?.[0]; if (f) void (async () => { await run(k, f.name, /\.zip$/i.test(f.name) ? null : await f.text(), f); e.target.value = ''; })(); }} />
            {k === 'device' && <p className="mt-2 text-xs text-ink/55">{t('Only who and when are read. Message content is never read or kept.', 'Solo se lee quién y cuándo. El contenido de los mensajes nunca se lee ni se guarda.')}</p>}</Card>))}
        {busy && <p role="status" className="text-sm text-lagoon">{busy}</p>}{err && <p role="alert" className="text-sm text-coral">{err}</p>}
      </div>
      <div className="grid content-start gap-4">
        <Card><h2 className="font-semibold">{t('Found so far', 'Encontrado hasta ahora')}</h2>
          <ul className="mt-2 grid grid-cols-2 gap-2 text-sm">{counts.map(([c, n]) => <li key={c} className={`flex items-center justify-between rounded-xl px-3 py-2 ring-1 ${n ? 'ring-mango/30' : 'ring-white/10 text-ink/50'}`}><span>{CAT_LABEL[c][es ? 1 : 0]}</span><strong>{n}</strong></li>)}</ul>
          <Btn className="mt-4 w-full" disabled={!s.flags.length} onClick={() => go('review')}>{t('Review every flag', 'Revisar cada marca')} ({s.flags.length})</Btn></Card>
        <Card><h2 className="font-semibold">{t('How to get each export', 'Cómo obtener cada exportación')}</h2>
          <ul className="mt-2 space-y-2 text-sm">{SOCIALS.map((p) => <li key={p.id}><a href={p.exportUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-teal underline underline-offset-4">{p.name}</a> <span className="text-ink/65">· {es ? p.exportHelpEs : p.exportHelp}</span></li>)}
            <li><span className="font-medium">Email</span> <span className="text-ink/65">· {t('Google Takeout → Mail (.mbox), or copy and paste receipts into a .txt file.', 'Google Takeout → Correo (.mbox), o copia y pega recibos en un .txt.')}</span></li>
            <li><span className="font-medium">{t('Device', 'Dispositivo')}</span> <span className="text-ink/65">· {t('Contacts → Export (.vcf). Android: “SMS Backup & Restore” (free) exports calls and texts as XML.', 'Contactos → Exportar (.vcf). Android: “SMS Backup & Restore” (gratis) exporta llamadas y mensajes en XML.')}</span></li></ul></Card>
      </div>
    </div>
  </>);
}

// ---------- Jobs 5 + 8: Review, access levels and the submit-ready queue ----------
const RELS: Rel[] = ['close friend', 'mutual', 'friend', 'follower', 'restricted', 'following', 'not following back', 'muted', 'blocked'];
export function Review() {
  const { s, set, t, es } = useAdv();
  const [cat, setCat] = useState<Category | 'all'>('all'); const [plat, setPlat] = useState('all'); const [acc, setAcc] = useState<'all' | Rel | 'unknown'>('all'); const [sort, setSort] = useState<'access' | 'none'>('access');
  const [sel, setSel] = useState<Set<string>>(new Set()); const [msg, setMsg] = useState('');
  const queued = new Set(s.queue.filter((q) => q.state !== 'undone').map((q) => q.flagId));
  let list = s.flags.filter((f) => (cat === 'all' || (cat === 'risque' ? f.risque : f.category === cat)) && (plat === 'all' || f.platform === plat) && (acc === 'all' || (acc === 'unknown' ? !!f.access && !f.access.rel : f.access?.rel === acc)));
  if (sort === 'access') list = sortMostAccess(list);
  const platforms = [...new Set(s.flags.map((f) => f.platform))];
  const toggle = (id: string, on: boolean) => setSel((x) => { const n = new Set(x); if (on) n.add(id); else n.delete(id); return n; });
  const chosen = s.flags.filter((f) => sel.has(f.id)); const backedUp = chosen.filter((f) => s.backups.some((b) => b.flagId === f.id));
  if (!s.flags.length) return <Card><H>{t('Nothing to review yet', 'Aún no hay nada que revisar')}</H><p className="text-ink/70">{t('Run the Sweep (or the demo) first.', 'Primero haz la Revisión (o la prueba).')}</p></Card>;
  return (<>
    <H sub={t('Every flag shows why and where it came from. You decide. Nothing is removed without your own tap on the platform’s button.', 'Cada marca muestra por qué y de dónde salió. Tú decides. Nada se quita sin que toques el botón de la plataforma.')}>{t('Review and remove', 'Revisar y quitar')}</H>
    <Card tone="warn" className="mb-4"><p className="text-sm"><strong>{t('Platform limits', 'Límites de las plataformas')}:</strong> {t('most platforms do NOT allow a third-party tool to bulk-unfollow or bulk-delete, and most platforms do NOT expose who viewed a profile (story viewers are the limited exception, where the platform itself shows them). The submit-ready queue exists because of these limits.', 'la mayoría de las plataformas NO permiten que una herramienta externa deje de seguir o borre en grupo, y la mayoría NO muestra quién vio un perfil (quién ve tus historias es la excepción limitada, cuando la plataforma misma lo muestra). La cola lista-para-enviar existe por estos límites.')}</p></Card>
    <Card className="mb-4"><div className="grid gap-3 sm:grid-cols-4">
      <Sel label={t('Category', 'Categoría')} value={cat} onChange={(v) => setCat(v as Category)} opts={[['all', t('All flagged', 'Todo lo marcado')], ...CATEGORIES.map((c) => [c, CAT_LABEL[c][es ? 1 : 0]] as [string, string])]} />
      <Sel label={t('Platform', 'Plataforma')} value={plat} onChange={setPlat} opts={[['all', t('All', 'Todas')], ...platforms.map((p) => [p, p] as [string, string])]} />
      <Sel label={t('Access level', 'Nivel de acceso')} value={acc} onChange={(v) => setAcc(v as Rel)} opts={[['all', t('All', 'Todos')], ...RELS.map((r) => [r, r] as [string, string]), ['unknown', t('Unknown', 'Desconocido')]]} />
      <Sel label={t('Sort', 'Orden')} value={sort} onChange={(v) => setSort(v as 'access')} opts={[['access', t('Most access first', 'Más acceso primero')], ['none', t('As found', 'Como se encontró')]]} />
    </div>
      <div className="mt-3 flex flex-wrap gap-2"><Btn kind="ghost" onClick={() => setSel(new Set(list.map((f) => f.id)))}>{t(`Select all shown (${list.length})`, `Seleccionar lo mostrado (${list.length})`)}</Btn><Btn kind="quiet" onClick={() => setSel(new Set())}>{t('Clear selection', 'Quitar selección')}</Btn></div></Card>
    <ul className="grid gap-3">{list.map((f) => <FlagRow key={f.id} f={f} on={sel.has(f.id)} onToggle={(v) => toggle(f.id, v)} queued={queued.has(f.id)} />)}</ul>
    <div className="sticky bottom-3 z-30 mt-4"><Card className="!bg-[#24131b] shadow-[0_20px_60px_-10px_rgb(0_0_0/.9)] !ring-mango/50 backdrop-blur-none"><p className="text-sm">{t(`${chosen.length} selected · ${backedUp.length} backed up`, `${chosen.length} seleccionados · ${backedUp.length} respaldados`)}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Btn kind="ghost" disabled={!chosen.length || backedUp.length === chosen.length} onClick={() => set((x) => ({ ...x, backups: [...x.backups.filter((b) => !sel.has(b.flagId)), ...chosen.map((f) => backupOf(f))] }))}>1 · {t('Save backup', 'Guardar respaldo')}</Btn>
        <Btn disabled={!chosen.length || backedUp.length !== chosen.length} onClick={() => { const r = enqueue(s.queue, s.backups, chosen); set((x) => ({ ...x, queue: r.queue })); setMsg(r.refused.length ? t(`${r.refused.length} not added: no backup.`, `${r.refused.length} sin agregar: sin respaldo.`) : t(`Added ${chosen.length} to the queue.`, `Se agregaron ${chosen.length} a la cola.`)); setSel(new Set()); }}>2 · {t('Add to queue', 'Agregar a la cola')}</Btn>
      </div>{msg && <p role="status" className="mt-2 text-sm text-lagoon">{msg}</p>}<p className="mt-1 text-xs text-ink/55">{t('No backup, no queue. Backups stay until you delete them in Settings → Clear Data.', 'Sin respaldo, no hay cola. Los respaldos quedan hasta que los borres en Ajustes → Borrar datos.')}</p></Card></div>
    <Queue />
    <div className="mt-4"><HumanLink /></div>
  </>);
}
function Sel({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: [string, string][] }) {
  return <label className="text-sm"><span className="text-ink/60">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 min-h-11 w-full rounded-2xl bg-night/60 px-3 ring-1 ring-white/15">{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>;
}
function FlagRow({ f, on, onToggle, queued }: { f: Flag; on: boolean; onToggle: (v: boolean) => void; queued: boolean }) {
  const { s, set, t, es } = useAdv(); const kept = !!s.checklist[`kept-${f.id}`];
  return (<li><Card className={on ? '!ring-mango/60' : ''}><div className="flex items-start gap-3">
    <input type="checkbox" checked={on} onChange={(e) => onToggle(e.target.checked)} aria-label={`${t('Select', 'Seleccionar')} ${f.who}`} className="mt-1 size-5 shrink-0 accent-[#E8A4A9]" />
    <div className="min-w-0 grow">
      <div className="flex flex-wrap items-center gap-2"><strong className="font-display text-lg">{f.who}</strong><Pill>{CAT_LABEL[f.category][es ? 1 : 0]}</Pill>{f.risque && <Pill tone="rose">{CAT_LABEL.risque[es ? 1 : 0]}</Pill>}<Pill tone="gold">{f.platform}</Pill>{queued && <Pill tone="ok">{t('In queue', 'En la cola')}</Pill>}{kept && <Pill>{t('Kept: reviewed', 'Se queda: revisado')}</Pill>}</div>
      <p className="mt-1">{es ? f.whyEs : f.why}</p>
      <p className="mt-1 break-words text-xs text-ink/55">{t('Source', 'Origen')}: {f.source} · {f.evidence}</p>
      {f.access && <p className="mt-2 text-sm">{f.access.rel ? <>{t('Access', 'Acceso')}: <strong>{f.access.rel}</strong> · {t('can see', 'puede ver')}: {f.access.canSee === undefined ? <a className="text-teal underline" href={f.link} target="_blank" rel="noopener noreferrer">{t('Unknown - check in app', 'Desconocido - revisa en la app')}</a> : f.access.canSee.length ? f.access.canSee.join(', ') : t('nothing beyond your public name and photo', 'nada más que tu nombre y foto públicos')}</> : <a className="text-teal underline" href={f.link} target="_blank" rel="noopener noreferrer">Unknown - check in app</a>}</p>}
      {!queued && <button onClick={() => set((x) => ({ ...x, checklist: { ...x.checklist, [`kept-${f.id}`]: !kept } }))} className="mt-1 min-h-11 text-sm text-ink/60 underline underline-offset-4">{kept ? t('Undo “keep”', 'Deshacer “se queda”') : t('Reviewed: keep this', 'Revisado: se queda')}</button>}
    </div></div></Card></li>);
}
function Queue() {
  const { s, set, t } = useAdv(); const [paused, setPaused] = useState(false); const [wait, setWait] = useState(0); const batch = nextBatch(s.queue);
  useEffect(() => { if (wait <= 0) return; const id = setTimeout(() => setWait((w) => w - 1000), 1000); return () => clearTimeout(id); }, [wait]);
  const done = s.queue.filter((q) => q.state !== 'queued'); const batchNo = Math.max(0, ...s.queue.map((q) => q.batch ?? 0)) + 1;
  if (!s.queue.length) return null;
  const LBL: Record<string, string> = { Automated: t('Automated', 'Automático'), Guided: t('Guided', 'Guiado'), Manual: t('Manual', 'Manual') };
  return (<section className="mt-8">
    <h2 className="font-display text-2xl font-semibold">{t('Submit-ready queue', 'Cola lista para enviar')}</h2>
    <p className="text-sm text-ink/65">{t(`Batches of ${BATCH} with a short pause between, so your account never looks automated. Each item opens the exact screen; you tap the platform’s own Submit / Confirm.`, `Grupos de ${BATCH} con una pausa entre ellos, para que tu cuenta no parezca automatizada. Cada elemento abre la pantalla exacta; tú tocas Enviar / Confirmar de la plataforma.`)}</p>
    <div className="mt-3 flex flex-wrap gap-2"><Btn kind="ghost" onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? t('Resume', 'Reanudar') : t('Pause', 'Pausar')}</Btn><Pill tone="gold">{t(`${done.length} done · ${s.queue.length - done.length} waiting`, `${done.length} hechos · ${s.queue.length - done.length} esperando`)}</Pill></div>
    {paused ? <Card className="mt-3"><p>{t('Paused. Resume when you are ready.', 'En pausa. Reanuda cuando quieras.')}</p></Card> : wait > 0 ? <Card className="mt-3"><p role="status">{t(`Short pause between batches… ${Math.ceil(wait / 1000)}s`, `Pausa corta entre grupos… ${Math.ceil(wait / 1000)}s`)}</p></Card> : batch.length > 0 && (
      <Card tone="rose" className="mt-3"><h3 className="font-semibold">{t(`Batch ${batchNo}: ${batch.length} item${batch.length > 1 ? 's' : ''}`, `Grupo ${batchNo}: ${batch.length} elemento(s)`)}</h3>
        <ol className="mt-3 space-y-3">{batch.map((q) => <li key={q.id} className="rounded-2xl bg-night/40 p-3 ring-1 ring-white/10">
          <div className="flex flex-wrap items-center gap-2"><strong>{q.who}</strong><Pill tone="dark">{LBL[q.mode]}</Pill><Pill>{q.action}</Pill><span className="text-xs text-ink/55">{q.platform}</span></div>
          <p className="mt-1 text-sm text-ink/75">{q.reason}</p><p className="mt-1 text-xs text-ink/55">{q.confirmText}</p>
          {q.link && <Btn kind="ghost" className="mt-2" href={q.link}>{t('Open the exact screen', 'Abrir la pantalla exacta')} ↗</Btn>}</li>)}</ol>
        <Btn className="mt-4" onClick={() => { set((x) => ({ ...x, queue: confirmBatch(x.queue, batch.map((b) => b.id), batchNo) })); setWait(PAUSE_MS); }}>{t(`I tapped Submit on these ${batch.length}: confirm batch`, `Toqué Enviar en estos ${batch.length}: confirmar grupo`)}</Btn>
      </Card>)}
    {done.length > 0 && <Card className="mt-3"><h3 className="font-semibold">{t('Completed (undo available)', 'Completados (se puede deshacer)')}</h3><ul className="mt-2 space-y-2 text-sm">{done.map((q) => <li key={q.id} className="flex flex-wrap items-center justify-between gap-2"><span>{q.state === 'undone' ? '↺' : '✓'} {q.who} · {q.action} · {q.platform}{q.state === 'undone' && <span className="text-ink/60"> — {q.undo}</span>}</span>{q.state === 'done' && <Btn kind="quiet" onClick={() => set((x) => ({ ...x, queue: undoItem(x.queue, q.id) }))}>{t('Undo / restore', 'Deshacer / restaurar')}</Btn>}</li>)}</ul></Card>}
  </section>);
}

// ---------- Job 7: free Solo Search ----------
export function Solo() {
  const { s, set, t } = useAdv(); const [type, setType] = useState<IdType>('username'); const [val, setVal] = useState('');
  const TYPES: [IdType, string, string][] = [['email', 'Email', 'Correo'], ['username', 'Username', 'Usuario'], ['phone', 'Phone number', 'Teléfono'], ['namecity', 'Name + city', 'Nombre + ciudad'], ['photo', 'Photo (reverse look-up)', 'Foto (búsqueda inversa)'], ['other', 'Other identifier', 'Otro identificador']];
  const add = (ty: IdType, v: string) => { const list = searchesFor(ty, v); set((x) => ({ ...x, solo: [...x.solo, ...list.filter((q) => !x.solo.some((y) => y.url === q.url)).map((q, i) => ({ id: `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}-${i}`, idType: ty, value: v, site: q.site, url: q.url }))] })); };
  const record = (id: string, result: 'found' | 'none', note?: string, link?: string) => set((x) => {
    const item = x.solo.find((y) => y.id === id)!; const solo = x.solo.map((y) => (y.id === id ? { ...y, result, note, link, at: new Date().toISOString() } : y));
    if (result !== 'found') return { ...x, solo };
    const flag: Flag = { id: `solo-${id}`, who: item.value, platform: 'solo', category: 'dating', risque: false, why: `Found on ${item.site} by searching ${item.idType} “${item.value}”${note ? `: ${note}` : ''}.`, whyEs: `Encontrado en ${item.site} al buscar ${item.idType} “${item.value}”${note ? `: ${note}` : ''}.`, source: 'Solo Search', evidence: `${item.site} search: ${item.url}${link ? ` · result: ${link}` : ''}`, link: link || item.url };
    return { ...x, solo, flags: [...x.flags.filter((f) => f.id !== flag.id), flag] };
  });
  const groups = useMemo(() => { const m = new Map<string, typeof s.solo>(); for (const q of s.solo) m.set(`${q.idType}:${q.value}`, [...(m.get(`${q.idType}:${q.value}`) ?? []), q]); return [...m.entries()]; }, [s.solo]);
  return (<>
    <H sub={t('Free, for anyone whose partner will not join. No partner email needed, no charge.', 'Gratis, para quien su pareja no quiere participar. No necesita el correo de tu pareja, sin costo.')}>{t('Solo Search', 'Búsqueda Solo')} <Pill tone="ok">{t('Free', 'Gratis')}</Pill></H>
    <Card tone="warn" className="mb-4"><p className="text-sm"><strong>{t('Public only', 'Solo información pública')}:</strong> {t('Solo Search checks public information only. It does NOT use breached or leaked databases, does NOT open private accounts, does NOT bypass any login, and does NOT search “all of the internet”. Searches open in your own browser; we never see them. People-search sites that sell home addresses are not included.', 'La Búsqueda Solo revisa solo información pública. NO usa bases de datos filtradas, NO abre cuentas privadas, NO evita ningún inicio de sesión y NO busca en “todo internet”. Las búsquedas se abren en tu propio navegador; nunca las vemos. No se incluyen sitios que venden direcciones de casas.')}</p></Card>
    <Card><div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
      <label className="text-sm"><span className="text-ink/60">{t('Type', 'Tipo')}</span><select value={type} onChange={(e) => setType(e.target.value as IdType)} className="mt-1 min-h-12 w-full rounded-2xl bg-night/60 px-3 ring-1 ring-white/15">{TYPES.map(([k, en, es]) => <option key={k} value={k}>{t(en, es)}</option>)}</select></label>
      <label className="text-sm"><span className="text-ink/60">{t('Identifier', 'Identificador')}</span><input value={val} onChange={(e) => setVal(e.target.value)} placeholder={type === 'namecity' ? 'Name, City' : type === 'photo' ? 'https://… (or leave blank to upload on the site)' : ''} className="mt-1 min-h-12 w-full rounded-2xl bg-night/60 px-4 ring-1 ring-white/15" /></label>
      <Btn disabled={!val.trim() && type !== 'photo'} onClick={() => { add(type, val.trim() || 'photo upload'); setVal(''); }}>{t('Make searches', 'Crear búsquedas')}</Btn></div>
      <Btn kind="quiet" className="mt-2" onClick={() => DEMO_IDS.forEach((d) => add(d.type, d.value))}>{t('Add the demo identifiers (fictional)', 'Agregar identificadores de prueba (ficticios)')}</Btn></Card>
    <div className="mt-4 grid gap-4">{groups.map(([k, items]) => <Card key={k}><h3 className="font-semibold">{items[0].idType}: <span className="text-mango">{items[0].value}</span></h3>
      <ul className="mt-2 divide-y divide-white/10">{items.map((q) => <SoloRow key={q.id} q={q} onRecord={record} />)}</ul></Card>)}</div>
    <p className="mt-4 text-sm text-ink/60">{t('Feeling unsafe? Free, confidential help: 1-800-799-7233 · text START to 88788.', '¿No te sientes a salvo? Ayuda gratis y confidencial: 1-800-799-7233 · envía START al 88788.')}</p>
  </>);
}
function SoloRow({ q, onRecord }: { q: AdvState['solo'][number]; onRecord: (id: string, r: 'found' | 'none', note?: string, link?: string) => void }) {
  const { t } = useAdv(); const [note, setNote] = useState(q.note ?? ''); const [link, setLink] = useState(q.link ?? '');
  return (<li className="flex flex-wrap items-center gap-2 py-3"><a href={q.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 grow items-center font-medium text-teal underline underline-offset-4">{q.site} ↗</a>
    {q.result ? <Pill tone={q.result === 'found' ? 'rose' : 'plain'}>{q.result === 'found' ? t('Found → in Review', 'Encontrado → en Revisar') : t('Nothing found', 'Nada encontrado')}</Pill> : (<>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('Note (optional)', 'Nota (opcional)')} aria-label={t('Note', 'Nota')} className="min-h-11 w-40 rounded-xl bg-night/60 px-3 text-sm ring-1 ring-white/15" />
      <input value={link} onChange={(e) => setLink(e.target.value)} placeholder={t('Link (optional)', 'Enlace (opcional)')} aria-label={t('Link', 'Enlace')} className="min-h-11 w-40 rounded-xl bg-night/60 px-3 text-sm ring-1 ring-white/15" />
      <Btn kind="ghost" className="!px-4" onClick={() => onRecord(q.id, 'found', note || undefined, link || undefined)}>{t('Found', 'Encontrado')}</Btn><Btn kind="quiet" className="!px-3" onClick={() => onRecord(q.id, 'none', note || undefined)}>{t('Nothing found', 'Nada encontrado')}</Btn></>)}</li>);
}

// ---------- Job 10: verified proof + the mutual partner report ----------
export function Proof() {
  const { s, set, t, es } = useAdv(); const [confirming, setConfirming] = useState(false); const [partner, setPartner] = useState<Report | null>(null); const [paste, setPaste] = useState(''); const [rc, setRc] = useState<string | null>(null);
  useEffect(() => { if (location.hash.startsWith('#p=')) setPartner(decodeReport(location.hash)); }, []);
  const closed = s.accounts.filter((a) => status(a) === 'closed'); const full = buildReport(s, 'all'); const shared = buildReport(s, s.share); const text = reportText(shared, es);
  const link = `${location.origin}${location.pathname}#p=${encodeReport(shared)}`;
  const download = (r: Report, name: string) => { const html = `<!doctype html><meta charset="utf-8"><title>Clean Slate report</title><style>body{font:16px/1.6 system-ui;max-width:640px;margin:40px auto;padding:0 16px;color:#1b1016}h1{font-family:Georgia,serif;color:#7a2048}li{margin:4px 0}</style><h1>Clean Slate report</h1><pre style="white-space:pre-wrap;font:inherit">${reportText(r, es).replace(/[<&]/g, (c) => (c === '<' ? '&lt;' : '&amp;'))}</pre><p style="color:#666;font-size:13px">Marriage Mode by Upfront Consulting with Tiff &amp; Reco LLC. Verified closed means all 4 steps confirmed by the user.</p>`; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' })); a.download = name; a.click(); };
  const TOG: [keyof typeof s.share, string, string][] = [['score', 'Score', 'Puntuación'], ['accounts', 'Closed accounts', 'Cuentas cerradas'], ['sweep', 'Sweep summary', 'Resumen de la Revisión'], ['queue', 'Queue completion', 'Cola completada']];
  const both = partner ? bothView(shared, partner) : null;
  return (<>
    <H sub={t('Proof that cleanup is done, shared only the way you choose. Never surveillance.', 'Prueba de que la limpieza está hecha, compartida solo como tú elijas. Nunca vigilancia.')}>{t('Proof and partner report', 'Prueba y reporte de pareja')}</H>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card tone="ok" className="print:bg-white print:text-black"><h2 className="font-display text-2xl font-semibold">{t('Clean Slate report', 'Reporte Clean Slate')}</h2>
        <p className="mt-1 text-sm text-ink/65">{t('Score', 'Puntuación')}: <strong>{full.score}</strong> · {fmtDate(new Date().toISOString(), es)}</p>
        <h3 className="mt-3 font-semibold">{t('Verified closed (all 4 steps)', 'Cerradas y verificadas (4 pasos)')}</h3>
        <ul className="mt-1 text-sm">{closed.length ? closed.map((a) => <li key={a.id}>✓ {a.name} · {fmtDate(a.closedAt, es)}</li>) : <li className="text-ink/60">{t('None yet', 'Ninguna aún')}</li>}</ul>
        <h3 className="mt-3 font-semibold">{t('Sweep categories', 'Categorías de la Revisión')}</h3>
        <ul className="mt-1 text-sm">{(full.sweep ?? []).map((x) => <li key={x.category}>{x.category}: {x.cleared}/{x.flagged} {t('cleared', 'resueltos')}</li>)}{!full.sweep?.length && <li className="text-ink/60">—</li>}</ul>
        <p className="mt-3 text-sm">{t('Queue', 'Cola')}: {full.queue?.done}/{full.queue?.total}</p>
        <div className="mt-4 flex flex-wrap gap-2 print:hidden"><Btn kind="ghost" onClick={() => print()}>{t('Print', 'Imprimir')}</Btn><Btn kind="ghost" onClick={() => download(full, 'clean-slate-report.html')}>{t('Download', 'Descargar')}</Btn></div></Card>
      <Card><h2 className="font-display text-2xl font-semibold">{t('Share with your partner', 'Compartir con tu pareja')}</h2>
        <p className="mt-1 text-sm text-ink/65">{t('Only what you switch on is sent or visible. Everything is off until you turn it on.', 'Solo se envía o se ve lo que actives. Todo está apagado hasta que lo enciendas.')}</p>
        {TOG.map(([k, en, sp]) => <Check key={k} id={`sh-${k}`} checked={s.share[k]} onChange={(v) => { set((x) => ({ ...x, share: { ...x.share, [k]: v } })); setConfirming(false); }}>{t(en, sp)}</Check>)}
        {!confirming ? <Btn className="mt-3" onClick={() => setConfirming(true)}>{t('Review what will be sent', 'Revisar lo que se enviará')}</Btn> : (
          <div className="mt-3 rounded-2xl bg-night/50 p-4 ring-1 ring-mango/40"><p className="text-sm text-ink/70">{t('To', 'Para')}: <strong>{s.intake?.partnerEmail}</strong></p>
            <p className="mt-2 text-xs uppercase tracking-wider text-ink/50">{t('Exactly what will be sent', 'Exactamente lo que se enviará')}</p><pre className="mt-1 whitespace-pre-wrap font-sans text-sm">{text}</pre>
            <div className="mt-3 flex flex-wrap gap-2"><Btn onClick={() => { const at = new Date().toISOString(); set((x) => ({ ...x, sent: [...x.sent, { to: x.intake!.partnerEmail, at, content: text }] })); location.href = `mailto:${encodeURIComponent(s.intake!.partnerEmail)}?subject=${encodeURIComponent(t('My Clean Slate summary', 'Mi resumen Clean Slate'))}&body=${encodeURIComponent(`${text}\n\n${t('Open it in Marriage Mode', 'Ábrelo en Marriage Mode')}: ${link}`)}`; setConfirming(false); }}>{t('Confirm and open my email to send', 'Confirmar y abrir mi correo para enviar')}</Btn><Btn kind="quiet" onClick={() => setConfirming(false)}>{t('Cancel', 'Cancelar')}</Btn></div></div>)}
        {s.sent.length > 0 && <p className="mt-3 text-xs text-ink/55">{t('Confirmed sends', 'Envíos confirmados')}: {s.sent.map((x) => `${fmtDate(x.at, es)} ${new Date(x.at).toLocaleTimeString()}`).join(' · ')}</p>}
        <Btn kind="quiet" className="mt-2" onClick={() => download(shared, 'clean-slate-shared.html')}>{t('Download the shared version', 'Descargar la versión compartida')}</Btn></Card>
      <Card><h2 className="font-display text-2xl font-semibold">{t('“We both did it”', '“Los dos lo hicimos”')}</h2>
        <p className="mt-1 text-sm text-ink/65">{t('Each partner does their own intake, sweep and sharing on their own device. Open the link your partner sent, or paste it here. Only sections you both chose to share appear.', 'Cada uno hace su registro, revisión y elección de qué compartir en su propio dispositivo. Abre el enlace que te envió tu pareja o pégalo aquí. Solo aparecen las secciones que ambos eligieron compartir.')}</p>
        {!partner ? <div className="mt-3 flex flex-wrap gap-2"><input value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={t('Paste your partner’s link', 'Pega el enlace de tu pareja')} className="min-h-11 grow rounded-2xl bg-night/60 px-4 ring-1 ring-white/15" /><Btn kind="ghost" disabled={!paste.includes('#p=')} onClick={() => setPartner(decodeReport(paste.slice(paste.indexOf('#p='))))}>{t('Open', 'Abrir')}</Btn></div> : both && (<>
          {both.rows.length ? <table className="mt-3 w-full text-sm"><thead><tr className="text-left text-ink/60"><th className="py-1"></th><th>{t('You', 'Tú')}</th><th>{partner.name}</th></tr></thead><tbody>{both.rows.map((r) => <tr key={r.key} className="border-t border-white/10"><td className="py-2">{r.key}</td><td>{r.me}</td><td>{r.them}</td></tr>)}</tbody></table> : <p className="mt-3 text-sm text-ink/70">{t('No sections are shared by both of you yet.', 'Aún no hay secciones compartidas por ambos.')}</p>}
          {both.todo.map((x) => <p key={x} className="mt-2 text-sm text-mango">→ {x}</p>)}</>)}</Card>
      <Card><h2 className="font-display text-2xl font-semibold">{t('Monthly re-check', 'Revisión mensual')}</h2>
        <p className="mt-1 text-sm text-ink/65">{t('Re-runs discovery against your closed list and flags anything that came back (re-registered app, resumed billing).', 'Vuelve a buscar en tu lista de cerradas y marca lo que regresó (app registrada de nuevo, cobro reactivado).')}</p>
        <p className="mt-2">{t('Next re-check', 'Próxima revisión')}: <strong>{nextRecheck(s)}</strong>{s.lastCheck && <span className="text-sm text-ink/60"> · {t('last', 'última')} {fmtDate(s.lastCheck, es)}</span>}</p>
        <input type="file" accept=".txt,.mbox,.eml,.html,.json,.csv" aria-label={t('New inbox export for the re-check', 'Nueva exportación de correo para la revisión')} className="mt-3 block w-full text-sm file:mr-3 file:min-h-11 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:text-ink" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const r = recheck(s, await f.text(), f.name); set((x) => ({ ...x, lastCheck: new Date().toISOString() })); setRc(r.reappeared.length ? r.reappeared.map((x) => `${x.name} — ${x.evidence}`).join('\n') : t('Nothing came back. Clean.', 'Nada regresó. Todo limpio.')); }} />
        <Btn kind="quiet" className="mt-1" onClick={() => { const r = recheck(s, DEMO_FILES[0].text, 'demo-inbox.txt'); set((x) => ({ ...x, lastCheck: new Date().toISOString() })); setRc(r.reappeared.length ? r.reappeared.map((x) => `${x.name} — ${x.evidence}`).join('\n') : t('Nothing came back. Clean.', 'Nada regresó. Todo limpio.')); }}>{t('Run the re-check on the demo inbox', 'Hacer la revisión con el correo de prueba')}</Btn>
        {rc && <pre role="status" className="mt-2 whitespace-pre-wrap font-sans text-sm text-lagoon">{rc}</pre>}</Card>
    </div>
  </>);
}

// ---------- Job 9: Mia ----------
export function MiaTab() {
  const { s, set, t, es } = useAdv(); const [text, setText] = useState(''); const [listening, setListening] = useState(false); const [speak, setSpeak] = useState(true); const end = useRef<HTMLDivElement>(null);
  const recRef = useRef<{ stop: () => void } | null>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [s.mia.length]);
  const say = (msg: string) => { if (!speak || !('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(msg.replace(/\n+/g, '. ')); u.lang = es ? 'es-US' : 'en-US'; u.rate = 0.92; const v = speechSynthesis.getVoices().find((x) => x.lang.startsWith(es ? 'es' : 'en') && /female|samantha|ava|allison|jenny|aria|paulina|monica|google/i.test(x.name)); if (v) u.voice = v; speechSynthesis.speak(u); };
  const send = (q: string) => { if (!q.trim()) return; const now = new Date().toISOString(); const a = reply(q, { s, es }); set((x) => ({ ...x, mia: [...x.mia, { role: 'user' as const, text: q, at: now }, { role: 'mia' as const, text: a, at: now }].slice(-200) })); setText(''); say(a); };
  const listen = () => { const W = window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any }; const R = W.SpeechRecognition ?? W.webkitSpeechRecognition; if (!R) { alert(t('Voice input is not available in this browser. Type instead.', 'La voz no está disponible en este navegador. Escribe en su lugar.')); return; }
    if (listening) { recRef.current?.stop(); return; } const r = new R(); r.lang = es ? 'es-US' : 'en-US'; r.interimResults = false; r.onresult = (e: any) => send(e.results[0][0].transcript); r.onend = () => setListening(false); recRef.current = r; setListening(true); r.start(); };
  const greet = s.mia.length === 0;
  return (<>
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="text-center"><img src={`${BASE}/coach/mia-poster.jpg`} alt={t('Mia, your AI coach (stock photo)', 'Mia, tu coach de IA (foto de archivo)')} className="mx-auto aspect-[3/4] w-40 rounded-3xl object-cover ring-1 ring-mango/30 lg:w-full" />
        <h1 className="mt-3 font-display text-2xl font-semibold">Mia</h1><p className="text-sm text-ink/65">{t('Your coach, on this device', 'Tu coach, en este dispositivo')}</p>
        <div className="mt-3 rounded-2xl bg-mango/10 p-3 text-left text-xs leading-relaxed ring-1 ring-mango/30" role="note">{MIA_SAFETY[es ? 1 : 0]}</div>
        <div className="mt-3"><HumanLink /></div></Card>
      <Card className="flex min-h-[60vh] flex-col">
        <div className="grow space-y-3 overflow-y-auto" aria-live="polite">
          {greet && <p className="rounded-2xl bg-white/5 p-3">{reply('hi', { s, es })}</p>}
          {s.mia.map((m, i) => <div key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-2xl p-3 ${m.role === 'user' ? 'ml-auto bg-mango/15' : 'bg-white/5'}`}>{m.text}</div>)}<div ref={end} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">{[t('What should I do next?', '¿Qué hago ahora?'), t('How am I doing?', '¿Cómo voy?'), t('How do I talk to my partner?', '¿Cómo hablo con mi pareja?')].map((q) => <Btn key={q} kind="ghost" className="!min-h-10 !px-3 text-sm" onClick={() => send(q)}>{q}</Btn>)}</div>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(text); }}>
          <input value={text} onChange={(e) => setText(e.target.value)} aria-label={t('Message Mia', 'Escribe a Mia')} placeholder={t('Type or tap the mic…', 'Escribe o toca el micrófono…')} className="min-h-12 grow rounded-full bg-night/60 px-5 ring-1 ring-white/15" />
          <Btn kind={listening ? 'primary' : 'ghost'} onClick={listen} aria-label={t('Speak to Mia', 'Hablar con Mia')} aria-pressed={listening}>🎙</Btn><Btn type="submit">{t('Send', 'Enviar')}</Btn></form>
        <label className="mt-2 flex min-h-11 items-center gap-2 text-sm text-ink/65"><input type="checkbox" checked={speak} onChange={(e) => setSpeak(e.target.checked)} className="size-5 accent-[#E8A4A9]" />{t('Mia speaks her replies', 'Mia dice sus respuestas en voz alta')}</label>
      </Card>
    </div>
  </>);
}
