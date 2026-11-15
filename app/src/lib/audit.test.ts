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
