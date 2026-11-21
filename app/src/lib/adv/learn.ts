// Learn: why social media strains a relationship. 6 short lessons (about 3 minutes with the reflection),
// each ending with one reflection question and one concrete action. English + Spanish.
export interface Lesson { id: string; title: [string, string]; body: [string[], string[]]; reflect: [string, string]; action: [string, string] }

export const LESSONS: Lesson[] = [
  { id: 'burden', title: ['Burden and stress', 'Carga y estrés'],
    body: [[
      'Feeds, group chats and notifications add up to a mental load that never fully switches off. Each ping asks for a small decision: open it, answer it, ignore it. Hundreds of those a day leave less patience and attention for the person next to you.',
      'Always-on availability also creates quiet expectations. If you answer a coworker at 10pm, or a friend within a minute, your partner can start to feel they are competing with your phone for the same attention.',
      'None of this means anyone did something wrong. It means the phone is taking a share of the relationship that nobody agreed to give it. Couples who name that share, and set limits on it together, report fewer small fights about “you are always on your phone”.',
    ], [
      'Los feeds, los chats grupales y las notificaciones suman una carga mental que nunca se apaga del todo. Cada aviso pide una pequeña decisión: abrirlo, contestarlo, ignorarlo. Cientos al día dejan menos paciencia y atención para la persona que tienes al lado.',
      'Estar siempre disponible también crea expectativas silenciosas. Si contestas a un compañero de trabajo a las 10 de la noche, tu pareja puede sentir que compite con tu teléfono por la misma atención.',
      'Nada de esto significa que alguien hizo algo mal. Significa que el teléfono se lleva una parte de la relación que nadie acordó darle. Las parejas que nombran esa parte y le ponen límites juntas tienen menos peleas pequeñas por “siempre estás con el teléfono”.',
    ]],
    reflect: ['When does your phone take attention you would rather give your partner?', '¿En qué momentos tu teléfono se lleva atención que preferirías darle a tu pareja?'],
    action: ['Pick one phone-free hour each day this week (dinner works well) and tell your partner which one.', 'Elige una hora sin teléfono cada día esta semana (la cena funciona bien) y dile a tu pareja cuál.'] },
  { id: 'comparison', title: ['Comparison', 'Comparación'],
    body: [[
      'Feeds show other couples at their best: the trip, the proposal, the anniversary post. Your own relationship is lived in full, including the dishes, the bills and the bad days. Measuring the whole of yours against the highlights of theirs is a contest you cannot win.',
      'Comparison also works on individuals. Seeing attractive strangers, polished bodies or exciting lives over and over can make an ordinary, good partner feel like “less”, even when nothing in the relationship has changed.',
      'The fix is not to stop seeing other people. It is to notice the comparison when it happens and to name it out loud: “that is a highlight, not a life”. Curating what you follow, so your feed lifts you up instead of grading you, helps too.',
    ], [
      'Los feeds muestran a otras parejas en su mejor momento: el viaje, la propuesta, el aniversario. Tu relación se vive completa, con los platos, las cuentas y los días malos. Medir lo tuyo entero contra lo mejor de otros es una competencia imposible de ganar.',
      'La comparación también afecta a cada persona. Ver una y otra vez a desconocidos atractivos o vidas emocionantes puede hacer que una pareja buena y real parezca “menos”, aunque nada haya cambiado.',
      'La solución no es dejar de ver a otras personas, sino notar la comparación cuando aparece y decirla en voz alta: “eso es un momento destacado, no una vida”. Elegir mejor a quién sigues también ayuda.',
    ]],
    reflect: ['Which accounts leave you feeling that your relationship is “less”?', '¿Qué cuentas te dejan sintiendo que tu relación es “menos”?'],
    action: ['Unfollow or mute three accounts that leave you comparing, and follow one that helps your relationship.', 'Deja de seguir o silencia tres cuentas que te ponen a comparar, y sigue una que ayude a tu relación.'] },
  { id: 'temptation', title: ['Engineered temptation', 'Tentación diseñada'],
    body: [[
      'Many apps are built to show you new people: “people you may know”, suggested follows, quick-add lists and explore pages. They often surface people you once searched for, people near you, and people who already interact with you, including exes.',
      'Each suggestion is small, but together they keep a door open that you may have meant to close. A suggested follow can turn into a like, a like into a message, and a message into a secret, without anyone setting out to cheat.',
      'You can close most of these doors in settings: turn off suggestions where the app allows it, clear your search history, and remove the people the app keeps putting in front of you. Doing it together, side by side, turns it into a shared promise instead of a suspicion.',
    ], [
      'Muchas apps están hechas para mostrarte gente nueva: “personas que quizás conozcas”, sugerencias, listas de agregar rápido y páginas de explorar. A menudo muestran a gente que buscaste, gente cercana y gente que ya interactúa contigo, incluidas exparejas.',
      'Cada sugerencia es pequeña, pero juntas mantienen abierta una puerta que quizás querías cerrar. Una sugerencia se vuelve un me gusta, un me gusta un mensaje, y un mensaje un secreto, sin que nadie lo planee.',
      'Puedes cerrar casi todas estas puertas en la configuración: apaga las sugerencias donde se pueda, borra tu historial de búsqueda y quita a las personas que la app te sigue mostrando. Hacerlo juntos lo convierte en una promesa compartida, no en una sospecha.',
    ]],
    reflect: ['Who does your phone keep suggesting that you would rather not see?', '¿A quién te sigue sugiriendo tu teléfono que preferirías no ver?'],
    action: ['Clear your search history on your two most-used apps today.', 'Borra hoy tu historial de búsqueda en tus dos apps más usadas.'] },
  { id: 'algorithm', title: ['The attention algorithm', 'El algoritmo de la atención'],
    body: [[
      'Feeds are ranked by systems whose job is to keep you watching. They learn from what you pause on, like, search and replay, and they show you more of it. If you linger on a certain kind of person, the feed learns that and serves more of them.',
      'That is why a feed can feel like it is “designed” to pull you back: in an important sense, it is. The ranking is tuned for time spent, not for your relationship, your sleep or your goals.',
      'You can retrain it. Stop pausing on what you do not want more of, use “not interested” where the app offers it, and reset or clear your activity. Within a week or two most feeds noticeably change.',
    ], [
      'Los feeds se ordenan con sistemas cuyo trabajo es mantenerte mirando. Aprenden de lo que pausas, te gusta, buscas y repites, y te muestran más de eso. Si te detienes en cierto tipo de persona, el feed lo aprende y te muestra más.',
      'Por eso un feed puede sentirse “diseñado” para atraerte de vuelta: en un sentido importante, lo está. Está ajustado para el tiempo que pasas, no para tu relación, tu descanso ni tus metas.',
      'Puedes reentrenarlo. Deja de detenerte en lo que no quieres ver más, usa “no me interesa” donde exista y reinicia o borra tu actividad. En una o dos semanas la mayoría de los feeds cambian bastante.',
    ]],
    reflect: ['What does your feed show you most, and is that what you want more of?', '¿Qué te muestra más tu feed, y es eso lo que quieres ver más?'],
    action: ['Tap “not interested” on five posts you do not want in your feed.', 'Toca “no me interesa” en cinco publicaciones que no quieres en tu feed.'] },
  { id: 'exes', title: ['Exes and strangers in the feed', 'Exparejas y desconocidos en el feed'],
    body: [[
      'Social media keeps old connections one tap away. An ex who is still a follower can see your life, react to it and reach out at any moment, and you can do the same. That open line is often where the hardest conversations in a couple start.',
      'Staying connected is not always about feelings. Sometimes it is habit, politeness or not wanting to look bitter. But your partner may experience it as a door that was never fully closed.',
      'Talk about it together and decide as a couple. For many, the kind and clear choice is to quietly unfollow or remove exes and past matches. For co-parents or close mutual friends, agree on what contact looks like instead.',
    ], [
      'Las redes mantienen las conexiones viejas a un toque de distancia. Una expareja que te sigue puede ver tu vida, reaccionar y escribirte en cualquier momento, y tú igual. Esa línea abierta suele ser donde empiezan las conversaciones más difíciles de una pareja.',
      'Seguir conectados no siempre es por sentimientos. A veces es costumbre, cortesía o no querer parecer resentido. Pero tu pareja puede vivirlo como una puerta que nunca se cerró del todo.',
      'Hablen y decidan juntos. Para muchas parejas, lo claro y amable es dejar de seguir o quitar en silencio a exparejas y matches anteriores. Si comparten hijos o amistades cercanas, acuerden cómo será ese contacto.',
    ]],
    reflect: ['Which past connections would your partner be surprised to find still there?', '¿Qué conexiones pasadas le sorprendería a tu pareja encontrar todavía ahí?'],
    action: ['List your exes and past matches in the Sweep so it can find them in your own exports.', 'Anota a tus exparejas y matches anteriores en la Revisión para encontrarlos en tus propias exportaciones.'] },
  { id: 'boundaries', title: ['Blurred boundaries', 'Límites borrosos'],
    body: [[
      'Likes, late-night DMs and follows feel small, so couples rarely talk about them. Then one partner sees something the other thought was nothing, and the fight is not about the like: it is about never having agreed what is OK.',
      'Clear boundaries are not about control. They are an agreement two people make freely, with room for each person’s friendships and work. The goal is fewer surprises, not more rules.',
      'The worksheet below helps. Each of you answers on your own first, so neither answer is shaped by the other, then you compare. The differences are not problems: they are the exact conversations worth having.',
    ], [
      'Los me gusta, los mensajes de madrugada y los seguimientos parecen pequeños, así que las parejas casi nunca hablan de ellos. Luego una persona ve algo que la otra creía que no era nada, y la pelea no es por el me gusta: es por nunca haber acordado qué está bien.',
      'Los límites claros no son control. Son un acuerdo que dos personas hacen libremente, con espacio para las amistades y el trabajo de cada una. La meta es menos sorpresas, no más reglas.',
      'La hoja de abajo ayuda. Cada uno responde por su cuenta primero, para que ninguna respuesta influya en la otra, y luego comparan. Las diferencias no son problemas: son justo las conversaciones que vale la pena tener.',
    ]],
    reflect: ['Which online habit have you two never actually talked about?', '¿Qué hábito en línea nunca han hablado de verdad?'],
    action: ['Each fill in the boundaries worksheet on your own, then compare answers together.', 'Cada uno llene la hoja de límites por su cuenta y luego comparen juntos.'] },
];

