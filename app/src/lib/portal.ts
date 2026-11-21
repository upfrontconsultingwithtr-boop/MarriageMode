// Marriage Mode customer portal: sign-in dashboard backed by Supabase (migration 0014).
// Levels: 4 Company Admin Access, 3 Manager, 2 Coach / Support, 1 Customer.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { cloud } from './cloud';
import type { AdvState } from './adv/store';
import { score, status, remaining } from './adv/accounts';
import { nextRecheck } from './adv/report';
import { LESSONS } from './adv/learn';

export type Level = 1 | 2 | 3 | 4;
export const LEVELS: Record<Level, { en: string; es: string; can: string; canEs: string }> = {
  4: { en: 'Company Admin Access', es: 'Acceso de Administrador de la Empresa', can: 'Everything: all dashboards, updates, and who has which access.', canEs: 'Todo: todos los paneles, avisos y quién tiene qué acceso.' },
  3: { en: 'Manager', es: 'Gerente', can: 'Sees every customer’s shared dashboard and posts updates. Cannot change access.', canEs: 'Ve el panel compartido de cada cliente y publica avisos. No cambia accesos.' },
  2: { en: 'Coach / Support', es: 'Coach / Soporte', can: 'Sees and posts updates only for customers assigned to them.', canEs: 'Ve y publica avisos solo para los clientes asignados.' },
  1: { en: 'Customer', es: 'Cliente', can: 'Sees only their own dashboard.', canEs: 'Ve solo su propio panel.' },
};
export interface Member { user_id: string; email: string; display_name: string | null; level: Level; created_at: string }
export interface Results { score: number; closed: { name: string; at: string }[]; inProgress: number; total: number; flags: number; risque: number; queueDone: number; queueLeft: number; lessons: number; recheck: string; syncedAt: string }
export interface Item { id: string; en: string; es: string; urgent?: boolean; tab?: string }
export interface Update { id: string; customer_id: string; author_id: string | null; title: string; body: string; urgent: boolean; created_at: string }

/** What the dashboard shows. Built on the device from the customer's own progress. */
export function summarize(s: AdvState): { results: Results; items: Item[] } {
  const sc = score(s.accounts);
  const results: Results = {
    score: sc.score, total: sc.total, inProgress: sc.inProgress,
    closed: s.accounts.filter((a) => status(a) === 'closed').map((a) => ({ name: a.name, at: (a.closedAt ?? '').slice(0, 10) })),
    flags: s.flags.length, risque: s.flags.filter((f) => f.risque).length,
    queueDone: s.queue.filter((q) => q.state === 'done').length, queueLeft: s.queue.filter((q) => q.state === 'queued').length,
    lessons: LESSONS.filter((l) => s.learnRead[l.id]).length, recheck: nextRecheck(s), syncedAt: new Date().toISOString(),
  };
  const items: Item[] = [];
  if (!s.intake) items.push({ id: 'intake', en: 'Finish your 1-minute intake', es: 'Termina tu registro de 1 minuto', urgent: true, tab: 'start' });
  for (const a of s.accounts.filter((x) => status(x) === 'progress')) items.push({ id: `acct-${a.id}`, en: `${a.name}: ${remaining(a).length} step${remaining(a).length > 1 ? 's' : ''} left before it counts as closed`, es: `${a.name}: faltan ${remaining(a).length} paso(s) para contar como cerrada`, tab: 'accounts' });
  if (results.queueLeft) items.push({ id: 'queue', en: `${results.queueLeft} item${results.queueLeft > 1 ? 's' : ''} waiting in your removal queue`, es: `${results.queueLeft} elemento(s) esperando en tu cola`, tab: 'review' });
  const unreviewed = s.flags.filter((f) => !s.queue.some((q) => q.flagId === f.id) && !s.checklist[`kept-${f.id}`]).length;
  if (unreviewed) items.push({ id: 'review', en: `${unreviewed} flagged item${unreviewed > 1 ? 's' : ''} to review`, es: `${unreviewed} elemento(s) marcados por revisar`, tab: 'review' });
  if (results.lessons < 6) items.push({ id: 'learn', en: `${6 - results.lessons} lesson${6 - results.lessons > 1 ? 's' : ''} left in Learn`, es: `Faltan ${6 - results.lessons} lección(es)`, tab: 'learn' });
  if (Date.parse(results.recheck) <= Date.now() + 3 * 86400e3) items.push({ id: 'recheck', en: `Monthly re-check due ${results.recheck}`, es: `Revisión mensual el ${results.recheck}`, urgent: true, tab: 'proof' });
  return { results, items };
}

const db = () => cloud();
export async function session() { return (await db()?.auth.getSession())?.data.session ?? null; }
export async function signInPassword(email: string, password: string) { const r = await db()!.auth.signInWithPassword({ email, password }); return r.error?.message ?? null; }
export async function signUpPassword(email: string, password: string, redirectTo: string) { const r = await db()!.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } }); return r.error?.message ?? (r.data.session ? null : 'check-email'); }
export async function resetPassword(email: string, redirectTo: string) { const r = await db()!.auth.resetPasswordForEmail(email, { redirectTo }); return r.error?.message ?? null; }
export async function setNewPassword(password: string) { const r = await db()!.auth.updateUser({ password }); return r.error?.message ?? null; }
export async function join(name?: string): Promise<Level> { const { data, error } = await db()!.schema('app').rpc('portal_join', { name: name ?? null }); if (error) throw error; return data as Level; }
export async function members(): Promise<Member[]> { const { data } = await db()!.schema('app').from('portal_members').select('*').order('level', { ascending: false }); return (data ?? []) as Member[]; }
export async function assignments(): Promise<{ staff_id: string; customer_id: string }[]> { const { data } = await db()!.schema('app').from('portal_assignments').select('staff_id, customer_id'); return data ?? []; }
export async function dashboards(): Promise<{ customer_id: string; results: Results; items: Item[]; updated_at: string }[]> { const { data } = await db()!.schema('app').from('portal_dashboards').select('*'); return (data ?? []) as any; }
export async function syncMine(uid: string, s: AdvState) { const { results, items } = summarize(s); const { error } = await db()!.schema('app').from('portal_dashboards').upsert({ customer_id: uid, results, items, updated_at: new Date().toISOString() }); return !error; }
export async function unsyncMine(uid: string) { const { error } = await db()!.schema('app').from('portal_dashboards').delete().eq('customer_id', uid); return !error; }
export async function updates(): Promise<Update[]> { const { data } = await db()!.schema('app').from('portal_updates').select('*').order('created_at', { ascending: false }).limit(50); return (data ?? []) as Update[]; }
export async function postUpdate(uid: string, customer: string, title: string, body: string, urgent: boolean) { const { error } = await db()!.schema('app').from('portal_updates').insert({ customer_id: customer, author_id: uid, title, body, urgent }); return error?.message ?? null; }
export async function setLevel(target: string, level: Level) { const { error } = await db()!.schema('app').rpc('portal_set_level', { target, new_level: level }); return error?.message ?? null; }
export async function assign(staff: string, customer: string, on: boolean) { const { error } = await db()!.schema('app').rpc('portal_assign', { staff, customer, on_off: on }); return error?.message ?? null; }
