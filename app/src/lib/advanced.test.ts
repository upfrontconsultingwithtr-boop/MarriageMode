// Acceptance tests 1-10 from the Marriage Mode Advanced build instructions (logic level).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accountFor, tick, status, score } from './adv/accounts.ts';
import { canWipe, sweepLock, fresh, type AdvState } from './adv/store.ts';
import { LESSONS, answer, differences, type Worksheet } from './adv/learn.ts';
import { sweepInbox, sweepSocial, sweepDevice, parseDemoSocial, parseDevice, sortMostAccess, type Flag } from './adv/sweep.ts';
import { DEMO_INBOX, DEMO_SOCIAL, DEMO_DEVICE, DEMO_EXES } from './adv/demo.ts';
import { backupOf, enqueue, nextBatch, confirmBatch, undoItem } from './adv/queue.ts';
import { searchesFor } from './adv/solo.ts';
import { reply, MIA_SAFETY } from './adv/mia.ts';
import { buildReport, reportText, bothView, encodeReport, decodeReport, recheck } from './adv/report.ts';
import { SOCIALS } from './adv/platforms.ts';

function demoSweep() {
  const inbox = sweepInbox({ file: 'demo-inbox.txt', text: DEMO_INBOX });
  const known = { exes: DEMO_EXES, pastMatches: inbox.matches };
  const social = parseDemoSocial(DEMO_SOCIAL, 'demo-social.json').flatMap((d) => sweepSocial(d, known));
  const device = sweepDevice(parseDevice(DEMO_DEVICE, 'demo-device.json'), known);
  return { inbox, social, device, all: [...inbox.flags, ...social, ...device] };
}

test('1: one step = In progress and score unchanged; 4 steps = closed and score rises; CLEAR gate', () => {
  let a = accountFor('tinder'); const before = score([a]).score;
  a = tick(a, 'delete', true); assert.equal(status(a), 'progress'); assert.equal(score([a]).score, before); assert.equal(a.closedAt, undefined);
  for (const s of ['billing', 'app', 'emails'] as const) a = tick(a, s, true);
  assert.equal(status(a), 'closed'); assert.ok(score([a]).score > before); assert.ok(a.closedAt);
  assert.equal(canWipe('clear'), false); assert.equal(canWipe('CLEAR '), false); assert.equal(canWipe('CLEAR'), true);
});

test('2: six lessons with reflection + action; worksheet saved separately and differences shown', () => {
  assert.equal(LESSONS.length, 6); for (const l of LESSONS) { assert.ok(l.reflect[0] && l.action[0] && l.body[1].length); }
  let ws: Worksheet = { a: {}, b: {} }; ws = answer(ws, 'a', 'ex-follow', 'no'); ws = answer(ws, 'b', 'ex-follow', 'ok'); ws = answer(ws, 'a', 'likes', 'no'); ws = answer(ws, 'b', 'likes', 'no');
  assert.deepEqual(ws.a, { 'ex-follow': 'no', likes: 'no' }); assert.deepEqual(ws.b, { 'ex-follow': 'ok', likes: 'no' }); assert.deepEqual(differences(ws), ['ex-follow']);
});

test('3: demo dating discovery finds exactly Tinder, Hinge, Bumble, OkCupid with evidence; benign stays unflagged', () => {
  const { inbox, all } = demoSweep();
  assert.deepEqual(inbox.hits.map((h) => h.platformId).sort(), ['bumble', 'hinge', 'okcupid', 'tinder']);
  for (const h of inbox.hits) assert.match(inbox.evidence[h.platformId], /^line \d+:/);
  for (const f of all) { assert.ok(f.why.length > 10, 'why'); assert.ok(f.source && f.evidence, 'source'); }
  for (const benign of ['Mom', 'Dr. Patel Dentist', 'Coach Mike (soccer)', 'First Demo Bank', 'Aunt Rosa', 'Sam Lee', 'Westside Parents PTA', 'Springfield Dog Owners']) assert.ok(!all.some((f) => f.who === benign), benign);
  assert.equal(SOCIALS.length, 9);
});

test('4: ex with repeat likes, risque follow/group and past match all flag as Risque with pattern + source', () => {
  const { social } = demoSweep();
  const exLikes = social.find((f) => f.handle === 'casey.rivera' && f.category === 'reactions'); assert.ok(exLikes?.risque); assert.match(exLikes!.why, /liked .* 12 times in 14 days/i);
  assert.ok(social.find((f) => f.who === 'Late Night Singles Hookups')?.risque);
  assert.ok(social.find((f) => f.who === 'hotsingles.meetup')?.risque);
  assert.ok(social.find((f) => f.handle === 'jordanb22' && /past dating match/.test(f.why))?.risque);
  assert.ok(!social.some((f) => /rosa|sam\.lee/i.test(f.handle ?? '')));
});

