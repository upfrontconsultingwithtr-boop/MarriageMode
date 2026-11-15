// Couple Mode, link edition: the couple's space lives in the link's #fragment,
// which browsers never send to any server. No accounts, no database, free.
export interface Person { name: string; progress?: number; closed?: number; total?: number; milestones?: string[]; note?: string; updated: string }
export interface Space { v: 1; people: Person[]; goals: { t: string; done: boolean }[] }

export const EMPTY_SPACE: Space = { v: 1, people: [], goals: [] };

function b64urlEncode(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = ''; bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s: string): string {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeSpace(sp: Space): string { return b64urlEncode(JSON.stringify(sp)); }

export function decodeSpace(hash: string): Space | null {
  try {
    const sp = JSON.parse(b64urlDecode(hash.replace(/^#/, '')));
    if (sp?.v !== 1 || !Array.isArray(sp.people) || !Array.isArray(sp.goals)) return null;
    return {
      v: 1,
      people: sp.people.slice(0, 2).map((p: Person) => ({
        name: String(p.name ?? '').slice(0, 40), updated: String(p.updated ?? ''),
        progress: num(p.progress), closed: num(p.closed), total: num(p.total),
        milestones: Array.isArray(p.milestones) ? p.milestones.slice(0, 6).map((m) => String(m).slice(0, 40)) : undefined,
        note: p.note ? String(p.note).slice(0, 280) : undefined,
      })),
      goals: sp.goals.slice(0, 12).map((g: { t: unknown; done: unknown }) => ({ t: String(g.t ?? '').slice(0, 120), done: !!g.done })),
    };
  } catch { return null; }
}
const num = (x: unknown) => (typeof x === 'number' && isFinite(x) ? Math.max(0, Math.min(999, Math.round(x))) : undefined);

// Put my card in (replacing my old one by name), keep at most two people.
export function upsertPerson(sp: Space, me: Person): Space {
  const others = sp.people.filter((p) => p.name.toLowerCase() !== me.name.toLowerCase());
  return { ...sp, people: [...others, me].slice(-2) };
}
