import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dueDates } from './reminderDates.ts';

const now = Date.parse('2026-11-16T12:00:00');
test('push reminders: one date per waiting request plus the monthly re-check, no names', () => {
  const d = dueDates({ platformIds: [], custom: [], done: {}, requests: { Tinder: '2026-11-01T12:00:00', Hinge: '2026-11-02T12:00:00' }, replied: { Hinge: '2026-11-10T12:00:00' }, recheckedAt: ['2026-11-10T12:00:00'] }, now);
  assert.deepEqual(d, ['2026-12-01', '2026-12-10']);
  assert.doesNotMatch(d.join(), /Tinder|Hinge/);
});
test('push reminders: overdue items come due today, never in the past', () => {
  assert.deepEqual(dueDates({ platformIds: [], custom: [], done: {}, requests: { X: '2026-09-01T12:00:00' } }, now), ['2026-11-16']);
});