export type Answer = 'ok' | 'talk' | 'no';
export interface Worksheet { a: Record<string, Answer>; b: Record<string, Answer>; aDone?: boolean; bDone?: boolean }
export const WS_ITEMS: { id: string; q: [string, string] }[] = [
  { id: 'ex-follow', q: ['Following or being followed by an ex', 'Seguir o ser seguido por una expareja'] },
  { id: 'late-dm', q: ['Private messages late at night with someone of the gender you date', 'Mensajes privados de madrugada con alguien del género con quien sales'] },
  { id: 'likes', q: ['Liking a stranger’s revealing photos', 'Dar me gusta a fotos reveladoras de desconocidos'] },
  { id: 'dating-app', q: ['Keeping a dating app installed “just to look”', 'Tener una app de citas instalada “solo para ver”'] },
  { id: 'close-friends', q: ['Adding people to a private “close friends” story list', 'Agregar personas a la lista privada de “mejores amigos”'] },
  { id: 'phone-free', q: ['Phones at the table during meals together', 'Teléfonos en la mesa durante las comidas juntos'] },
  { id: 'posting', q: ['Posting about the relationship without asking first', 'Publicar sobre la relación sin preguntar antes'] },
  { id: 'passwords', q: ['Asking for each other’s passwords (this is never required)', 'Pedirse las contraseñas (esto nunca es obligatorio)'] },
];
/** Each partner edits only their own column. */
export function answer(ws: Worksheet, who: 'a' | 'b', id: string, v: Answer): Worksheet { return { ...ws, [who]: { ...ws[who], [id]: v } }; }
export function differences(ws: Worksheet): string[] { return WS_ITEMS.filter((i) => ws.a[i.id] && ws.b[i.id] && ws.a[i.id] !== ws.b[i.id]).map((i) => i.id); }
