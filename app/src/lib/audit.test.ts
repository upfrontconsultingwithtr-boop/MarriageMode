import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSteps, score, gmailQuery, emailDomainsFor, GENERAL_STEPS, shareSummary } from './audit.ts';
import { PLATFORMS } from './catalog.ts';

test('catalog ids are unique', () => {
  const ids = PLATFORMS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('buildSteps creates four steps per standard platform plus general steps', () => {
  const steps = buildSteps({ platformIds: ['tinder'], custom: [] });
  assert.equal(steps.length, 4 + GENERAL_STEPS.length);
  assert.equal(new Set(steps.map((s) => s.id)).size, steps.length);
});

test('Facebook Dating skips app removal, billing and email steps', () => {
  const steps = buildSteps({ platformIds: ['fbdating'], custom: [] });
  assert.equal(steps.filter((s) => s.platformId === 'fbdating').length, 1);
});

test('custom platforms get the full step set', () => {
  const steps = buildSteps({ platformIds: [], custom: ['Lovoo'] });
  assert.equal(steps.filter((s) => s.id.startsWith('custom-lovoo')).length, 4);
});

test('scores: empty is 0, all done is 100', () => {
  const steps = buildSteps({ platformIds: ['tinder', 'hinge'], custom: [] });
  assert.equal(score(steps, {}).organization, 0);
  const all = Object.fromEntries(steps.map((s) => [s.id, true]));
  const s = score(steps, all);
  assert.equal(s.organization, 100);
  assert.equal(s.progress, 100);
  assert.equal(s.accountsClosed, 2);
});

test('closing accounts weighs more than social steps', () => {
  const steps = buildSteps({ platformIds: ['tinder'], custom: [] });
  const accounts = score(steps, { 'tinder:delete': true, 'tinder:app': true }).organization;
  const social = score(steps, { 'g:contacts': true, 'g:threads': true }).organization;
  assert.ok(accounts > social);
});

test('gmail query lists chosen domains only', () => {
  assert.equal(gmailQuery(emailDomainsFor(['tinder'])), 'from:(tinder.com OR gotinder.com)');
  assert.ok(emailDomainsFor([]).length > 20);
});

test('share summary never includes platform names', () => {
  const steps = buildSteps({ platformIds: ['grindr'], custom: [] });
  const text = shareSummary(score(steps, { 'grindr:delete': true }));
  assert.ok(!text.includes('Grindr'));
  assert.match(text, /Closed 1 of 1/);
});

import { merge } from './cloud.ts';
test('merge keeps every app and every finished step from both devices', () => {
  const a = { platformIds: ['tinder'], custom: [], done: { 'tinder:delete': true }, doneAt: { 'tinder:delete': '2026-11-01' } };
  const b = { platformIds: ['hinge'], custom: ['Lovoo'], done: { 'hinge:app': true, 'tinder:delete': false }, doneAt: {} };
  const m = merge(a, b);
  assert.deepEqual(m.platformIds.sort(), ['hinge', 'tinder']);
  assert.equal(m.done['tinder:delete'], true); assert.equal(m.done['hinge:app'], true);
  assert.deepEqual(m.custom, ['Lovoo']);
});

import { buildSearches } from './websearch.ts';
test('web self-search: merge keeps saved searches; queries stay short', () => {
  const m = merge({ platformIds: [], custom: [], done: {}, web: { usernames: ['tiff'], emails: [], results: { x: 'found' } } },
                  { platformIds: [], custom: [], done: {}, web: { usernames: ['tr22'], emails: ['a@b.co'], results: {} } });
  assert.deepEqual(m.web?.usernames.sort(), ['tiff', 'tr22']); assert.equal(m.web?.results.x, 'found');
  const s = buildSearches(['@tiff'], ['A@B.co', 'not-an-email']);
  assert.ok(s.every((x) => decodeURIComponent(x.url).split(/\s+/).length <= 32));
  assert.ok(s.some((x) => x.label.includes('"tiff"')) && s.some((x) => x.label.includes('a@b.co')));
  assert.equal(s.filter((x) => x.kind === 'email').length, 2);
});

import { scanText, MATCHERS } from './scan.ts';
test('data scan finds platforms by web address and safe names, ignores common words', () => {
  const acc = new Map();
  scanText('Logged in with Facebook to Tinder. Email from noreply@hinge.co. A good match for her, seeking boo.', 'apps.json', acc);
  const ids = [...acc.keys()].sort();
  assert.deepEqual(ids, ['hinge', 'tinder']);
  assert.ok(MATCHERS.length > 20);
});

test('Spanish steps: every catalog delete path and general step is translated', async () => {
  const { PLATFORMS } = await import('./catalog.ts');
  const steps = buildSteps({ platformIds: PLATFORMS.map((p) => p.id), custom: ['Lovoo'] }, 'es');
  for (const st of steps) {
    assert.ok(!/^(Delete|Cancel|Remove|Unsubscribe|Review|Archive|Search|Check)\b/.test(st.label), st.label);
    if (st.kind === 'delete_profile' && st.detail) assert.ok(/^En /.test(st.detail), st.detail);
  }
  assert.equal(steps.length, buildSteps({ platformIds: PLATFORMS.map((p) => p.id), custom: ['Lovoo'] }).length);
});
