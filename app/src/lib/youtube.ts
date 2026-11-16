// "Connect YouTube": the customer signs in with Google (read-only YouTube permission) and
// Marriage Mode reads the channels they subscribe to, straight from YouTube, in their browser.
// Nothing is stored on our side. Uses the free Upfront HQ Google sign-in.
import type { Account } from './follows';
// Google sign-in runs through the Upfront HQ Firebase project (public browser key, safe to ship).
const FB = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '', authDomain: 'upfront-command-center.firebaseapp.com', projectId: 'upfront-command-center' };
export const GOOGLE_CLIENT_ID = FB.apiKey; // kept name: "is Connect YouTube switched on?"

export async function connectYouTube(): Promise<Account[]> {
  const { initializeApp, getApps } = await import('firebase/app');
  const { getAuth, GoogleAuthProvider, signInWithPopup, signOut } = await import('firebase/auth');
  const app = getApps().find((x) => x.name === 'mm-yt') ?? initializeApp(FB, 'mm-yt');
  const auth = getAuth(app); const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/youtube.readonly'); provider.setCustomParameters({ prompt: 'select_account' });
  const res = await signInWithPopup(auth, provider);
  const token = GoogleAuthProvider.credentialFromResult(res)?.accessToken;
  // Nothing kept on our side: remove the sign-in record right away.
  try { await res.user.delete(); } catch { await signOut(auth).catch(() => {}); }
  if (!token) throw new Error('denied');
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
  void fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST', mode: 'no-cors' }).catch(() => {}); // drop access right away
  return out;
}
