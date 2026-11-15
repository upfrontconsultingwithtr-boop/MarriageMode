// Optional sync across devices (Supabase). Off unless the site was built with
// NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, so the product
// always works without accounts. The anon key is public by design; row-level
// security limits every row to its owner.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AuditState } from './audit';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const cloudEnabled = Boolean(URL && KEY);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: SupabaseClient<any, any, any> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cloud(): SupabaseClient<any, any, any> | null {
  if (!cloudEnabled) return null;
  if (!client) client = createClient(URL, KEY, { db: { schema: 'app' }, auth: { persistSession: true, detectSessionInUrl: true, flowType: 'pkce' } });
  return client;
}

export async function sendLink(email: string, redirectTo: string): Promise<string | null> {
  const c = cloud(); if (!c) return 'Sync is not set up yet.';
  const { error } = await c.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
  return error ? error.message : null;
}

export async function pull(): Promise<{ state: AuditState; updatedAt: string } | null> {
  const c = cloud(); if (!c) return null;
  const { data: u } = await c.auth.getUser(); if (!u.user) return null;
  const { data } = await c.from('audit_snapshots').select('state, updated_at').eq('user_id', u.user.id).maybeSingle();
  return data ? { state: data.state as AuditState, updatedAt: data.updated_at as string } : null;
}

export async function push(state: AuditState): Promise<boolean> {
  const c = cloud(); if (!c) return false;
  const { data: u } = await c.auth.getUser(); if (!u.user) return false;
  const { error } = await c.from('audit_snapshots').upsert({ user_id: u.user.id, state, updated_at: new Date().toISOString() });
  return !error;
}

export async function signOut() { await cloud()?.auth.signOut(); }

// Merge two audits: union of apps; a step counts as done if either copy has it done.
export function merge(a: AuditState, b: AuditState): AuditState {
  const done = { ...a.done }; const doneAt = { ...(a.doneAt ?? {}) };
  for (const [k, v] of Object.entries(b.done)) if (v) { done[k] = true; if (b.doneAt?.[k] && !doneAt[k]) doneAt[k] = b.doneAt[k]; }
  return {
    platformIds: [...new Set([...a.platformIds, ...b.platformIds])],
    custom: [...new Set([...a.custom, ...b.custom])],
    requests: { ...(b.requests ?? {}), ...(a.requests ?? {}) },
    proof: { ...(b.proof ?? {}), ...(a.proof ?? {}) },
    recheckedAt: [...new Set([...(a.recheckedAt ?? []), ...(b.recheckedAt ?? [])])].sort(),
    done, doneAt, startedAt: [a.startedAt, b.startedAt].filter(Boolean).sort()[0],
    ...(a.web || b.web ? { web: {
      usernames: [...new Set([...(a.web?.usernames ?? []), ...(b.web?.usernames ?? [])])],
      emails: [...new Set([...(a.web?.emails ?? []), ...(b.web?.emails ?? [])])],
      results: { ...(b.web?.results ?? {}), ...(a.web?.results ?? {}) },
    } } : {}),
  };
}

// Public lead capture (partner sign-ups). Insert-only: nobody can read leads back.
export type Lead = { kind: 'partner' | 'waitlist'; email: string; name?: string; org?: string; role?: string; city?: string; note?: string; source?: string };
export async function addLead(lead: Lead): Promise<boolean> {
  const c = cloud(); if (!c) return false;
  const { error } = await c.from('leads').insert(lead);
  return !error;
}
