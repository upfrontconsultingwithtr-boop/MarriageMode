// Relationship survey: each partner answers privately; linked partners see each other's
// answers side by side. Low areas also help Mia tailor her coaching.
export type Q = { id: string; area: string; topic?: string; kind: 'scale' | 'text'; en: string; es: string };
export const SURVEY: Q[] = [
  { id: 'heard', area: 'Communication', topic: 'communication', kind: 'scale', en: 'I feel heard when we talk about something important.', es: 'Me siento escuchado o escuchada cuando hablamos de algo importante.' },
  { id: 'repair', area: 'Conflict', topic: 'conflict', kind: 'scale', en: 'When we disagree, we can calm down and come back to it kindly.', es: 'Cuando no estamos de acuerdo, podemos calmarnos y volver al tema con cariño.' },
  { id: 'respect', area: 'Conflict', topic: 'conflict', kind: 'scale', en: 'Our arguments stay respectful: no name-calling, eye-rolling or contempt.', es: 'Nuestras discusiones son respetuosas: sin insultos, burlas ni desprecio.' },
  { id: 'trust', area: 'Trust', topic: 'trust', kind: 'scale', en: 'I feel secure and trusted in our relationship.', es: 'Me siento seguro o segura y con confianza en nuestra relación.' },
  { id: 'digital', area: 'Digital boundaries', topic: 'phones', kind: 'scale', en: 'We have clear, agreed boundaries about phones, social media and exes.', es: 'Tenemos límites claros y acordados sobre teléfonos, redes sociales y exparejas.' },
  { id: 'time', area: 'Connection', topic: 'distance', kind: 'scale', en: 'We spend enough quality time together.', es: 'Pasamos suficiente tiempo de calidad juntos.' },
  { id: 'appreciated', area: 'Connection', topic: 'appreciation', kind: 'scale', en: 'I feel appreciated by my partner.', es: 'Me siento valorado o valorada por mi pareja.' },
  { id: 'intimacy', area: 'Intimacy', topic: 'intimacy', kind: 'scale', en: 'I’m happy with our affection and intimacy.', es: 'Estoy contento o contenta con nuestro cariño e intimidad.' },
  { id: 'money', area: 'Money', topic: 'money', kind: 'scale', en: 'We’re on the same page about money.', es: 'Estamos de acuerdo en temas de dinero.' },
  { id: 'family', area: 'Family', topic: 'family', kind: 'scale', en: 'We handle family and in-laws as a team.', es: 'Manejamos la familia y los suegros como equipo.' },
  { id: 'future', area: 'Future', topic: 'readiness', kind: 'scale', en: 'We agree on our big plans: kids, home, career and faith.', es: 'Estamos de acuerdo en los planes grandes: hijos, hogar, trabajo y fe.' },
  { id: 'fair', area: 'Home life', topic: 'chores', kind: 'scale', en: 'The work at home feels fair.', es: 'El trabajo de la casa se siente justo.' },
  { id: 'stress', area: 'Support', topic: 'stress', kind: 'scale', en: 'We support each other well when life gets stressful.', es: 'Nos apoyamos bien cuando la vida se pone estresante.' },
  { id: 'overall', area: 'Overall', kind: 'scale', en: 'Overall, I’m happy in our relationship.', es: 'En general, estoy feliz en nuestra relación.' },
  { id: 'love', area: 'In your words', kind: 'text', en: 'What do you love most about your partner?', es: '¿Qué es lo que más amas de tu pareja?' },
  { id: 'improve', area: 'In your words', kind: 'text', en: 'What is one thing you’d most like to improve together?', es: '¿Qué es lo que más te gustaría mejorar juntos?' },
  { id: 'wish', area: 'In your words', kind: 'text', en: 'What do you wish your partner understood about you?', es: '¿Qué te gustaría que tu pareja entendiera de ti?' },
];
export type Answers = Record<string, number | string>;
export const SCALE_EN = ['Not at all', 'A little', 'Somewhat', 'Mostly', 'Completely'];
export const SCALE_ES = ['Para nada', 'Un poco', 'Algo', 'Casi siempre', 'Totalmente'];
const KEY = 'marriage-mode:survey';
export function loadMine(): { answers: Answers; at?: string } { try { return JSON.parse(localStorage.getItem(KEY) || '{"answers":{}}'); } catch { return { answers: {} }; } }
export function saveMine(answers: Answers) { try { localStorage.setItem(KEY, JSON.stringify({ answers, at: new Date().toISOString() })); } catch { /* full */ } }
// Areas that scored low (1–2) for this person: Mia focuses her coaching there.
export function lowAreas(a: Answers): Q[] { return SURVEY.filter((q) => q.kind === 'scale' && typeof a[q.id] === 'number' && (a[q.id] as number) <= 2); }
export function surveyContext(a: Answers): string {
  const low = lowAreas(a); const improve = typeof a.improve === 'string' ? a.improve : '';
  if (!low.length && !improve) return '';
  return `\n\nFrom this person's private relationship survey (use gently, don't quote it back word for word): they rated these areas low: ${low.map((q) => q.area.toLowerCase() + ` ("${q.en}")`).join('; ') || 'none'}.${improve ? ` They most want to improve: "${improve.slice(0, 200)}".` : ''}`;
}
