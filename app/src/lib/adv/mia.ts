// Mia, contextual coach. Reads the user's intake and live progress (all on this device) and always
// ends with one concrete next step. Runs fully on the device by default: no download, no server, free.
// A "hosted" provider slot exists behind one switch (Ruling 4), but it stays off until Tiffany approves
// the spend and the data path; when off or failing, this engine answers.
import { crisis, CRISIS_EN, CRISIS_ES } from '../coach.ts';
import type { AdvState, AcctStep } from './store.ts';
import { status, remaining, score } from './accounts.ts';
import { LESSONS, differences } from './learn.ts';
import { sweepLock } from './store.ts';
import { nextRecheck } from './report.ts';

export const MIA_SAFETY: [string, string] = [
  'Mia is an AI coach, not a therapist. In a crisis in the US: call 911, call or text 988 (Suicide and Crisis Lifeline), or call 1-800-799-7233 (National Domestic Violence Hotline).',
  'Mia es una coach de IA, no una terapeuta. En una crisis en EE. UU.: llama al 911, llama o envía un mensaje al 988 (Línea de Prevención del Suicidio y Crisis), o llama al 1-800-799-7233 (Línea Nacional sobre la Violencia Doméstica).',
];
const STEP: Record<AcctStep, [string, string]> = { delete: ['delete the account', 'borrar la cuenta'], billing: ['cancel the billing', 'cancelar el cobro'], app: ['remove the app', 'quitar la app'], emails: ['unsubscribe from the emails', 'darte de baja de los correos'] };

export interface Ctx { s: AdvState; es: boolean }

/** The single most useful next step, from live progress. */
export function nextStep({ s, es }: Ctx): string {
  const t = (en: string, sp: string) => (es ? sp : en);
  if (!s.intake) return t('Finish the 1-minute intake on the Start tab.', 'Termina el registro de 1 minuto en la pestaña Inicio.');
  const prog = s.accounts.find((a) => status(a) === 'progress');
  if (prog) { const r = remaining(prog)[0]; return t(`${prog.name}: ${STEP[r][0]} (step ${4 - remaining(prog).length + 1} of 4).`, `${prog.name}: ${STEP[r][1]} (paso ${4 - remaining(prog).length + 1} de 4).`); }
  const open = s.accounts.find((a) => status(a) === 'open');
  if (open) return t(`Start closing ${open.name}: ${STEP.delete[0]} first.`, `Empieza a cerrar ${open.name}: primero ${STEP.delete[1]}.`);
  const unread = LESSONS.find((l) => !s.learnRead[l.id]);
  if (unread) return t(`Read the Learn lesson “${unread.title[0]}” (about 3 minutes).`, `Lee la lección “${unread.title[1]}” (unos 3 minutos).`);
  if (sweepLock(s.intake).length) return t('Add your partner’s email and tick the acknowledgement to unlock the Sweep.', 'Agrega el correo de tu pareja y marca la confirmación para desbloquear la Revisión.');
  if (!s.flags.length) return t('Run the Sweep: add one export (or the demo files) on the Sweep tab.', 'Haz la Revisión: agrega una exportación (o los archivos de prueba) en la pestaña Revisión.');
  const queued = s.queue.filter((q) => q.state === 'queued').length;
  if (queued) return t(`Work the next batch of ${Math.min(5, queued)} in your queue.`, `Trabaja el siguiente grupo de ${Math.min(5, queued)} en tu cola.`);
  const reviewed = new Set(s.queue.map((q) => q.flagId)); const left = s.flags.filter((f) => !reviewed.has(f.id)).length;
  if (left) return t(`Review the ${left} flagged item${left > 1 ? 's' : ''} on the Review tab.`, `Revisa ${left} elemento(s) marcados en la pestaña Revisar.`);
  if (!s.sent.length) return t('Open Proof, choose what to share, and send your Clean Slate summary to your partner.', 'Abre Prueba, elige qué compartir y envía tu resumen a tu pareja.');
  return t(`Your next monthly re-check is ${nextRecheck(s)}.`, `Tu próxima revisión mensual es el ${nextRecheck(s)}.`);
}

