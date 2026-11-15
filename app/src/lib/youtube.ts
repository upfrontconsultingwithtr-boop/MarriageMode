// "Connect YouTube": the customer signs in with Google (read-only YouTube permission) and
// Marriage Mode reads the channels they subscribe to, straight from YouTube, in their browser.
// Nothing is stored on our side. Needs NEXT_PUBLIC_GOOGLE_CLIENT_ID (free Google sign-in key).
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Account } from './follows';
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

function loadGis(): Promise<void> {
  return new Promise((res, rej) => {
    if ((window as any).google?.accounts?.oauth2) { res(); return; }
    const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
    s.onload = () => res(); s.onerror = () => rej(new Error('gis')); document.head.appendChild(s);
  });
}

export async function connectYouTube(): Promise<Account[]> {
  await loadGis();
  const token: string = await new Promise((res, rej) => {
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID, scope: 'https://www.googleapis.com/auth/youtube.readonly',
      callback: (r: any) => (r?.access_token ? res(r.access_token) : rej(new Error('denied'))),
      error_callback: () => rej(new Error('denied')),
    });
    client.requestAccessToken();
  });
  const out: Account[] = []; let page = '';
  for (let i = 0; i < 20; i++) {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50${page ? `&pageToken=${page}` : ''}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error('api');
    const d = await r.json();
    for (const it of d.items ?? []) {
      const title: string = it.snippet?.title ?? ''; const ch: string = it.snippet?.resourceId?.channelId ?? '';
      out.push({ key: `youtube:${title.toLowerCase()}`, platform: 'youtube', handle: title, url: ch ? `https://www.youtube.com/channel/${ch}` : '', kind: 'you follow', reasons: [], youFollow: true, since: Date.parse(it.snippet?.publishedAt ?? '') || undefined });
    }
    page = d.nextPageToken; if (!page) break;
  }
  try { (window as any).google.accounts.oauth2.revoke(token, () => {}); } catch { /* done */ } // drop access right away
  return out;
}
