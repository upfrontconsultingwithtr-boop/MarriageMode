// Three clearly labelled FICTIONAL demo files, so anyone can test Marriage Mode Advanced with no real data.
// Every name, address and number below is invented. Phone numbers use the fictional 555-01xx range.
const d = (day: number, hm: string) => `2026-11-${String(day).padStart(2, '0')}T${hm}:00`;
const days = (from: number, n: number, hm: string) => Array.from({ length: n }, (_, i) => d(from + i, hm));

export const DEMO_EXES = ['Casey Rivera'];

export const DEMO_INBOX = `DEMO DATA: FICTIONAL TEST INBOX FOR MARRIAGE MODE. NOT REAL PEOPLE OR ACCOUNTS.
From: Tinder <no-reply@gotinder.com>
Subject: Someone new liked you
Date: 2026-10-28
From: Hinge <hello@hinge.co>
Subject: It's a match! You and Jordan Blake liked each other
Date: 2026-10-30
From: App Store <no_reply@email.apple.com>
Subject: Your receipt from Apple
APPLE.COM/BILL  BUMBLE PREMIUM 1 MONTH  $39.99
Date: 2026-11-01
From: Google Play <googleplay-noreply@google.com>
Subject: Your Google Play order receipt
OKCUPID BASIC (OkCupid)  $19.99/month  okcupid.com
Date: 2026-11-03
From: First Demo Bank <alerts@firstdemobank.example>
Subject: Your statement is ready
Date: 2026-11-04
From: Bright Smile Dental <office@brightsmile.example>
Subject: Reminder: cleaning on Tuesday
Date: 2026-11-05
From: Mom <mom@family.example>
Subject: Sunday dinner?
Date: 2026-11-06
From: Lincoln Elementary <office@lincoln-school.example>
Subject: Picture day is Friday
Date: 2026-11-07
`;

export const DEMO_SOCIAL = JSON.stringify({
  _demo: 'FICTIONAL DEMO DATA for testing Marriage Mode. Not real people.',
  format: 'marriage-mode-demo-social',
  platforms: [
    { platform: 'instagram', account_private: true,
      people: [
        { handle: 'casey.rivera', name: 'Casey Rivera', you_follow: true, follows_you: true, close_friend: true,
          likes: days(1, 12, '21:10'), messages: [d(2, '23:40'), d(5, '00:15'), d(9, '01:05'), d(11, '23:55')],
          profile_searches: [d(3, '22:00'), d(6, '22:30'), d(10, '23:10'), d(12, '07:45')], story_views: [d(4, '08:00'), d(8, '08:10'), d(12, '08:20')],
          comments: [{ at: d(7, '20:00'), text: 'Looking good 🔥' }] },
        { handle: 'jordan.blake', name: 'Jordan Blake', you_follow: true, follows_you: false, likes: [d(10, '12:00'), d(11, '12:00')] },
        { handle: 'aunt.rosa', name: 'Aunt Rosa', you_follow: true, follows_you: true, likes: days(1, 4, '18:00'), comments: [{ at: d(2, '18:05'), text: 'Love you tía!' }] },
        { handle: 'sam.lee', name: 'Sam Lee', you_follow: true, follows_you: true, likes: days(3, 3, '12:30'), comments: [{ at: d(4, '12:31'), text: 'Happy birthday!!' }] },
        { handle: 'old.troll99', name: 'old.troll99', blocked: true },
      ],
      groups: [{ name: 'hotsingles.meetup', kind: 'follow' }, { name: 'Westside Parents PTA', kind: 'group' }],
      posts: [{ at: d(6, '10:00'), caption: 'Sunday brunch with family', tags: ['aunt.rosa'] }, { at: d(9, '22:00'), caption: 'Miss you already 😘', tags: ['casey.rivera'] }] },
    { platform: 'facebook',
      people: [{ handle: 'taylor.night', name: 'Taylor Night', likes: days(2, 11, '22:30') }],
      groups: [{ name: 'Late Night Singles Hookups', kind: 'group' }, { name: 'Springfield Dog Owners', kind: 'group' }],
      posts: [] },
    { platform: 'snapchat',
      people: [{ handle: 'jordanb22', name: 'Jordan Blake', friend: true, location_shared: true }],
      groups: [], posts: [] },
  ],
}, null, 1);

export const DEMO_DEVICE = JSON.stringify({
  _demo: 'FICTIONAL DEMO DATA for testing Marriage Mode. Times and numbers only; message content is never read.',
  format: 'marriage-mode-demo-device',
  contacts: [
    { name: 'Mom', phone: '555-0100' }, { name: 'Dr. Patel Dentist', phone: '555-0101' }, { name: 'Coach Mike (soccer)', phone: '555-0102' },
    { name: 'First Demo Bank', phone: '555-0103' }, { name: 'Casey Rivera', phone: '555-0142' }, { name: 'Alex from Tinder', phone: '555-0177' },
  ],
  calls: [...days(1, 6, '17:30'), d(3, '23:30'), d(8, '23:45')].map((at) => ({ number: '555-0100', at }))
    .concat([d(4, '23:20'), d(9, '00:40'), d(13, '01:10')].map((at) => ({ number: '555-0142', at }))),
  texts: [d(2, '23:50'), d(6, '00:20'), d(10, '01:30'), d(14, '23:15')].map((at) => ({ number: '555-0177', at }))
    .concat(days(1, 5, '16:00').map((at) => ({ number: '555-0102', at }))),
}, null, 1);

export const DEMO_FILES = [
  { name: 'demo-inbox.txt', kind: 'inbox' as const, text: DEMO_INBOX },
  { name: 'demo-social.json', kind: 'social' as const, text: DEMO_SOCIAL },
  { name: 'demo-device.json', kind: 'device' as const, text: DEMO_DEVICE },
];