function progressLine({ s, es }: Ctx): string {
  const sc = score(s.accounts); const closed = s.accounts.filter((a) => status(a) === 'closed').map((a) => a.name);
  const risk = s.flags.filter((f) => f.risque).length; const done = s.queue.filter((q) => q.state === 'done').length;
  return es
    ? `Tu puntuación es ${sc.score}/100: ${sc.closed} de ${sc.total} cuentas cerradas por completo${closed.length ? ` (${closed.join(', ')})` : ''}${sc.inProgress ? `, ${sc.inProgress} en progreso` : ''}. La Revisión encontró ${s.flags.length} elementos (${risk} riesgosos) y completaste ${done} en la cola.`
    : `Your score is ${sc.score}/100: ${sc.closed} of ${sc.total} accounts fully closed${closed.length ? ` (${closed.join(', ')})` : ''}${sc.inProgress ? `, ${sc.inProgress} in progress` : ''}. The Sweep found ${s.flags.length} items (${risk} risque) and you have completed ${done} in the queue.`;
}

const STAGE: Record<string, [string, string]> = { dating: ['dating seriously', 'en una relación seria'], engaged: ['engaged', 'comprometidos'], newlywed: ['newly married', 'recién casados'], married: ['married', 'casados'], rebuilding: ['rebuilding trust', 'reconstruyendo la confianza'] };

