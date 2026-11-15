// Partner space: link with your own partner, share progress, set goals and
// message each other. Needs the optional sign-in; row-level security means
// only the two linked partners can see anything here.
import { cloud } from './cloud';

export type Profile = { user_id: string; display_name: string | null; avatar_path: string | null; relationship_stage: string | null };
export type Couple = { id: string; status: 'pending' | 'active' | 'ended'; me: string; partner: string | null };
export type Message = { id: string; couple_id: string; author_id: string; body: string; created_at: string };
export type Goal = { id: string; title: string; done: boolean; created_by: string };
export type Shared = { progress?: number; closed?: number; total?: number; milestones?: string[]; note?: string; at: string };

const INVITE_KEY = 'marriage-mode:invite-token';
const JOIN_KEY = 'marriage-mode:join-token';

export async function me(): Promise<string | null> {
  const c = cloud(); if (!c) return null;
  const { data } = await c.auth.getUser(); return data.user?.id ?? null;
}

export async function myCouple(): Promise<Couple | null> {
  const c = cloud(); const uid = await me(); if (!c || !uid) return null;
  const { data: mine } = await c.from('couple_members').select('couple_id, couples(status, created_at)').eq('user_id', uid);
  const live = (mine ?? []).map((m) => ({ id: m.couple_id as string, ...(m.couples as unknown as { status: Couple['status']; created_at: string }) }))
    .filter((x) => x.status === 'active' || x.status === 'pending')
    .sort((a, b) => (a.status === 'active' ? -1 : 1) - (b.status === 'active' ? -1 : 1) || b.created_at.localeCompare(a.created_at));
  if (!live.length) return null;
  const top = live[0];
  const { data: members } = await c.from('couple_members').select('user_id').eq('couple_id', top.id);
  const partner = (members ?? []).map((m) => m.user_id as string).find((u) => u !== uid) ?? null;
  return { id: top.id, status: top.status, me: uid, partner };
}

export async function createInviteLink(site: string): Promise<string | null> {
  const c = cloud(); if (!c) return null;
  try { const saved = localStorage.getItem(INVITE_KEY); if (saved) return `${site}/audit/#join=${saved}`; } catch { /* ignore */ }
  const { data, error } = await c.rpc('create_couple_invite'); if (error || !data) return null;
  try { localStorage.setItem(INVITE_KEY, data as string); } catch { /* ignore */ }
  return `${site}/audit/#join=${data}`;
}

