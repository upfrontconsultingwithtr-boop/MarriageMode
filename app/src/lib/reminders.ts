// Free home-screen reminders (web push). No account: the device keeps a random token and
// we store only its push address and the DATES something is due. Never app names or content.
import { cloud } from './cloud';
import { BASE } from './base';

export const VAPID_PUBLIC = 'BIru7y6HLDVh8NFj8ibWSqdnvosHwXPh6ffzUF1tVnXQbdi_72qId0rdjOAxGbcM0qIUL2l8f_6xt4ctOJkyXK8';
const TOKEN = 'mm-push-token';
export { dueDates } from './reminderDates';

export const pushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
export const isIphone = () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
const token = () => { try { return localStorage.getItem(TOKEN); } catch { return null; } };
export const pushOn = () => Boolean(token()) && pushSupported() && Notification.permission === 'granted';

const key = (b64: string) => { const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(s, (c) => c.charCodeAt(0)); };

async function save(sub: PushSubscription, t: string, lang: string, dates: string[]) {
  const c = cloud(); if (!c) return 'Reminders are not set up yet.';
  const j = sub.toJSON();
  const { error } = await c.rpc('push_save', { t, ep: j.endpoint, key: j.keys?.p256dh, au: j.keys?.auth, lg: lang === 'es' ? 'es' : 'en', dates });
  return error ? error.message : null;
}

export async function enablePush(lang: string, dates: string[]): Promise<string | null> {
  if (!pushSupported()) return 'unsupported';
  if ((await Notification.requestPermission()) !== 'granted') return 'denied';
  const reg = await navigator.serviceWorker.register(`${BASE}/sw.js`, { scope: `${BASE}/` }).then(() => navigator.serviceWorker.ready);
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key(VAPID_PUBLIC) }));
  const t = token() ?? crypto.randomUUID();
  const err = await save(sub, t, lang, dates);
  if (!err) try { localStorage.setItem(TOKEN, t); } catch { /* private mode */ }
  return err;
}

export async function syncPush(lang: string, dates: string[]) {
  const t = token(); if (!t || !pushOn()) return;
  const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
  if (sub) await save(sub, t, lang, dates);
}

// Instant off: the row is deleted from our database and the browser forgets the address.
export async function disablePush() {
  const t = token();
  if (t) await cloud()?.rpc('push_forget', { t });
  try { localStorage.removeItem(TOKEN); } catch { /* ignore */ }
  if (pushSupported()) await (await navigator.serviceWorker.getRegistration(`${BASE}/`))?.pushManager.getSubscription().then((s) => s?.unsubscribe());
}