export function reply(input: string, ctx: Ctx): string {
  const { s, es } = ctx; const t = (en: string, sp: string) => (es ? sp : en); const m = input.toLowerCase();
  if (crisis(input) || /(hit me|hurt me|threat|scared of (him|her)|me pega|me amenaza|tengo miedo)/i.test(input)) return es ? CRISIS_ES : CRISIS_EN;
  if (/(make|force|forcing|demand|obliga|exige).*(use|usar|password|contraseña|phone|teléfono)/i.test(input)) return t('Nobody should be pressured into using Marriage Mode or sharing passwords. That is not a cleanup step, it is a warning sign. The National Domestic Violence Hotline is free and confidential: 1-800-799-7233, or text START to 88788.\n\nNext step: if you feel unsafe, use Quick exit and call the hotline when you can.', 'Nadie debe ser presionado a usar Marriage Mode ni a compartir contraseñas. Eso no es un paso de limpieza, es una señal de alerta. La Línea Nacional sobre la Violencia Doméstica es gratis y confidencial: 1-800-799-7233, o envía START al 88788.\n\nSiguiente paso: si no te sientes a salvo, usa Salida rápida y llama a la línea cuando puedas.');
  const human = s.intake && s.intake.support !== 'ai';
  const offerHuman = human ? t('\n\nYou chose human support, so you do not have to do this with an AI alone: open “Talk to a real counselor” below whenever you want a person.', '\n\nElegiste apoyo humano, así que no tienes que hacer esto solo con una IA: abre “Hablar con un consejero real” abajo cuando quieras a una persona.') : '';
  const stage = s.intake ? STAGE[s.intake.stage][es ? 1 : 0] : '';
  let body: string; let human2 = '';
  if (/(next|what should i do|what now|siguiente|qué hago|que hago|ahora qué)/.test(m)) body = progressLine(ctx);
  else if (/(score|progress|how am i|cómo voy|como voy|puntuaci|progreso)/.test(m)) body = progressLine(ctx);
  else if (/(sweep|scan|export|revisi|exportaci)/.test(m)) { const lock = sweepLock(s.intake); body = lock.length ? t('The Sweep is locked until your partner’s email is added and you tick “I understand my results will go to my partner.” That keeps it mutual, never secret.', 'La Revisión está bloqueada hasta que agregues el correo de tu pareja y marques “Entiendo que mis resultados irán a mi pareja.” Así es mutuo, nunca secreto.') : t(`The Sweep reads only your own exports, on this device. So far it found ${s.flags.length} items from ${s.sources.length} file${s.sources.length === 1 ? '' : 's'}. Every flag shows why and where it came from.`, `La Revisión lee solo tus propias exportaciones, en este dispositivo. Hasta ahora encontró ${s.flags.length} elementos de ${s.sources.length} archivo(s). Cada uno muestra por qué y de dónde salió.`); }
  else if (/(queue|batch|remove|unfollow|cola|quitar|dejar de seguir)/.test(m)) { const q = s.queue.filter((x) => x.state === 'queued').length; body = t(`You have ${q} item${q === 1 ? '' : 's'} waiting in the queue. Most platforms do not let any outside tool unfollow in bulk, so I prepare each one and you tap the platform’s own button, 5 at a time.`, `Tienes ${q} elemento(s) en la cola. La mayoría de las plataformas no permiten que una herramienta externa deje de seguir en grupo, así que preparo cada uno y tú tocas el botón de la plataforma, de 5 en 5.`); }
  else if (/(partner|spouse|husband|wife|pareja|esposo|esposa|tell (him|her)|decirle)/.test(m)) { const diffs = differences(s.worksheet).length; body = t(`Talking with your partner works best as a team, not a trial. ${diffs ? `Your worksheet shows ${diffs} difference${diffs > 1 ? 's' : ''}: start with the smallest one.` : 'The boundaries worksheet in Learn gives you both a calm place to start.'} Nothing is ever shared until you choose it in Proof.`, `Hablar con tu pareja funciona mejor como equipo, no como juicio. ${diffs ? `Su hoja muestra ${diffs} diferencia(s): empiecen por la más pequeña.` : 'La hoja de límites en Aprender les da un punto de partida tranquilo.'} Nada se comparte hasta que lo eliges en Prueba.`); human2 = offerHuman; }
  else if (/(sad|hurt|angry|guilt|ashamed|anxious|overwhelm|triste|dolid|enojad|culpa|vergüenza|ansios|abrumad)/.test(m)) { body = t(`That is a lot to carry, and it makes sense to feel it. You do not have to finish everything today; small, honest steps count${stage ? `, especially while you are ${stage}` : ''}.`, `Es mucho para cargar, y tiene sentido sentirlo. No tienes que terminar todo hoy; los pasos pequeños y honestos cuentan${stage ? `, sobre todo ahora que están ${stage}` : ''}.`); human2 = offerHuman; }
  else if (/(risque|risky|riesgos)/.test(m)) body = t('Risque means things in your own activity that are not healthy in a committed relationship: repeat viewing of one person, frequent likes or late-night DMs, exes, past matches, flirty patterns, risque groups and any dating activity. Each flag shows the pattern and where it came from.', 'Riesgoso significa cosas en tu propia actividad que no son sanas en una relación comprometida: ver a una persona una y otra vez, muchos me gusta o mensajes de madrugada, exparejas, matches anteriores, patrones coquetos, grupos riesgosos y cualquier actividad de citas. Cada marca muestra el patrón y su origen.');
  else if (/(human|person|counselor|therap|consejer|persona real)/.test(m)) { body = t('You can talk with a real person any time from “Talk to a real counselor”.', 'Puedes hablar con una persona real cuando quieras desde “Hablar con un consejero real”.'); }
  else if (/^(hi|hello|hey|hola|buenas)/.test(m)) body = t(`Hi${s.intake?.name ? ` ${s.intake.name}` : ''}, I’m Mia. ${s.intake ? progressLine(ctx) : 'Let’s start with the 1-minute intake.'}`, `Hola${s.intake?.name ? ` ${s.intake.name}` : ''}, soy Mia. ${s.intake ? progressLine(ctx) : 'Empecemos con el registro de 1 minuto.'}`);
  else body = t(`I hear you. ${s.intake ? progressLine(ctx) : ''}`, `Te escucho. ${s.intake ? progressLine(ctx) : ''}`);
  return `${body.trim()}${human2}\n\n${t('Next step', 'Siguiente paso')}: ${nextStep(ctx)}`;
}
