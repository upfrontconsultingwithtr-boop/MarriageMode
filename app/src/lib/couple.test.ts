import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeSpace, decodeSpace, upsertPerson, EMPTY_SPACE } from './couple.ts';

test('round-trips a space with unicode', () => {
  const sp = upsertPerson(EMPTY_SPACE, { name: 'Tiff ❤', progress: 80, closed: 4, total: 5, note: 'Done ✓', updated: '2026-11-15' });
  const back = decodeSpace('#' + encodeSpace({ ...sp, goals: [{ t: 'Agree on follows', done: false }] }));
  assert.equal(back?.people[0].name, 'Tiff ❤');
  assert.equal(back?.goals[0].t, 'Agree on follows');
});
test('rejects garbage and keeps two people max', () => {
  assert.equal(decodeSpace('#not-valid'), null);
  let sp = EMPTY_SPACE;
  for (const n of ['A', 'B', 'C']) sp = upsertPerson(sp, { name: n, updated: '' });
  assert.deepEqual(sp.people.map((p) => p.name), ['B', 'C']);
});
test('updating my card replaces it, not duplicates', () => {
  let sp = upsertPerson(EMPTY_SPACE, { name: 'Sam', progress: 10, updated: '' });
  sp = upsertPerson(sp, { name: 'sam', progress: 90, updated: '' });
  assert.equal(sp.people.length, 1); assert.equal(sp.people[0].progress, 90);
});
