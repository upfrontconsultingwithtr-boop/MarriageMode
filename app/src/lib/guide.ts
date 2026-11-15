// Marriage Mode Guide: a free chat helper that runs entirely in the browser.
// It is a rules-based guide (not a human, not a licensed counselor, not a paid AI):
// it understands common questions in English and Spanish and answers from our own
// steps and lessons. Nothing typed here is sent anywhere.
import { PLATFORMS, effort } from './catalog.ts';
import { LESSONS } from './lessons.ts';

export type Tab = 'overview' | 'apps' | 'clean' | 'partner' | 'settings';
export type Action = { label: string; href?: string; tab?: Tab; say?: string };
export type Reply = { text: string; actions?: Action[] };
export type Ctx = { inDashboard?: boolean; next?: string; progress?: number; apps?: string[]; base?: string };

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ\s+]/g, ' ').replace(/\s+/g, ' ').trim();
const has = (q: string, words: string[]) => words.some((w) => (w.includes(' ') ? q.includes(w) : q.split(' ').includes(w) || (w.length > 5 && q.includes(w))));

const HOTLINE_EN = 'If you are in danger, call 911. For free, confidential help 24/7: National Domestic Violence Hotline 1-800-799-7233, or text START to 88788.';
const HOTLINE_ES = 'Si estás en peligro, llama al 911. Ayuda gratis y confidencial 24/7 (hay atención en español): Línea Nacional sobre la Violencia Doméstica 1-800-799-7233, o envía START al 88788.';

export function menu(es: boolean): Action[] {
  return es
    ? [{ label: '¿Qué hago ahora?', say: 'siguiente paso' }, { label: 'Eliminar una app', say: 'eliminar una app' }, { label: 'Cancelar un cobro', say: 'cancelar suscripcion' }, { label: 'Cuentas olvidadas', say: 'cuentas olvidadas' }, { label: 'Hablar con mi pareja', say: 'hablar con mi pareja' }]
    : [{ label: 'What do I do next?', say: 'next step' }, { label: 'Delete an app', say: 'delete an app' }, { label: 'Cancel a charge', say: 'cancel subscription' }, { label: 'Find forgotten accounts', say: 'forgotten accounts' }, { label: 'Talk to my partner', say: 'talk to my partner' }];
}

export function greeting(es: boolean): Reply {
  return { text: es
    ? 'Hola, soy la Guía de Marriage Mode. Soy una guía automática que funciona en tu teléfono: no soy una persona ni un consejero, y nada de lo que escribes sale de tu dispositivo. ¿En qué te ayudo?'
    : 'Hi, I’m the Marriage Mode Guide. I’m an automated guide that runs on your phone: not a person and not a counselor, and nothing you type leaves your device. How can I help?', actions: menu(es) };
}

function findApp(q: string) {
  return PLATFORMS.find((p) => q.includes(norm(p.name)) || q.split(' ').includes(p.id) || (p.id === 'pof' && q.includes('plenty')));
}

