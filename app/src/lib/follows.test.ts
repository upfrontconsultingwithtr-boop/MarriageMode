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

test('marks mutual vs one-way follows and recent follows', () => {
  const m = new Map<string, Account>();
  extract('connections/followers_and_following/following.json', JSON.stringify({ relationships_following: [
    { title: 'bestie', string_list_data: [{ href: 'https://www.instagram.com/bestie', timestamp: 1500000000 }] },
    { title: 'new_stranger', string_list_data: [{ href: 'https://www.instagram.com/new_stranger', timestamp: 1790000000 }] }] }), m);
  extract('connections/followers_and_following/followers_1.json', JSON.stringify([{ title: '', string_list_data: [{ href: 'https://www.instagram.com/bestie', value: 'bestie', timestamp: 1 }] }]), m);
  const all = [...m.values()];
  assert.equal(all.find((a) => a.handle === 'bestie')!.kind, 'mutual follow');
  assert.equal(all.find((a) => a.handle === 'new_stranger')!.kind, 'you follow');
  const r = flag(all, [], '2026-01-01');
  assert.ok(r.find((a) => a.handle === 'new_stranger')!.reasons.some((x) => x.includes('after your relationship')));
  assert.equal(r.find((a) => a.handle === 'bestie')!.reasons.length, 0);
});

test('flags dating/sex influencers and groups', () => {
  const m = new Map<string, Account>();
  extract('connections/followers_and_following/following.json', JSON.stringify({ relationships_following: [{ title: 'the_dating_coach_mike', string_list_data: [{ href: 'https://www.instagram.com/the_dating_coach_mike', timestamp: 1 }] }, { title: 'sussex_gardens', string_list_data: [{ href: 'https://www.instagram.com/sussex_gardens', timestamp: 1 }] }] }), m);
  extract('your_facebook_activity/groups/your_group_membership_activity.json', JSON.stringify({ groups_joined_v2: [{ title: 'Atlanta Singles Hookups', timestamp: 1700000000 }, { title: 'Bible Study Moms', timestamp: 1700000000 }] }), m);
  const r = flag([...m.values()], []);
  const f = r.filter((a) => a.reasons.length).map((a) => a.handle).sort();
  assert.deepEqual(f, ['Atlanta Singles Hookups', 'the_dating_coach_mike']);
});

test('flags likely the sex they date only with another warning sign', () => {
  const m = new Map<string, Account>();
  extract('connections/followers_and_following/following.json', JSON.stringify({ relationships_following: [
    { title: 'jessica.fit', string_list_data: [{ href: 'https://www.instagram.com/jessica.fit', timestamp: 1790000000 }] },
    { title: 'maria_lopez', string_list_data: [{ href: 'https://www.instagram.com/maria_lopez', timestamp: 1500000000 }] },
    { title: 'jake_m', string_list_data: [{ href: 'https://www.instagram.com/jake_m', timestamp: 1790000000 }] }] }), m);
  extract('connections/followers_and_following/followers_1.json', JSON.stringify([{ string_list_data: [{ href: 'https://www.instagram.com/maria_lopez', value: 'maria_lopez', timestamp: 1 }] }]), m);
  const r = flag([...m.values()], [], '2026-01-01', 'women');
  assert.ok(r.find((a) => a.handle === 'jessica.fit')!.reasons.some((x) => x.includes('likely a woman')));
  assert.ok(!r.find((a) => a.handle === 'maria_lopez')!.reasons.some((x) => x.includes('likely')));
  assert.ok(!r.find((a) => a.handle === 'jake_m')!.reasons.some((x) => x.includes('likely')));
});
