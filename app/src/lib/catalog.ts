// Dating platform catalog. Data, not logic: add a platform by adding a row.
// `emailDomains` feed the Gmail search; `deletePath` is the in-app route,
// worded generally because platforms rename menus often. Each entry links to a
// help search so users land on the platform's current official page.

export type Category = 'mainstream' | 'faith' | 'lgbtq' | 'niche' | 'mature' | 'other';
export type Billing = 'apple' | 'google' | 'web';

export interface Platform {
  id: string;
  name: string;
  category: Category;
  domain?: string;
  emailDomains: string[];
  deletePath: string;
  billing: Billing[];
}

const STD = 'In the app: Profile or Settings → Account → Delete account (not just "pause" or "hide").';
const ALL: Billing[] = ['apple', 'google', 'web'];

export const CATALOG_VERIFIED = '2026-11-15';

export const PLATFORMS: Platform[] = [
  { id: 'tinder', name: 'Tinder', category: 'mainstream', domain: 'tinder.com', emailDomains: ['tinder.com', 'gotinder.com'], deletePath: 'In the app: Profile → Settings → scroll to the bottom → Delete account.', billing: ALL },
  { id: 'bumble', name: 'Bumble', category: 'mainstream', domain: 'bumble.com', emailDomains: ['bumble.com'], deletePath: STD, billing: ALL },
  { id: 'hinge', name: 'Hinge', category: 'mainstream', domain: 'hinge.co', emailDomains: ['hinge.co'], deletePath: STD, billing: ALL },
  { id: 'match', name: 'Match', category: 'mainstream', domain: 'match.com', emailDomains: ['match.com'], deletePath: STD, billing: ALL },
  { id: 'okcupid', name: 'OkCupid', category: 'mainstream', domain: 'okcupid.com', emailDomains: ['okcupid.com'], deletePath: STD, billing: ALL },
  { id: 'pof', name: 'Plenty of Fish', category: 'mainstream', domain: 'pof.com', emailDomains: ['pof.com'], deletePath: STD, billing: ALL },
  { id: 'eharmony', name: 'eharmony', category: 'mainstream', domain: 'eharmony.com', emailDomains: ['eharmony.com'], deletePath: STD, billing: ALL },
  { id: 'cmb', name: 'Coffee Meets Bagel', category: 'mainstream', domain: 'coffeemeetsbagel.com', emailDomains: ['coffeemeetsbagel.com'], deletePath: STD, billing: ALL },
  { id: 'zoosk', name: 'Zoosk', category: 'mainstream', domain: 'zoosk.com', emailDomains: ['zoosk.com'], deletePath: STD, billing: ALL },
  { id: 'fbdating', name: 'Facebook Dating', category: 'mainstream', domain: 'facebook.com', emailDomains: [], deletePath: 'In the Facebook app: Menu → Dating → Settings (gear) → General → Delete profile. Your main Facebook account stays.', billing: [] },
  { id: 'badoo', name: 'Badoo', category: 'mainstream', domain: 'badoo.com', emailDomains: ['badoo.com'], deletePath: STD, billing: ALL },
  { id: 'happn', name: 'happn', category: 'mainstream', domain: 'happn.com', emailDomains: ['happn.com'], deletePath: STD, billing: ALL },
  { id: 'hily', name: 'Hily', category: 'mainstream', domain: 'hily.com', emailDomains: ['hily.com'], deletePath: STD, billing: ALL },
  { id: 'league', name: 'The League', category: 'niche', domain: 'theleague.com', emailDomains: ['theleague.com'], deletePath: STD, billing: ALL },
  { id: 'raya', name: 'Raya', category: 'niche', emailDomains: [], deletePath: STD, billing: ['apple', 'google'] },
  { id: 'feeld', name: 'Feeld', category: 'niche', domain: 'feeld.co', emailDomains: ['feeld.co'], deletePath: STD, billing: ALL },
  { id: 'boo', name: 'Boo', category: 'niche', domain: 'boo.world', emailDomains: ['boo.world'], deletePath: STD, billing: ALL },
  { id: 'elitesingles', name: 'EliteSingles', category: 'niche', domain: 'elitesingles.com', emailDomains: ['elitesingles.com'], deletePath: STD, billing: ALL },
  { id: 'seeking', name: 'Seeking', category: 'niche', domain: 'seeking.com', emailDomains: ['seeking.com'], deletePath: STD, billing: ALL },
  { id: 'christianmingle', name: 'Christian Mingle', category: 'faith', domain: 'christianmingle.com', emailDomains: ['christianmingle.com'], deletePath: STD, billing: ALL },
  { id: 'jdate', name: 'JDate', category: 'faith', domain: 'jdate.com', emailDomains: ['jdate.com'], deletePath: STD, billing: ALL },
  { id: 'muzz', name: 'Muzz', category: 'faith', domain: 'muzz.com', emailDomains: ['muzz.com', 'muzmatch.com'], deletePath: STD, billing: ALL },
  { id: 'grindr', name: 'Grindr', category: 'lgbtq', domain: 'grindr.com', emailDomains: ['grindr.com'], deletePath: STD, billing: ALL },
  { id: 'her', name: 'HER', category: 'lgbtq', domain: 'weareher.com', emailDomains: ['weareher.com'], deletePath: STD, billing: ALL },
  { id: 'taimi', name: 'Taimi', category: 'lgbtq', domain: 'taimi.com', emailDomains: ['taimi.com'], deletePath: STD, billing: ALL },
  { id: 'ourtime', name: 'OurTime', category: 'mature', domain: 'ourtime.com', emailDomains: ['ourtime.com'], deletePath: STD, billing: ALL },
  { id: 'silversingles', name: 'SilverSingles', category: 'mature', domain: 'silversingles.com', emailDomains: ['silversingles.com'], deletePath: STD, billing: ALL },
  { id: 'ashleymadison', name: 'Ashley Madison', category: 'other', domain: 'ashleymadison.com', emailDomains: ['ashleymadison.com'], deletePath: 'On the website: Account settings → Delete profile. Ask for full deletion, not just hiding the profile.', billing: ['web'] },
  { id: 'aff', name: 'AdultFriendFinder', category: 'other', domain: 'adultfriendfinder.com', emailDomains: ['adultfriendfinder.com'], deletePath: 'On the website: Account settings → Close account.', billing: ['web'] },
];

export const CATEGORY_LABEL: Record<Category, string> = {
  mainstream: 'Popular apps', niche: 'Niche & invite-only', faith: 'Faith-based', lgbtq: 'LGBTQ+', mature: '50+', other: 'Other sites',
};

export const BILLING_LINKS = {
  apple: { label: 'Apple subscriptions', url: 'https://apps.apple.com/account/subscriptions', how: 'iPhone: Settings → your name → Subscriptions.' },
  google: { label: 'Google Play subscriptions', url: 'https://play.google.com/store/account/subscriptions', how: 'Android: Play Store → your profile icon → Payments & subscriptions → Subscriptions.' },
  web: { label: 'Website billing', url: '', how: 'If you paid on the website, cancel under the site\'s account or billing settings, then check your card statement next month.' },
} as const;

export function helpSearchUrl(p: { name: string }): string {
  return 'https://www.google.com/search?q=' + encodeURIComponent(`${p.name} delete account official help`);
}