export function answer(raw: string, es: boolean, ctx: Ctx = {}): Reply {
  const q = norm(raw);
  const base = ctx.base ?? '';
  const T = (en: string, sp: string) => (es ? sp : en);
  const dash = (tab: Tab, label: string): Action => (ctx.inDashboard ? { label, tab } : { label, href: `${base}/audit/` });

  // 1. Safety first.
  if (has(q, ['abuse', 'abusive', 'hurt me', 'hit me', 'threat', 'threaten', 'scared', 'afraid', 'unsafe', 'kill', 'suicide', 'violence', 'controls me', 'controlling', 'abuso', 'me pega', 'amenaza', 'miedo', 'peligro', 'violencia', 'suicid', 'me controla'])) {
    return { text: T(HOTLINE_EN + ' You deserve to feel safe. Marriage Mode has a quick-exit button in the partner space.', HOTLINE_ES + ' Mereces sentirte seguro o segura. Marriage Mode tiene un botón de salida rápida en el espacio de pareja.'),
      actions: [{ label: T('Safety & consent', 'Seguridad y consentimiento'), href: `${base}/safety/` }] };
  }
  // 2. Checking on a partner: kindly decline (trust rules).
  if (has(q, ['partner s phone', 'partners phone', 'husbands phone', 'husband s phone', 'wifes phone', 'wife s phone', 'boyfriends phone', 'girlfriends phone', 'check my', 'read his', 'read her', 'his messages', 'her messages', 'his location', 'her location', 'spy', 'track him', 'track her', 'his phone', 'her phone', 'check on my', 'find out if my', 'is my partner on', 'is my husband', 'is my wife', 'is my boyfriend', 'is my girlfriend', 'telefono de mi pareja', 'revisar a mi pareja', 'mi esposo esta', 'mi esposa esta', 'mi novio esta', 'mi novia esta'])) {
    return { text: T('Marriage Mode only works on your own accounts, by you. It can’t check on anyone else, on purpose: trust grows when each person chooses to share. A gentle way to start is asking your partner to do the audit too, and sharing progress if you both want.', 'Marriage Mode solo funciona con tus propias cuentas, hecho por ti. No puede revisar a nadie más, a propósito: la confianza crece cuando cada uno decide compartir. Una forma amable de empezar es invitar a tu pareja a hacer su propia revisión y compartir el avance si ambos quieren.'),
      actions: [{ label: T('How to bring it up', 'Cómo hablarlo'), say: T('talk to my partner', 'hablar con mi pareja') }, { label: T('Lesson: rebuilding trust', 'Lección: reconstruir la confianza'), href: `${base}/lessons/` }] };
  }
  // 3. A specific app.
  const app = findApp(q);
  if (app && has(q, ['cancel', 'billing', 'charge', 'subscription', 'refund', 'cobro', 'cancelar', 'suscripcion', 'pago', 'reembolso'])) {
    return { text: T(`To stop paying for ${app.name}: deleting the app does not cancel billing. Cancel where you paid: Apple (Settings → your name → Subscriptions), Google Play (profile icon → Payments & subscriptions) or the ${app.name} website.`, `Para dejar de pagar ${app.name}: borrar la app no cancela el cobro. Cancela donde pagaste: Apple (Ajustes → tu nombre → Suscripciones), Google Play (tu foto → Pagos y suscripciones) o el sitio de ${app.name}.`),
      actions: app.billing.length ? [{ label: T(`${app.name} cancel guide`, `Guía para cancelar ${app.name}`), href: `${base}/cancel/${app.id}/` }] : [] };
  }
  if (app) {
    const ef = effort(app);
    return { text: T(`${app.name} (effort: ${ef.label}). ${app.deletePath} Then cancel any billing where you paid, remove the app from every device and unsubscribe from the emails.`, `${app.name} (esfuerzo: ${ef.es}). ${app.deletePath} Luego cancela cualquier cobro donde pagaste, quita la app de todos tus dispositivos y cancela los correos.`),
      actions: [{ label: T(`Full ${app.name} guide`, `Guía completa de ${app.name}`), href: `${base}/guides/${app.id}/` }, dash('clean', T('Open my checklist', 'Abrir mi lista'))] };
  }
  // 4. Topics.
  if (has(q, ['next', 'next step', 'what now', 'what do i do', 'start', 'begin', 'siguiente', 'que hago', 'empezar', 'comenzar'])) {
    if (ctx.next) return { text: T(`Your next best step: ${ctx.next}. You are ${ctx.progress ?? 0}% done.`, `Tu siguiente mejor paso: ${ctx.next}. Llevas ${ctx.progress ?? 0}%.`), actions: [dash('clean', T('Show me how', 'Muéstrame cómo'))] };
    return { text: T('Start by ticking every dating app you ever used, even once. Then the checklist shows exactly what to close, in order. It takes about 20 minutes.', 'Empieza marcando cada app de citas que hayas usado, aunque sea una vez. Luego la lista te muestra qué cerrar, en orden. Toma unos 20 minutos.'), actions: [dash('apps', T('Pick my apps', 'Elegir mis apps'))] };
  }
  if (has(q, ['delete', 'remove', 'close', 'account', 'eliminar', 'borrar', 'cerrar', 'cuenta'])) {
    return { text: T('Which app? Type its name (for example “delete Tinder”). The rule for every app: delete the profile inside the app or website first, then cancel billing, then remove the app.', '¿Qué app? Escribe su nombre (por ejemplo “eliminar Tinder”). La regla para todas: primero elimina el perfil dentro de la app o el sitio, luego cancela el cobro y después quita la app.'),
      actions: ['Tinder', 'Bumble', 'Hinge', 'Match'].map((n) => ({ label: n, say: T(`delete ${n}`, `eliminar ${n}`) })) };
  }
  if (has(q, ['cancel', 'subscription', 'billing', 'charge', 'charged', 'paying', 'statement', 'cancelar', 'suscripcion', 'cobro', 'cobrando', 'pagando', 'estado de cuenta'])) {
    return { text: T('Most dating apps bill through Apple or Google, so start there. Then search 3 months of card statements for app names and parent companies like Match Group, Bumble Inc. or Spark Networks.', 'La mayoría cobra por Apple o Google, así que empieza ahí. Luego busca en 3 meses de estados de cuenta los nombres de las apps y sus empresas, como Match Group, Bumble Inc. o Spark Networks.'),
      actions: [{ label: T('Find forgotten charges', 'Encontrar cobros olvidados'), href: `${base}/charges/` }] };
  }
  if (has(q, ['forgot', 'forgotten', 'find', 'old account', 'which apps', 'dont remember', 'olvid', 'encontrar', 'no recuerdo', 'cuentas viejas'])) {
    return { text: T('Three private ways: 1) one-tap search of your own inbox, 2) scan your Google or Facebook data download on your device, 3) search the web for your own usernames and emails. All in My apps.', 'Tres formas privadas: 1) búsqueda de un toque en tu propio correo, 2) revisar tu descarga de datos de Google o Facebook en tu dispositivo, 3) buscar en la web tus propios usuarios y correos. Todo en Mis apps.'), actions: [dash('apps', T('Open My apps', 'Abrir Mis apps'))] };
  }
  if (has(q, ['email', 'emails', 'unsubscribe', 'newsletter', 'correo', 'correos', 'darme de baja'])) {
    return { text: T('Open one email from the app and tap Unsubscribe at the bottom. The inbox search in My apps finds them all at once.', 'Abre un correo de la app y toca “Unsubscribe” al final. La búsqueda en Mis apps los encuentra todos de una vez.'), actions: [dash('apps', T('Search my inbox', 'Buscar en mi correo'))] };
  }
  if (has(q, ['data', 'privacy', 'gdpr', 'ccpa', 'deletion request', 'personal data', 'datos', 'privacidad', 'solicitud'])) {
    return { text: T('Deleting a profile doesn’t always erase your data. In Clean up, Marriage Mode writes a formal deletion request for each app, reminds you to follow up after 30 days and writes the follow-up letter too.', 'Eliminar un perfil no siempre borra tus datos. En Limpieza, Marriage Mode escribe una solicitud formal para cada app, te recuerda dar seguimiento a los 30 días y también escribe la carta de seguimiento.'), actions: [dash('clean', T('Open deletion requests', 'Abrir solicitudes'))] };
  }
  if (has(q, ['partner', 'husband', 'wife', 'fiance', 'boyfriend', 'girlfriend', 'tell', 'share', 'talk', 'pareja', 'esposo', 'esposa', 'novio', 'novia', 'decirle', 'compartir', 'hablar'])) {
    return { text: T('Lead with “I”: “I closed my old accounts because we matter to me.” Then, if you both want, link up in the partner space for a daily question, shared goals and the progress you each choose to share.', 'Empieza con “yo”: “Cerré mis cuentas viejas porque lo nuestro me importa”. Luego, si ambos quieren, conéctense en el espacio de pareja para una pregunta diaria, metas en común y el avance que cada uno elija compartir.'),
      actions: [dash('partner', T('Open partner space', 'Abrir espacio de pareja')), { label: T('Guided lessons', 'Lecciones guiadas'), href: `${base}/lessons/` }] };
  }
  if (has(q, ['trust', 'jealous', 'jealousy', 'past', 'boundaries', 'boundary', 'fight', 'argue', 'confianza', 'celos', 'celoso', 'celosa', 'pasado', 'limites', 'pelea', 'discutir'])) {
    const l = has(q, ['jealous', 'jealousy', 'celos', 'celoso', 'celosa']) ? LESSONS.find((x) => x.id === 'jealousy')! : has(q, ['boundar', 'limites']) ? LESSONS.find((x) => x.id === 'boundaries')! : has(q, ['past', 'pasado']) ? LESSONS.find((x) => x.id === 'past')! : LESSONS.find((x) => x.id === 'trust')!;
    const L = es ? l.es : l.en;
    return { text: `${L.title}: ${L.intro} ${T('First step:', 'Primer paso:')} ${L.steps[0]}`, actions: [{ label: T('Open the full lesson', 'Abrir la lección completa'), href: `${base}/lessons/` }] };
  }
  if (has(q, ['counselor', 'therapist', 'human', 'person', 'real person', 'coach', 'consejero', 'terapeuta', 'humano', 'persona'])) {
    return { text: T('I’m an automated guide, not a person or counselor. For a licensed premarital or couples counselor, the PREPARE/ENRICH facilitator finder and your local church or counseling practice are good places to start.', 'Soy una guía automática, no una persona ni un consejero. Para un consejero prematrimonial o de parejas con licencia, el buscador de facilitadores de PREPARE/ENRICH y tu iglesia o centro de consejería local son buenos lugares para empezar.'),
      actions: [{ label: 'PREPARE/ENRICH', href: 'https://www.prepare-enrich.com/facilitator-finder/' }] };
  }
  if (has(q, ['again', 'come back', 'recheck', 're check', 'monthly', 'reminder', 'otra vez', 'revision', 'mensual', 'recordatorio'])) {
    return { text: T('Once a month, a 5-minute re-check: run the inbox search again, glance at your statement, confirm nothing reopened. The Overview has a button to add a monthly reminder to your calendar.', 'Una vez al mes, una revisión de 5 minutos: repite la búsqueda en tu correo, revisa tu estado de cuenta y confirma que nada se reabrió. El Resumen tiene un botón para agregar un recordatorio mensual a tu calendario.'), actions: [dash('overview', T('Open Overview', 'Abrir Resumen'))] };
  }
  if (has(q, ['safe', 'private', 'secure', 'see my', 'store', 'seguro', 'privado', 'guardan', 'ven mis'])) {
    return { text: T('Your audit lives on your device. Nothing is uploaded unless you turn on the optional sync, and then only you can see it. We never sell data or show ads.', 'Tu revisión vive en tu dispositivo. Nada se sube a menos que actives la sincronización opcional, y aun así solo tú la ves. Nunca vendemos datos ni mostramos anuncios.'), actions: [{ label: T('Privacy', 'Privacidad'), href: `${base}/privacy/` }] };
  }
  if (has(q, ['price', 'cost', 'free', 'pay', 'kit', 'buy', 'precio', 'costo', 'gratis', 'comprar'])) {
    return { text: T('The audit, guides, lessons and partner space are free. The optional $19 Clean Slate Kit adds a printable report, a 30-day boundaries plan and conversation cards.', 'La revisión, las guías, las lecciones y el espacio de pareja son gratis. El Clean Slate Kit opcional de $19 agrega un reporte para imprimir, un plan de límites de 30 días y tarjetas de conversación.'), actions: [{ label: T('See pricing', 'Ver precios'), href: `${base}/#pricing` }] };
  }
  if (has(q, ['app', 'install', 'home screen', 'download', 'instalar', 'pantalla de inicio', 'descargar'])) {
    return { text: T('Add Marriage Mode to your home screen in Settings → Get the app. It opens full screen and works offline after the first visit. Free, no app store.', 'Agrega Marriage Mode a tu pantalla de inicio en Ajustes → Obtén la app. Se abre en pantalla completa y funciona sin conexión después de la primera visita. Gratis, sin tienda de apps.'), actions: [dash('settings', T('Open Settings', 'Abrir Ajustes'))] };
  }
  if (has(q, ['thanks', 'thank you', 'thx', 'gracias'])) return { text: T('You’re welcome. You’re doing something kind for your relationship. 💞', 'De nada. Estás haciendo algo bonito por tu relación. 💞') };
  if (has(q, ['hi', 'hello', 'hey', 'help', 'hola', 'ayuda', 'buenas'])) return greeting(es);
  return { text: T('I’m not sure I understood. I can help with deleting apps, cancelling charges, finding forgotten accounts, deletion requests and talking with your partner.', 'No estoy seguro de haber entendido. Puedo ayudarte a eliminar apps, cancelar cobros, encontrar cuentas olvidadas, solicitudes de datos y hablar con tu pareja.'), actions: menu(es) };
}
