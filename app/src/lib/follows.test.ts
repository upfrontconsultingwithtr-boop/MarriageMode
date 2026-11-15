import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extract, flag, type Account } from './follows.ts';

test('reads Instagram, Facebook and TikTok follow/friend exports', () => {
  const m = new Map<string, Account>();
  extract('connections/followers_and_following/following.json', JSON.stringify({ relationships_following: [
    { title: 'jake_the_ex', string_list_data: [{ href: 'https://www.instagram.com/_u/jake_the_ex', timestamp: 1 }] },
    { title: '', string_list_data: [{ href: 'https://www.instagram.com/singles_meetup_atl', value: 'singles_meetup_atl', timestamp: 2 }] },
    { title: 'grandma_rose', string_list_data: [{ href: 'https://www.instagram.com/grandma_rose', timestamp: 3 }] }] }), m);
  extract('friends_and_followers/your_friends.json', JSON.stringify({ friends_v2: [{ name: 'Maria Lopez', timestamp: 1 }, { name: 'Tom Smith', timestamp: 2 }] }), m);
  extract('TikTok/Activity/Following List.json', JSON.stringify({ Activity: { 'Following List': { Following: [{ Date: 'x', UserName: 'spicy.content' }] } } }), m);
  const all = [...m.values()];
  assert.equal(all.length, 6);
  const r = flag(all, ['Jake', 'maria lopez']);
  const flagged = r.filter((a) => a.reasons.length).map((a) => a.handle).sort();
  assert.deepEqual(flagged, ['Maria Lopez', 'jake_the_ex', 'singles_meetup_atl', 'spicy.content'].sort());
  assert.ok(r.find((a) => a.handle === 'grandma_rose')!.reasons.length === 0);
  assert.equal(all.find((a) => a.handle === 'spicy.content')!.url, 'https://www.tiktok.com/@spicy.content');
});
