import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanInteractions } from './interactions.ts';

test('finds risky interactions after the relationship date only', () => {
  const since = Date.parse('2025-01-01');
  const after = Date.parse('2025-06-01') / 1000, before = Date.parse('2024-06-01') / 1000;
  const files = [
    { path: 'your_instagram_activity/likes/liked_posts.json', text: JSON.stringify({ likes_media_likes: [
      ...Array.from({ length: 12 }, () => ({ title: 'gym_crush', string_list_data: [{ href: 'https://www.instagram.com/p/x', timestamp: after }] })),
      { title: 'old_friend', string_list_data: [{ href: 'https://www.instagram.com/p/y', timestamp: before }] }] }) },
    { path: 'your_instagram_activity/comments/post_comments_1.json', text: JSON.stringify([{ string_map_data: { Comment: { value: 'you look so hot 🔥' }, 'Media Owner': { value: 'gym_crush' }, Time: { timestamp: after } } }, { string_map_data: { Comment: { value: 'congrats on the new job!' }, 'Media Owner': { value: 'coworker_sam' }, Time: { timestamp: after } } }]) },
    { path: 'your_instagram_activity/messages/inbox/alex_123/message_1.json', text: JSON.stringify({ participants: [{ name: 'Alex' }, { name: 'Me' }], messages: [{ sender_name: 'Me', timestamp_ms: after * 1000, content: 'wyd tonight? 😏' }] }) },
  ];
  const r = scanInteractions(files, since, new Set());
  assert.equal(r[0].who, 'gym_crush'); assert.equal(r[0].likes, 12); assert.equal(r[0].flirty.length, 1);
  assert.ok(r.find((p) => p.who === 'Alex')!.flirty.length === 1);
  assert.ok(!r.find((p) => p.who === 'old_friend'));
  assert.equal(r.find((p) => p.who === 'coworker_sam')!.reasons.length, 0);
});