test('5: individual + mass select; backup required; batch of 5; undo; every item labelled', () => {
  const { all } = demoSweep();
  const one = all[0]; const cat = all.filter((f) => f.category === 'interactions');
  const r0 = enqueue([], [], [one]); assert.deepEqual(r0.refused, [one.id]); assert.equal(r0.queue.length, 0);
  const sel = [one, ...cat]; const backups = sel.map((f) => backupOf(f));
  const { queue } = enqueue([], backups, sel);
  for (const q of queue) { assert.ok(q.link.startsWith('http')); assert.ok(q.reason); assert.ok(['Automated', 'Guided', 'Manual'].includes(q.mode)); }
  const big = enqueue([], all.map((f) => backupOf(f)), all).queue; assert.ok(big.length > 5);
  const batch = nextBatch(big); assert.equal(batch.length, 5);
  const after = confirmBatch(big, batch.map((b) => b.id), 1); assert.equal(after.filter((x) => x.state === 'done').length, 5);
  const undone = undoItem(after, batch[0].id); assert.equal(undone.find((x) => x.id === batch[0].id)!.state, 'undone');
});

test('6: Sweep lock needs a valid partner email AND the tick', () => {
  assert.deepEqual(sweepLock({}), ['email-missing', 'ack-missing']);
  assert.deepEqual(sweepLock({ partnerEmail: 'nope', ack: true }), ['email-invalid']);
  assert.deepEqual(sweepLock({ partnerEmail: 'p@example.com', ack: false }), ['ack-missing']);
  assert.deepEqual(sweepLock({ partnerEmail: 'p@example.com', ack: true }), []);
});

test('7: exact public searches for every identifier type', () => {
  for (const [t, v] of [['email', 'a@b.com'], ['username', 'demo_user'], ['phone', '555-0199'], ['namecity', 'Demo Partner, Springfield'], ['photo', 'https://x.example/p.jpg'], ['other', 'tag']] as const) {
    const s = searchesFor(t, v); assert.ok(s.length >= 3, t); for (const x of s) assert.ok(x.url.startsWith('https://'), x.url);
  }
  const u = searchesFor('username', 'demo_user').map((s) => s.site).join(' ');
  for (const site of ['Google', 'Instagram', 'Threads', 'TikTok', 'X', 'Reddit', 'YouTube', 'Facebook', 'LinkedIn', 'Dating', 'Forums', 'Username checker']) assert.ok(u.includes(site), site);
});

test('8: access level shown, most-access-first sort, Unknown never guessed', () => {
  const { social } = demoSweep();
  const casey = social.find((f) => f.handle === 'casey.rivera')!; assert.equal(casey.access?.rel, 'close friend'); assert.ok(casey.access?.canSee?.includes('stories'));
  const snap = social.find((f) => f.handle === 'jordanb22')!; assert.ok(snap.access?.canSee?.includes('location'));
  const taylor = social.find((f) => f.handle === 'taylor.night')!; assert.equal(taylor.access?.rel, undefined); assert.ok(taylor.link?.startsWith('https://www.facebook.com/'));
  const sorted = sortMostAccess(social.filter((f) => f.access)); assert.equal(sorted[0].access?.rel, 'close friend'); assert.equal(sorted[sorted.length - 1].access?.rel, undefined);
});

test('9: Mia names real progress, gives one next step, answers in Spanish, safety copy has all 3 numbers', () => {
  const s: AdvState = { ...fresh(), intake: { stage: 'married', lang: 'en', support: 'hybrid', partnerEmail: 'p@example.com', ack: true } };
  let a = accountFor('tinder'); for (const k of ['delete', 'billing', 'app', 'emails'] as const) a = tick(a, k, true);
  s.accounts = [a, accountFor('hinge')];
  const en = reply('What should I do next?', { s, es: false }); assert.match(en, /Tinder/); assert.match(en, /1 of 2/); assert.match(en, /Next step: .*Hinge/);
  const es = reply('¿Qué hago ahora?', { s, es: true }); assert.match(es, /Siguiente paso/); assert.match(es, /cuentas cerradas/);
  for (const n of ['911', '988', '1-800-799-7233']) { assert.ok(MIA_SAFETY[0].includes(n)); assert.ok(MIA_SAFETY[1].includes(n)); }
});

test('10: verified date, sharing toggles, both-view only shared sections, re-check finds reappearing app', () => {
  const s = fresh(); let a = accountFor('tinder'); for (const k of ['delete', 'billing', 'app', 'emails'] as const) a = tick(a, k, true); s.accounts = [a];
  const full = buildReport(s, 'all'); assert.equal(full.closed![0].closedAt, a.closedAt!.slice(0, 10)); assert.match(reportText(full), /Tinder \(\d{4}-\d{2}-\d{2}\)/);
  const partial = buildReport(s, { score: true, accounts: false, sweep: false, queue: false }); assert.equal(partial.closed, undefined); assert.doesNotMatch(reportText(partial), /Tinder/);
  const theirs = decodeReport('#p=' + encodeReport(buildReport(s, { score: true, accounts: true, sweep: false, queue: false })))!;
  const v = bothView(partial, theirs); assert.deepEqual(v.rows.map((r) => r.key), ['Score']);
  assert.deepEqual(recheck(s, 'Your Tinder Gold receipt from gotinder.com').reappeared.map((x) => x.id), ['tinder']);
});

const _unused: Flag[] = []; void _unused;
