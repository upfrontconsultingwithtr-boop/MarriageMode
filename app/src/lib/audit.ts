// Audit engine: pure functions, shared by the browser app and (later) the server.
import { PLATFORMS, type Platform } from './catalog.ts';

export type StepKind = 'delete_profile' | 'cancel_billing' | 'delete_app' | 'stop_emails' | 'social' | 'contacts';

export interface Step {
  id: string;
  kind: StepKind;
  platformId?: string;
  group?: string;            // platform name the step belongs to
  label: string;
  detail?: string;
}

export interface AuditState {
  platformIds: string[];
  custom: string[];          // platforms the user typed in
  done: Record<string, boolean>;
  doneAt?: Record<string, string>;   // ISO time each step was ticked (for the timeline)
  requests?: Record<string, string>;  // platform/app name -> ISO date the deletion request was sent
  web?: { usernames: string[]; emails: string[]; results: Record<string, 'found' | 'none'> };  // own identifiers for the web self-search
  startedAt?: string;
}

export const EMPTY_STATE: AuditState = { platformIds: [], custom: [], done: {}, doneAt: {} };

export const GENERAL_STEPS: Step[] = [
  { id: 'g:contacts', kind: 'contacts', label: 'Review phone contacts saved from dating apps', detail: 'Delete or rename numbers you no longer need. Your call, your list.' },
  { id: 'g:threads', kind: 'social', label: 'Archive or delete old dating-related chat threads', detail: 'Text messages, WhatsApp, Instagram and Snapchat DMs.' },
  { id: 'g:follows', kind: 'social', label: 'Review follows, "close friends" and hidden lists', detail: 'Unfollow or mute anything that no longer fits the relationship you are building.' },
  { id: 'g:passwords', kind: 'social', label: 'Search your password manager for dating sites', detail: 'Saved logins reveal accounts you forgot. Close each one, then delete the saved login.' },
  { id: 'g:bank', kind: 'social', label: 'Check 3 months of card statements for dating charges', detail: 'Look for app store charges and names like the platforms above.' },
  { id: 'g:email2', kind: 'social', label: 'Check any second or old email addresses', detail: 'Run the email check below in every inbox you have used.' },
];

function platformById(id: string): Platform | undefined {
  return PLATFORMS.find((p) => p.id === id);
}

const DELETE_PATH_ES: Record<string, string> = {
  'In the app: Profile or Settings → Account → Delete account (not just "pause" or "hide").': 'En la app: Perfil o Ajustes → Cuenta → Eliminar cuenta (no solo “pausar” u “ocultar”). Si tu app está en inglés: Profile/Settings → Account → Delete account.',
  'In the app: Profile → Settings → scroll to the bottom → Delete account.': 'En la app: Perfil → Ajustes → baja hasta el final → Eliminar cuenta. En inglés: Profile → Settings → Delete account.',
  'In the Facebook app: Menu → Dating → Settings (gear) → General → Delete profile. Your main Facebook account stays.': 'En la app de Facebook: Menú → Citas → Configuración (engranaje) → General → Eliminar perfil. Tu cuenta principal de Facebook se mantiene.',
  'On the website: Account settings → Delete profile. Ask for full deletion, not just hiding the profile.': 'En el sitio web: Configuración de la cuenta → Eliminar perfil. Pide la eliminación completa, no solo ocultar el perfil.',
  'On the website: Account settings → Close account.': 'En el sitio web: Configuración de la cuenta → Cerrar cuenta (Close account).',
};

export const GENERAL_STEPS_ES: Record<string, [string, string]> = {
  'g:contacts': ['Revisa los contactos guardados de apps de citas', 'Borra o renombra los números que ya no necesitas. Tu decisión, tu lista.'],
  'g:threads': ['Archiva o borra chats viejos relacionados con citas', 'Mensajes de texto, WhatsApp, Instagram y Snapchat.'],
  'g:follows': ['Revisa a quién sigues, "mejores amigos" y listas ocultas', 'Deja de seguir o silencia lo que ya no va con la relación que construyes.'],
  'g:passwords': ['Busca sitios de citas en tu gestor de contraseñas', 'Los accesos guardados revelan cuentas olvidadas. Cierra cada una y luego borra el acceso guardado.'],
  'g:bank': ['Revisa 3 meses de estados de cuenta por cobros de citas', 'Busca cobros de tiendas de apps y nombres como los de arriba.'],
  'g:email2': ['Revisa cualquier correo secundario o antiguo', 'Haz la búsqueda de correo en cada bandeja que hayas usado.'],
};

