// Self-search on the open web: builds search links for the person's OWN
// usernames and emails. Runs in their browser (free); nothing is sent to us.
import { PLATFORMS } from './catalog.ts';

export type Search = { id: string; label: string; url: string; kind: 'username' | 'email' | 'phone' };

const g = (q: string) => 'https://www.google.com/search?q=' + encodeURIComponent(q);
const DOMAINS = PLATFORMS.map((p) => p.domain).filter((d): d is string => !!d && d !== 'facebook.com');

// Google caps queries at about 32 words, so the site list is split into small groups.
function groups<T>(xs: T[], n: number): T[][] { const out: T[][] = []; for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n)); return out; }

export function clean(v: string) { return v.trim().replace(/^@/, '').slice(0, 80); }

export function buildSearches(usernames: string[], emails: string[]): Search[] {
  const out: Search[] = [];
  for (const u of usernames.map(clean).filter(Boolean)) {
    groups(DOMAINS, 9).forEach((ds, i) => out.push({ id: `u:${u}:${i}`, kind: 'username', label: `"${u}" on dating sites (part ${i + 1})`, url: g(`"${u}" (${ds.map((d) => `site:${d}`).join(' OR ')})`) }));
    out.push({ id: `u:${u}:any`, kind: 'username', label: `"${u}" anywhere with "dating"`, url: g(`"${u}" dating profile`) });
  }
  for (const e of emails.map((x) => x.trim().toLowerCase()).filter((x) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x))) {
    out.push({ id: `e:${e}:web`, kind: 'email', label: `"${e}" mentioned on the web`, url: g(`"${e}"`) });
    out.push({ id: `e:${e}:breach`, kind: 'email', label: `Old sign-ups exposed in data breaches (Have I Been Pwned)`, url: 'https://haveibeenpwned.com/' });
  }
  return out;
}

// Apps that sign you in with your phone number: trying to log in shows whether
// an account exists, and only the phone's owner gets the code.
export const PHONE_LOGIN_APPS = ['Tinder', 'Hinge', 'Bumble', 'Grindr', 'Hily', 'Badoo'];