// Read "#join=TOKEN" from the link once and keep it until the person is signed in.
export function captureJoinToken(): string | null {
  if (typeof window === 'undefined') return null;
  const m = window.location.hash.match(/^#join=([a-f0-9]{48})$/);
  if (m) { try { sessionStorage.setItem(JOIN_KEY, m[1]); } catch { /* ignore */ } history.replaceState(null, '', window.location.pathname); }
  try { return sessionStorage.getItem(JOIN_KEY); } catch { return m?.[1] ?? null; }
}

export async function acceptJoin(token: string): Promise<string | null> {
  const c = cloud(); if (!c) return 'Sign-in is not set up yet.';
  const { error } = await c.rpc('accept_couple_invite', { p_token: token });
  try { sessionStorage.removeItem(JOIN_KEY); } catch { /* ignore */ }
  if (!error) return null;
  if (/own invite/.test(error.message)) return 'That is your own invite link. Send it to your partner instead.';
  if (/invalid|expired/.test(error.message)) return 'That invite link has expired or was already used. Ask your partner for a new one.';
  return error.message;
}

export async function leaveCouple(): Promise<boolean> {
  const c = cloud(); if (!c) return false;
  const { error } = await c.rpc('leave_couple');
  try { localStorage.removeItem(INVITE_KEY); } catch { /* ignore */ }
  return !error;
}

export async function profiles(ids: string[]): Promise<Record<string, Profile>> {
  const c = cloud(); if (!c || !ids.length) return {};
  const { data } = await c.from('profiles').select('user_id, display_name, avatar_path, relationship_stage').in('user_id', ids);
  return Object.fromEntries((data ?? []).map((p) => [p.user_id, p as Profile]));
}

export function avatarUrl(path: string | null): string | null {
  const c = cloud(); if (!c || !path) return null;
  return c.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

export async function saveProfile(uid: string, patch: Partial<Profile>): Promise<boolean> {
  const c = cloud(); if (!c) return false;
  const { error } = await c.from('profiles').upsert({ user_id: uid, ...patch });
  return !error;
}

// Shrink to a 256px square JPEG on the device before uploading.
export async function uploadAvatar(uid: string, file: File): Promise<string | null> {
  const c = cloud(); if (!c) return null;
  const img = await createImageBitmap(file);
  const s = Math.min(img.width, img.height), cv = document.createElement('canvas'); cv.width = cv.height = 256;
  cv.getContext('2d')!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 256, 256);
  const blob: Blob = await new Promise((r) => cv.toBlob((b) => r(b!), 'image/jpeg', 0.85));
  const path = `${uid}/avatar-${Date.now()}.jpg`;
  const { error } = await c.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
  if (error) return null;
  await saveProfile(uid, { avatar_path: path });
  return path;
}

export async function shareMine(coupleId: string, uid: string, shared: Shared | null): Promise<boolean> {
  const c = cloud(); if (!c) return false;
  await c.from('couple_shares').delete().eq('couple_id', coupleId).eq('owner_id', uid).eq('share_kind', 'summary');
  if (!shared) return true;
  const { error } = await c.from('couple_shares').insert({ couple_id: coupleId, owner_id: uid, share_kind: 'summary', summary_text: JSON.stringify(shared) });
  return !error;
}

export async function sharedBy(coupleId: string): Promise<Record<string, Shared>> {
  const c = cloud(); if (!c) return {};
  const { data } = await c.from('couple_shares').select('owner_id, summary_text').eq('couple_id', coupleId).eq('share_kind', 'summary');
  const out: Record<string, Shared> = {};
  for (const r of data ?? []) { try { out[r.owner_id as string] = JSON.parse(r.summary_text as string); } catch { /* skip */ } }
  return out;
}

export async function goals(coupleId: string): Promise<Goal[]> {
  const c = cloud(); if (!c) return [];
  const { data } = await c.from('couple_goals').select('id, title, done, created_by').eq('couple_id', coupleId).order('created_at');
  return (data ?? []) as Goal[];
}
export async function addGoal(coupleId: string, uid: string, title: string): Promise<boolean> {
  const c = cloud(); if (!c) return false;
  const { error } = await c.from('couple_goals').insert({ couple_id: coupleId, title: title.slice(0, 300), created_by: uid });
  return !error;
}
export async function setGoal(id: string, done: boolean) { await cloud()?.from('couple_goals').update({ done }).eq('id', id); }

export async function messages(coupleId: string): Promise<Message[]> {
  const c = cloud(); if (!c) return [];
  const { data } = await c.from('couple_messages').select('*').eq('couple_id', coupleId).order('created_at').limit(300);
  return (data ?? []) as Message[];
}
export async function sendMessage(coupleId: string, body: string): Promise<boolean> {
  const c = cloud(); if (!c) return false;
  const { error } = await c.from('couple_messages').insert({ couple_id: coupleId, body: body.slice(0, 2000) });
  return !error;
}
// Live updates for new messages; returns a function that stops listening.
export function onMessages(coupleId: string, cb: (m: Message) => void): () => void {
  const c = cloud(); if (!c) return () => {};
  const ch = c.channel(`couple-${coupleId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'app', table: 'couple_messages', filter: `couple_id=eq.${coupleId}` }, (p) => cb(p.new as Message))
    .subscribe();
  return () => { void c.removeChannel(ch); };
}

export async function savePrefsToAccount(uid: string, prefs: object) {
  await cloud()?.from('settings').upsert({ user_id: uid, prefs });
}

export async function exportMyData(uid: string): Promise<object> {
  const c = cloud(); if (!c) return {};
  const [p, s, a] = await Promise.all([
    c.from('profiles').select('*').eq('user_id', uid),
    c.from('settings').select('*').eq('user_id', uid),
    c.from('audit_snapshots').select('*').eq('user_id', uid),
  ]);
  return { exported_at: new Date().toISOString(), profile: p.data, settings: s.data, audit: a.data };
}

export async function deleteMyAccount(): Promise<boolean> {
  const c = cloud(); if (!c) return false;
  const { error } = await c.rpc('delete_my_account');
  if (!error) await c.auth.signOut();
  return !error;
}

// Daily couple question (app.couple_answers; only the two partners can read).
export type Answer = { id: string; author_id: string; day: string; question: number; answer: string };
export async function answers(coupleId: string, sinceDay: string): Promise<Answer[]> {
  const c = cloud(); if (!c) return [];
  const { data } = await c.from('couple_answers').select('id,author_id,day,question,answer').eq('couple_id', coupleId).gte('day', sinceDay).order('day').limit(400);
  return (data ?? []) as Answer[];
}
export async function answerToday(coupleId: string, day: string, question: number, text: string): Promise<boolean> {
  const c = cloud(); if (!c) return false;
  const { error } = await c.from('couple_answers').insert({ couple_id: coupleId, day, question, answer: text.slice(0, 500) });
  return !error;
}

// Relationship survey (app.couple_survey; only the two partners can read).
export async function saveSurvey(coupleId: string, answers: Record<string, unknown>): Promise<boolean> {
  const c = cloud(); if (!c) return false; const uid = await me(); if (!uid) return false;
  const { error } = await c.from('couple_survey').upsert({ couple_id: coupleId, author_id: uid, answers, updated_at: new Date().toISOString() });
  return !error;
}
export async function surveys(coupleId: string): Promise<{ author_id: string; answers: Record<string, unknown>; updated_at: string }[]> {
  const c = cloud(); if (!c) return [];
  const { data } = await c.from('couple_survey').select('author_id, answers, updated_at').eq('couple_id', coupleId);
  return (data ?? []) as { author_id: string; answers: Record<string, unknown>; updated_at: string }[];
}