export function buildSteps(state: Pick<AuditState, 'platformIds' | 'custom'>, lang: 'en' | 'es' = 'en'): Step[] {
  const steps: Step[] = [];
  const es = lang === 'es';
  const add = (key: string, name: string, p?: Platform) => {
    steps.push({ id: `${key}:delete`, kind: 'delete_profile', platformId: p?.id, group: name, label: es ? `Elimina tu cuenta de ${name}` : `Delete your ${name} account`, detail: es ? (p ? DELETE_PATH_ES[p.deletePath] ?? p.deletePath : undefined) : p?.deletePath });
    if (!p || p.billing.length > 0)
      steps.push({ id: `${key}:billing`, kind: 'cancel_billing', platformId: p?.id, group: name, label: es ? `Cancela cualquier suscripción de ${name}` : `Cancel any ${name} subscription`, detail: es ? 'Borrar la app no detiene el cobro. Cancélalo donde pagaste.' : 'Deleting the app does not stop billing. Cancel it where you paid.' });
    if (!p || p.id !== 'fbdating')
      steps.push({ id: `${key}:app`, kind: 'delete_app', platformId: p?.id, group: name, label: es ? `Quita la app de ${name} de todos tus dispositivos` : `Remove the ${name} app from every device` });
    if (!p || p.emailDomains.length > 0)
      steps.push({ id: `${key}:email`, kind: 'stop_emails', platformId: p?.id, group: name, label: es ? `Cancela los correos de ${name}` : `Unsubscribe from ${name} emails`, detail: es ? 'Abre un correo y usa el enlace "unsubscribe" al final.' : 'Open one email and use the unsubscribe link at the bottom.' });
  };
  for (const id of state.platformIds) {
    const p = platformById(id);
    if (p) add(p.id, p.name, p);
  }
  for (const name of state.custom) add(`custom-${slug(name)}`, name);
  return [...steps, ...(es ? GENERAL_STEPS.map((g) => ({ ...g, label: GENERAL_STEPS_ES[g.id][0], detail: GENERAL_STEPS_ES[g.id][1] })) : GENERAL_STEPS)];
}

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export interface Scores {
  progress: number;          // Cleanup Progress, 0–100
  organization: number;      // Digital Organization Score, 0–100
  doneCount: number;
  total: number;
  accountsClosed: number;
  accountsTotal: number;
}

// Weights from the PRD (TRU-2): accounts 50, billing 20, emails 15, social & contacts 15.
const WEIGHTS: { kinds: StepKind[]; w: number }[] = [
  { kinds: ['delete_profile', 'delete_app'], w: 50 },
  { kinds: ['cancel_billing'], w: 20 },
  { kinds: ['stop_emails'], w: 15 },
  { kinds: ['social', 'contacts'], w: 15 },
];

export function score(steps: Step[], done: Record<string, boolean>): Scores {
  const total = steps.length;
  const doneCount = steps.filter((s) => done[s.id]).length;
  let weighted = 0, weightUsed = 0;
  for (const { kinds, w } of WEIGHTS) {
    const group = steps.filter((s) => kinds.includes(s.kind));
    if (group.length === 0) continue;
    weightUsed += w;
    weighted += (w * group.filter((s) => done[s.id]).length) / group.length;
  }
  const accounts = steps.filter((s) => s.kind === 'delete_profile');
  return {
    progress: total ? Math.round((100 * doneCount) / total) : 0,
    organization: weightUsed ? Math.round((100 * weighted) / weightUsed) : 0,
    doneCount, total,
    accountsClosed: accounts.filter((s) => done[s.id]).length,
    accountsTotal: accounts.length,
  };
}

export function emailDomainsFor(platformIds: string[]): string[] {
  const chosen = platformIds.length ? platformIds.map(platformById).filter(Boolean) as Platform[] : PLATFORMS;
  return [...new Set(chosen.flatMap((p) => p.emailDomains))];
}

export function gmailQuery(domains: string[]): string {
  return `from:(${domains.join(' OR ')})`;
}

export function gmailSearchUrl(domains: string[]): string {
  return 'https://mail.google.com/mail/u/0/#search/' + encodeURIComponent(gmailQuery(domains));
}

export function shareSummary(s: Scores, date = new Date(), lang: 'en' | 'es' = 'en'): string {
  if (lang === 'es') {
    const d = date.toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' });
    const l = [`Mi limpieza de Marriage Mode, al ${d}:`];
    if (s.accountsTotal) l.push(`• Cerré ${s.accountsClosed} de ${s.accountsTotal} cuentas de citas`);
    l.push(`• Terminé ${s.doneCount} de ${s.total} pasos (${s.progress}%)`);
    l.push('Lo hice porque nuestra relación me importa. ❤');
    return l.join('\n');
  }
  const d = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const lines = [`My Marriage Mode cleanup, as of ${d}:`];
  if (s.accountsTotal) lines.push(`• Closed ${s.accountsClosed} of ${s.accountsTotal} dating accounts`);
  lines.push(`• Finished ${s.doneCount} of ${s.total} cleanup steps (${s.progress}%)`);
  lines.push('I did this because our relationship matters to me. ❤');
  return lines.join('\n');
}
