import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wordShapes, MouthTrack } from './lipsync.ts';

test('words become mouth shapes in order, filling the word time', () => {
  const s = wordShapes('Hello!', 1000, 300);
  assert.deepEqual(s.map((x) => x.v), ['kk', 'E', 'DD', 'O']);
  assert.equal(Math.round(s[s.length - 1].t + s[s.length - 1].d), 1300);
  assert.deepEqual(wordShapes('mamá', 0, 200).map((x) => x.v), ['PP', 'aa', 'PP', 'aa']);
  assert.deepEqual(wordShapes('think', 0, 200).map((x) => x.v), ['TH', 'I', 'nn', 'kk']);
});

test('the mouth blends the sounding shape and rests in silence', () => {
  const m = new MouthTrack();
  const t0 = performance.now() + 1000;
  m.add([{ v: 'aa', t: t0, d: 200 }, { v: 'PP', t: t0 + 200, d: 100 }]);
  assert.equal(m.at(t0 + 100)[0][0], 'aa');
  assert.equal(m.at(t0 + 250)[0][0], 'PP');
  assert.equal(m.at(t0 + 600).length, 0);
  m.clear(); assert.equal(m.at(t0 + 100).length, 0);
});
