import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS, questionFor, streak, today, recheckIcs } from './questions.ts';

test('same day gives the same question, in range', () => {
  const q = questionFor('2026-11-15');
  assert.equal(q, questionFor('2026-11-15'));
  assert.ok(q >= 0 && q < QUESTIONS.length);
  assert.notEqual(questionFor('2026-11-15'), questionFor('2026-11-16'));
});
test('streak counts consecutive days both answered, ending today or yesterday', () => {
  const now = new Date(2026, 10, 15, 12);
  const d = (n: number) => { const x = new Date(now); x.setDate(x.getDate() - n); return today(x); };
  assert.equal(streak(new Set([d(0), d(1), d(2)]), now), 3);
  assert.equal(streak(new Set([d(1), d(2)]), now), 2);
  assert.equal(streak(new Set([d(0), d(2)]), now), 1);
  assert.equal(streak(new Set([d(3)]), now), 0);
});
test('calendar reminder repeats monthly', () => {
  const ics = recheckIcs('https://x.test', new Date(2026, 10, 15));
  assert.match(ics, /RRULE:FREQ=MONTHLY/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261201/);
});
