// Daily couple questions: warm, forward-looking, never about checking on each other.
// The same question shows for both partners on the same day.
export const QUESTIONS: [string, string][] = [
  ['What is one small thing I did this week that made you feel loved?', '¿Qué cosa pequeña hice esta semana que te hizo sentir amado o amada?'],
  ['What does a “clean slate” mean to you for us?', '¿Qué significa para ti una “página limpia” para nosotros?'],
  ['Which online habit would you like us to agree on together?', '¿Qué hábito en línea te gustaría que acordemos juntos?'],
  ['What is a memory of us you never want to forget?', '¿Qué recuerdo nuestro nunca quieres olvidar?'],
  ['How can I support you better when you have a hard day?', '¿Cómo puedo apoyarte mejor cuando tienes un día difícil?'],
  ['What is one thing you are proud of us for this month?', '¿De qué estás orgulloso u orgullosa de nosotros este mes?'],
  ['What makes you feel most trusted by me?', '¿Qué te hace sentir que confío en ti?'],
  ['What is a dream you want us to chase together?', '¿Qué sueño quieres que persigamos juntos?'],
  ['How do you like to be comforted?', '¿Cómo te gusta que te consuelen?'],
  ['What tradition would you love us to start?', '¿Qué tradición te encantaría que empezáramos?'],
  ['What is one boundary that helps you feel safe with us?', '¿Qué límite te ayuda a sentirte seguro o segura con nosotros?'],
  ['When did you last feel really close to me?', '¿Cuándo te sentiste realmente cerca de mí por última vez?'],
  ['What is something new you would like to learn about me?', '¿Qué te gustaría aprender de mí que aún no sepas?'],
  ['What does a perfect ordinary day together look like?', '¿Cómo sería un día normal perfecto juntos?'],
  ['What is one thing we could do less of on our phones?', '¿Qué es algo que podríamos hacer menos en el teléfono?'],
  ['What song reminds you of us, and why?', '¿Qué canción te recuerda a nosotros y por qué?'],
  ['What is one way we are a great team?', '¿En qué somos un gran equipo?'],
  ['What would make our home feel even more like ours?', '¿Qué haría que nuestro hogar se sintiera aún más nuestro?'],
  ['What is a kindness you want to thank me for?', '¿Qué gesto amable quieres agradecerme?'],
  ['What are you looking forward to in our next year?', '¿Qué esperas con ilusión de nuestro próximo año?'],
  ['How do you like to reconnect after a busy week?', '¿Cómo te gusta reconectar después de una semana ocupada?'],
  ['What is one promise you want to make to me today?', '¿Qué promesa quieres hacerme hoy?'],
  ['What helps you feel heard when we disagree?', '¿Qué te ayuda a sentirte escuchado o escuchada cuando no estamos de acuerdo?'],
  ['What is your favorite thing about how we laugh together?', '¿Qué es lo que más te gusta de cómo reímos juntos?'],
  ['What would you like our friends to know about us?', '¿Qué te gustaría que nuestros amigos supieran de nosotros?'],
  ['What is one goal we finished that felt good?', '¿Qué meta cumplimos que se sintió bien?'],
  ['What does faith, family or purpose mean in our life together?', '¿Qué significan la fe, la familia o el propósito en nuestra vida juntos?'],
  ['What is a small surprise that would make your day?', '¿Qué pequeña sorpresa te alegraría el día?'],
  ['What did you learn about love from someone you admire?', '¿Qué aprendiste sobre el amor de alguien que admiras?'],
  ['What is one word for how you feel about us today?', '¿Qué palabra describe cómo te sientes con nosotros hoy?'],
];

// Local calendar day as YYYY-MM-DD.
export function today(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function questionFor(day: string): number {
  const n = Math.floor(Date.parse(day + 'T00:00:00Z') / 86400000);
  return ((n % QUESTIONS.length) + QUESTIONS.length) % QUESTIONS.length;
}
// Days in a row (ending today or yesterday) on which BOTH partners answered.
export function streak(daysBoth: Set<string>, now = new Date()): number {
  const d = new Date(now); if (!daysBoth.has(today(d))) d.setDate(d.getDate() - 1);
  let n = 0; while (daysBoth.has(today(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// A calendar file with a monthly re-check reminder (works in Apple, Google and Outlook calendars).
export function recheckIcs(base: string, start = new Date()): string {
  const d = new Date(start); d.setMonth(d.getMonth() + 1); d.setDate(1);
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}01`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Upfront Consulting with Tiff & Reco LLC//Marriage Mode//EN', 'BEGIN:VEVENT',
    `UID:marriage-mode-recheck-${stamp}@marriagemode`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd}`, 'RRULE:FREQ=MONTHLY;BYMONTHDAY=1',
    'SUMMARY:Marriage Mode monthly re-check (5 minutes)',
    `DESCRIPTION:Search your inbox again\\, glance at your card statement\\, and make sure no old account came back. Open: ${base}/audit/`,
    'BEGIN:VALARM', 'TRIGGER:PT9H', 'ACTION:DISPLAY', 'DESCRIPTION:Marriage Mode re-check', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
