'use client';
import { useEffect, useMemo, useState } from 'react';
import { readExport, flag, type Account, type RawFile, type Dates } from '@/lib/follows';
import { scanInteractions } from '@/lib/interactions';
import { saveReview } from '@/lib/review';
import { useT } from '@/lib/i18n';
import { track } from '@/lib/track';

const KEY = 'marriage-mode:social-removed';
const loadDone = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const saveDone = (d: Record<string, string>) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* full */ } };
const NET: Record<string, string> = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', other: '—' };

// Social follow review: your own follows/friends from your own data download, scanned on this device.
export default function SocialScan() {
  const t = useT();
  const [allowed, setAllowed] = useState(false); const [names, setNames] = useState('');
  const [list, setList] = useState<Account[]>([]); const [busy, setBusy] = useState(''); const [err, setErr] = useState('');
  const [pick, setPick] = useState<Record<string, boolean>>({}); const [done, setDone] = useState<Record<string, string>>({});
  const [queue, setQueue] = useState<Account[] | null>(null); const [qi, setQi] = useState(0); const [showAll, setShowAll] = useState(false);
  const [since, setSince] = useState(''); const [since2, setSince2] = useState(''); const [raw, setRaw] = useState<RawFile[]>([]); const [dates1, setDates1] = useState<Dates>(''); const [dates2, setDates2] = useState<Dates>('');
  // Combine both answers, so if they differ nothing is missed.
  const dates: Dates = !dates1 ? dates2 : !dates2 ? dates1 : dates1 === dates2 ? dates1 : 'both'; const [filter, setFilter] = useState<'flagged' | 'likely' | 'oneway' | 'fans' | 'mutual' | 'close' | 'groups' | 'all'>('flagged');
  useEffect(() => { setDone(loadDone()); }, []);
    const start = useMemo(() => [since, since2].filter(Boolean).sort()[0] ?? '', [since, since2]); // the earlier of the two dates
  const flagged = useMemo(() => flag(list, names.split(','), start || undefined, dates), [list, names, start, dates]);
  const people = useMemo(() => (start && raw.length ? scanInteractions(raw, Date.parse(start), new Set(flagged.filter((a) => a.reasons.length).map((a) => a.handle.toLowerCase()))) : []), [raw, start, flagged]);
  const riskyPeople = people.filter((x) => x.reasons.length);
  const risky = flagged.filter((a) => a.reasons.length);
  const FILTERS: Record<typeof filter, (a: Account) => boolean> = {
    flagged: (a) => a.reasons.length > 0, all: () => true, likely: (a) => !!a.likely,
    oneway: (a) => !!a.youFollow && !a.followsYou && a.kind !== 'group', fans: (a) => !!a.followsYou && !a.youFollow,
    mutual: (a) => !!a.youFollow && !!a.followsYou, close: (a) => !!a.closeFriend, groups: (a) => a.kind === 'group',
  };
  const shown = flagged.filter(FILTERS[showAll ? 'all' : filter]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return; setErr(''); setBusy(t('Reading your download on this device…', 'Leyendo tu descarga en este dispositivo…'));
    try { let all: Account[] = [...list]; const rf: RawFile[] = [...raw]; for (const f of Array.from(files)) all = [...all, ...(await readExport(f, setBusy, rf))]; setRaw(rf); const seen = new Set<string>(); setList(all.filter((a) => !seen.has(a.key) && seen.add(a.key))); track('social-scan'); }
    catch { setErr(t('That file could not be read. Pick the .zip (or .json) file from your download.', 'No se pudo leer ese archivo. Elige el archivo .zip (o .json) de tu descarga.')); }
    finally { setBusy(''); }
  };
  const markDone = (a: Account) => { const d = { ...done, [a.key]: new Date().toISOString() }; setDone(d); saveDone(d); };
  const selected = flagged.filter((a) => pick[a.key] && !done[a.key]);

  return (
    <div className="glass p-6 md:col-span-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mango">{t('Social follow review · your accounts only', 'Revisión de seguidos · solo tus cuentas')}</p>
      <h2 className="mt-1 text-lg font-semibold">{t('Find follows and friends that could put your relationship at risk', 'Encuentra seguidos y amistades que podrían poner en riesgo tu relación')}</h2>
      <p className="mt-1 text-sm text-ink/65">{t('Instagram, Facebook and TikTok let you download your own follow, friend and group lists. Marriage Mode scans that download on this device (nothing is uploaded) and flags exes you name, dating, hookup and adult accounts, influencers and groups that promote sex or dating, and anyone followed after your relationship began. It also sorts your connections by strength (mutual vs one-way), then walks you through unfollowing or leaving the ones you choose, one tap each.', 'Instagram, Facebook y TikTok te dejan descargar tus listas de seguidos, amistades y grupos. Marriage Mode revisa esa descarga en este dispositivo (nada se sube) y marca exparejas que nombres, cuentas de citas, encuentros o para adultos, influencers y grupos que promueven sexo o citas, y a quien seguiste después de que empezó su relación. También ordena tus conexiones por fuerza (mutuas o de un solo lado) y te guía para dejar de seguir o salir de las que elijas, un toque cada una.')}</p>

      {!allowed ? (
        <div className="mt-4 rounded-xl bg-night/50 p-4 ring-1 ring-white/[0.07]">
          <p className="text-sm">{t('This only works on your own accounts, with your own download. Marriage Mode never logs in to your social media and never unfollows anyone without you.', 'Esto solo funciona con tus propias cuentas y tu propia descarga. Marriage Mode nunca entra a tus redes sociales ni deja de seguir a nadie sin ti.')}</p>
          <button onClick={() => { setAllowed(true); track('social-allow'); }} className="glow-mango mt-3 min-h-11 rounded-full bg-mango px-5 font-semibold text-night">{t('Allow and start my review', 'Permitir y empezar mi revisión')}</button>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 [&>*]:min-w-0">
            {[['Instagram', t('Profile → ☰ → Accounts Center → Your information and permissions → Download your information → choose “Followers and following”, “Likes”, “Comments”, “Story interactions” and “Messages”, format JSON.', 'Perfil → ☰ → Centro de cuentas → Tu información y permisos → Descargar tu información → elige “Seguidores y seguidos”, “Me gusta”, “Comentarios”, “Interacciones con historias” y “Mensajes”, formato JSON.')],
              ['Facebook', t('Menu → Settings → Accounts Center → Your information and permissions → Download your information → choose “Friends and followers” and “Groups”, format JSON.', 'Menú → Configuración → Centro de cuentas → Tu información y permisos → Descargar tu información → elige “Amigos y seguidores” y “Grupos”, formato JSON.')],
              ['TikTok', t('Profile → ☰ → Settings and privacy → Account → Download your data → JSON → Request data, then Download.', 'Perfil → ☰ → Ajustes y privacidad → Cuenta → Descargar tus datos → JSON → Solicitar datos, luego Descargar.')]].map(([n, s]) => (
              <details key={n} className="rounded-xl bg-white/[0.03] p-3 text-sm ring-1 ring-white/[0.07]"><summary className="cursor-pointer font-semibold">{t(`Get your ${n} download`, `Obtén tu descarga de ${n}`)}</summary><p className="mt-2 text-ink/70">{s}</p></details>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink/50">{t('Menu names change a little over time. The download can take from minutes to a day to arrive by email.', 'Los nombres de los menús cambian un poco con el tiempo. La descarga puede tardar de minutos a un día en llegar por correo.')}</p>
          <label className="mt-4 block text-sm text-ink/75">{t('Names or usernames to look for, separated by commas (optional: exes, old flings)', 'Nombres o usuarios a buscar, separados por comas (opcional: exparejas, antiguos ligues)')}
            <input value={names} onChange={(e) => setNames(e.target.value)} placeholder={t('e.g. Jake, maria.lopez', 'p. ej. Jake, maria.lopez')} className="mt-1 min-h-11 w-full rounded-full border border-white/15 bg-night/60 px-4" /></label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
            <label className="block text-sm text-ink/75">{t('When did your relationship start? (your date)', '¿Cuándo empezó su relación? (tu fecha)')}
              <input type="date" value={since} onChange={(e) => setSince(e.target.value)} className="mt-1 min-h-11 w-full rounded-full border border-white/15 bg-night/60 px-4" /></label>
            <label className="block text-sm text-ink/75">{t('Your partner’s date, if they remember it differently', 'La fecha de tu pareja, si la recuerda distinta')}
              <input type="date" value={since2} onChange={(e) => setSince2(e.target.value)} className="mt-1 min-h-11 w-full rounded-full border border-white/15 bg-night/60 px-4" /></label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
            {([[t('Who do you date? (your answer)', '¿Con quién sales? (tu respuesta)'), dates1, setDates1], [t('Who does your partner say you date?', '¿Con quién dice tu pareja que sales?'), dates2, setDates2]] as const).map(([lg, val, setV], i) => (
              <fieldset key={i}><legend className="text-sm text-ink/75">{lg}</legend>
                <div className="mt-1 flex flex-wrap gap-1.5">{([['', t('Skip', 'Omitir')], ['women', t('Women', 'Mujeres')], ['men', t('Men', 'Hombres')], ['both', t('Both', 'Ambos')]] as const).map(([v, l]) => <button key={v} type="button" aria-pressed={val === v} aria-label={`${l} (${i ? t('partner', 'pareja') : t('you', 'tú')})`} onClick={() => setV(v)} className={`min-h-9 rounded-full px-3 text-xs ring-1 ${val === v ? 'bg-lagoon/20 ring-lagoon/60' : 'ring-white/15'}`}>{l}</button>)}</div>
              </fieldset>))}
          </div>
          <p className="mt-1 text-[11px] text-ink/50">{t('Used to flag people of that sex you followed after your relationship began or follow one-way. If your answers differ, both are used. It’s a guess from first names only and can be wrong; you always decide.', 'Se usa para marcar a personas de ese sexo que seguiste después de empezar la relación o que sigues sin que te sigan. Si sus respuestas son distintas, se usan ambas. Es una suposición basada solo en nombres y puede equivocarse; tú siempre decides.')}</p>
          <p className="mt-1 text-xs text-ink/50">{t('We use the earlier date, so nothing is missed. It flags follows, likes, comments, story likes and messages after that date.', 'Usamos la fecha más temprana para no pasar nada por alto. Marca seguidos, “me gusta”, comentarios, reacciones a historias y mensajes después de esa fecha.')}</p>
          <label className="glow-lagoon mt-3 inline-flex min-h-11 cursor-pointer items-center rounded-full bg-lagoon px-5 font-semibold text-night">
            {t('Choose my download file(s)', 'Elegir mi(s) archivo(s) de descarga')}
            <input type="file" multiple accept=".zip,.json,.html,.htm" className="sr-only" onChange={(e) => onFiles(e.target.files)} />
          </label>
          {busy && <p role="status" className="mt-2 text-sm text-ink/70">{busy}</p>}
          {err && <p role="alert" className="mt-2 text-sm text-coral">{err}</p>}

          {list.length > 0 && !queue && (
            <div className="mt-5 rounded-xl bg-night/60 p-4">
              <p className="font-semibold">{t(`${list.length} accounts found · ${risky.length} flagged for your review`, `${list.length} cuentas encontradas · ${risky.length} marcadas para tu revisión`)}</p>
              <p className="mt-1 text-xs text-ink/55">{t('A flag is only a suggestion. You decide who stays.', 'Una marca es solo una sugerencia. Tú decides quién se queda.')} <button onClick={() => setShowAll((v) => !v)} className="text-teal underline">{showAll ? t('Show flagged only', 'Ver solo marcadas') : t(`Show all ${list.length}`, `Ver las ${list.length}`)}</button></p>
              <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={t('Filter', 'Filtrar')}>
                {([['flagged', t('Flagged', 'Marcadas')], ...(dates ? [['likely', t('Likely the sex you date', 'Probablemente del sexo con quien sales')]] as const : []), ['oneway', t('Only you follow (weak link)', 'Solo tú sigues (vínculo débil)')], ['fans', t('Only they follow you', 'Solo te siguen')], ['mutual', t('Mutual (strong link)', 'Mutuos (vínculo fuerte)')], ['close', t('Close friends', 'Mejores amigos')], ['groups', t('Groups', 'Grupos')], ['all', t('All', 'Todas')]] as const).map(([k, l]) => (
                  <button key={k} onClick={() => { setFilter(k); setShowAll(false); }} aria-pressed={filter === k && !showAll} className={`min-h-9 rounded-full px-3 text-xs ring-1 ${filter === k && !showAll ? 'bg-lagoon/20 ring-lagoon/60' : 'ring-white/15'}`}>{l} ({flagged.filter(FILTERS[k]).length})</button>))}
              </div>
              <ul className="mt-3 max-h-96 space-y-1.5 overflow-y-auto pr-1">{shown.map((a) => (
                <li key={a.key} className={`flex items-center gap-3 rounded-lg p-2 ring-1 ${done[a.key] ? 'opacity-50 ring-white/5' : 'ring-white/10'}`}>
                  <input type="checkbox" disabled={!!done[a.key]} checked={!!pick[a.key]} onChange={() => setPick((p) => ({ ...p, [a.key]: !p[a.key] }))} className="size-5 shrink-0 accent-[#D9B77E]" aria-label={a.handle} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{a.handle}</span><span className="block text-[11px] text-ink/55">{NET[a.platform]} · {a.kind}{a.reasons.length ? ` · ${a.reasons.join(', ')}` : ''}</span></span>
                  {done[a.key] && <span className="text-[11px] text-palm">✓ {t('removed', 'quitada')}</span>}
                </li>))}</ul>
              {risky.length === 0 && !showAll && <p className="mt-2 text-sm text-palm">{t('Nothing flagged. 🎉 You can still review all accounts.', 'Nada marcado. 🎉 Igual puedes revisar todas las cuentas.')}</p>}
              <button disabled={!selected.length} onClick={() => { setQueue(selected); setQi(0); track('social-remove-start'); }} className="glow-mango mt-4 min-h-11 rounded-full bg-mango px-5 font-semibold text-night disabled:opacity-40">{t(`Remove the ${selected.length} I chose`, `Quitar las ${selected.length} que elegí`)}</button>
            </div>
          )}

          {start && people.length > 0 && !queue && (
            <div className="mt-5 rounded-xl bg-night/60 p-4 ring-1 ring-coral/25">
              <p className="font-semibold">{t(`Your interactions since ${new Date(start).toLocaleDateString()}: ${riskyPeople.length} to review`, `Tus interacciones desde ${new Date(start).toLocaleDateString()}: ${riskyPeople.length} para revisar`)}</p>
              <p className="mt-1 text-xs text-ink/55">{t('Your own likes, reactions, comments, story likes and messages. Flagged when the words are flirty or risqué, the attention is frequent, or the account is already flagged. You decide what to undo.', 'Tus propios “me gusta”, reacciones, comentarios, reacciones a historias y mensajes. Se marcan si las palabras son coquetas o subidas de tono, si la atención es frecuente o si la cuenta ya está marcada. Tú decides qué deshacer.')}</p>
              <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">{(riskyPeople.length ? riskyPeople : people.slice(0, 20)).map((x) => (
                <li key={x.key} className="rounded-lg p-3 ring-1 ring-white/10">
                  <p className="text-sm font-semibold">{x.who} <span className="text-[11px] font-normal text-ink/55">· {t(`${x.likes} likes, ${x.comments.length} comments, ${x.stories} story likes, ${x.messages} messages`, `${x.likes} me gusta, ${x.comments.length} comentarios, ${x.stories} historias, ${x.messages} mensajes`)}</span></p>
                  {x.reasons.length > 0 && <p className="mt-1 text-[11px] text-coral">{x.reasons.join(' · ')}</p>}
                  {x.flirty.map((c, i) => <p key={i} className="mt-1 rounded bg-white/[0.04] px-2 py-1 text-xs text-ink/75">“{c}”</p>)}
                  <p className="mt-1 text-[11px] text-ink/55">{x.links[0] ? <a href={x.links[0]} target="_blank" rel="noopener noreferrer" className="text-teal underline">{t('Open a post to unlike or delete the comment ↗', 'Abrir una publicación para quitar el me gusta o borrar el comentario ↗')}</a> : t('Open the app to unlike, delete comments or archive the chat.', 'Abre la app para quitar “me gusta”, borrar comentarios o archivar el chat.')}</p>
                </li>))}</ul>
              {riskyPeople.length === 0 && <p className="mt-2 text-sm text-palm">{t('Nothing risqué found since that date. 🎉', 'No se encontró nada subido de tono desde esa fecha. 🎉')}</p>}
            </div>
          )}

          {list.length > 0 && !queue && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-violet/10 p-4 ring-1 ring-violet/30">
              <p className="text-sm">{t('Go over these results with Mia, your AI coach, on your own or together with your partner. She keeps it calm and blame-free and helps you agree on what comes next.', 'Revisa estos resultados con Mia, tu coach de IA, a solas o junto con tu pareja. Ella mantiene la calma, sin culpas, y les ayuda a acordar lo que sigue.')}</p>
              <a href="../coach/?review=1" onClick={() => saveReview({ at: new Date().toISOString(), since: start || undefined, flaggedFollows: risky.length, removed: Object.keys(done).length, riskyInteractions: riskyPeople.length, reasons: [...new Set([...risky.flatMap((a) => a.reasons), ...riskyPeople.flatMap((x) => x.reasons)].map((r) => r.replace(/ \(“.*?”\)/, '').replace(/^matches .*/, 'matches a name they listed')))] })} className="glow-mango min-h-11 shrink-0 rounded-full bg-mango px-5 py-2.5 text-sm font-semibold text-night">{t('Go over my results with Mia', 'Revisar mis resultados con Mia')}</a>
            </div>
          )}

          {queue && (
            <div className="mt-5 rounded-xl bg-night/60 p-4 ring-1 ring-mango/30">
              {qi < queue.length ? (<>
                <p className="text-xs text-ink/55">{t(`${qi + 1} of ${queue.length}`, `${qi + 1} de ${queue.length}`)}</p>
                <p className="mt-1 text-lg font-semibold">{queue[qi].handle} <span className="text-sm font-normal text-ink/55">· {NET[queue[qi].platform]}</span></p>
                <p className="mt-1 text-sm text-ink/70">{t('Tap Open, then tap Following → Unfollow (or Friends → Unfriend, Remove follower, or Leave group). Come back and tap Done.', 'Toca Abrir, luego Siguiendo → Dejar de seguir (o Amigos → Eliminar de amigos, Eliminar seguidor o Salir del grupo). Vuelve y toca Listo.')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={queue[qi].url} target="_blank" rel="noopener noreferrer" className="glow-lagoon inline-flex min-h-11 items-center rounded-full bg-lagoon px-5 font-semibold text-night">{t(`Open on ${NET[queue[qi].platform]} ↗`, `Abrir en ${NET[queue[qi].platform]} ↗`)}</a>
                  <button onClick={() => { markDone(queue[qi]); setQi(qi + 1); }} className="min-h-11 rounded-full bg-palm/15 px-5 font-semibold text-palm ring-1 ring-palm/40">{t('Done, next', 'Listo, siguiente')}</button>
                  <button onClick={() => setQi(qi + 1)} className="min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15">{t('Keep this one', 'Mantener esta')}</button>
                </div>
              </>) : (<>
                <p className="text-lg font-semibold">✓ {t('All done.', 'Todo listo.')}</p>
                <p className="mt-1 text-sm text-ink/70">{t('Nice work. Your follows now match the relationship you are building.', 'Buen trabajo. Tus seguidos ahora van con la relación que estás construyendo.')}</p>
                <button onClick={() => { setQueue(null); setPick({}); }} className="mt-3 min-h-11 rounded-full px-5 text-sm ring-1 ring-white/15">{t('Back to the list', 'Volver a la lista')}</button>
              </>)}
            </div>
          )}
          <p className="mt-3 text-xs text-ink/50">{t('Why not automatic? Instagram, Facebook and TikTok don’t allow outside apps to unfollow for you, and trying can get your account blocked. This way is safe and still takes about a second per account.', '¿Por qué no es automático? Instagram, Facebook y TikTok no permiten que otras apps dejen de seguir por ti, e intentarlo puede bloquear tu cuenta. Así es seguro y toma como un segundo por cuenta.')}</p>
        </>
      )}
    </div>
  );
}
