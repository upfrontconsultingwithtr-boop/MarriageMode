import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS, findTopics, coachReply } from './coachKnowledge.ts';
import { extractAssignment } from './assignments.ts';

test('every topic has English and Spanish advice with 3 options', () => {
  for (const t of TOPICS) for (const k of [t.en, t.es]) { assert.equal(k.options.length, 3); assert.ok(k.insight && k.ask); }
});
test('common couple issues are understood', () => {
  const cases: [string, string][] = [['We keep arguing about money', 'money'], ['he shuts down when I try to talk', 'shutdown'], ['she cheated', 'trust'], ['discutimos por dinero', 'money'], ['he drinks too much', 'addiction'], ['I think I want a divorce', 'breakup']];
  for (const [q, id] of cases) assert.ok(findTopics(q).some((t) => t.id === id), q);
});
test('replies include options, an assignment and (for serious topics) a licensed professional', () => {
  const r = coachReply('she cheated and I cant trust her', false)!;
  assert.match(r, /1\. .*\n2\. .*\n3\. /s); assert.match(r, /licensed/); assert.equal(extractAssignment(r)?.length ? true : false, true);
});
test('assignment line is extracted in both languages', () => {
  assert.equal(extractAssignment('Nice.\nYour assignment this week: take a 10-minute walk together.\nHow does that sound?'), 'take a 10-minute walk together.');
  assert.equal(extractAssignment('Tu tarea de esta semana: escribir tres cosas que aprecias.'), 'escribir tres cosas que aprecias.');
});
