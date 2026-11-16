// "Do it for me": the customer allows Gmail's SEND-ONLY permission once, and their own Gmail sends
// each deletion request. Marriage Mode can't read their email, keeps nothing, and drops the access
// right after. Same free Upfront HQ Google sign-in as Connect YouTube.
import { GOOGLE_CLIENT_ID } from './youtube';

// Hidden until switched on in the site build (NEXT_PUBLIC_GMAIL_SEND=1) after review.
export const gmailEnabled = Boolean(GOOGLE_CLIENT_ID) && process.env.NEXT_PUBLIC_GMAIL_SEND === '1';
import { rawMessage, type Mail } from './gmailRaw';
export type { Mail };

async function gmailToken(): Promise<string> {
  const { initializeApp, getApps } = await import('firebase/app');
  const { getAuth, GoogleAuthProvider, signInWithPopup, signOut } = await import('firebase/auth');
  const FB = { apiKey: GOOGLE_CLIENT_ID, authDomain: 'upfront-command-center.firebaseapp.com', projectId: 'upfront-command-center' };
  const app = getApps().find((x) => x.name === 'mm-gm') ?? initializeApp(FB, 'mm-gm');
  const auth = getAuth(app); const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/gmail.send'); provider.setCustomParameters({ prompt: 'select_account' });
  const res = await signInWithPopup(auth, provider);
  const token = GoogleAuthProvider.credentialFromResult(res)?.accessToken;
  try { await res.user.delete(); } catch { await signOut(auth).catch(() => {}); } // keep no sign-in record
  if (!token) throw new Error('denied');
  return token;
}

// Sends each mail from the customer's own Gmail. Returns which ones went out.
export async function sendAll(mails: Mail[]): Promise<{ sent: number[]; error?: string }> {
  const token = await gmailToken();
  const sent: number[] = []; let error: string | undefined;
  for (const [i, m] of mails.entries()) {
    const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ raw: rawMessage(m) }) });
    if (r.ok) sent.push(i); else { error = r.status === 403 ? 'blocked' : 'api'; break; }
  }
  void fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST', mode: 'no-cors' }).catch(() => {}); // drop access right away
  return { sent, error };
}
