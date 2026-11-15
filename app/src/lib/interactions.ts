// Interaction review: from the customer's OWN Instagram / Facebook / TikTok download, finds
// their likes, reactions, comments, story likes and message threads after the relationship
// began, and flags ones that could feel risqué to the relationship. Runs on the device only.
export type Person = { key: string; who: string; likes: number; comments: string[]; flirty: string[]; stories: number; messages: number; links: string[]; score: number; reasons: string[] };

const FILES = /(like|comment|reaction|story|stories|messages\/inbox|message_\d|inbox)/i;
// Flirty / risqué language in the person's own words (English + Spanish).
const FLIRTY = /(sexy|hot+\b|so hot|gorgeous|beautiful|beautifull|stunning|babe|baby girl|daddy|cutie|cute af|miss you|thinking of you|wyd|hmu|dm me|slide|link up|come over|late night|you up|drinks sometime|single\??|ur fine|you'?re fine|damn|wow+|marry me|wife me|husband material|🔥|😍|😘|🥵|💋|😏|🍑|🍆|💦|👅|😻|❤️‍🔥|guapa|guapo|hermosa|bella|mamacita|papacito|rico|rica|te extraño|nos vemos|estas buena|estás buena|bebé)/i;

const dec = (s: string) => { try { return decodeURIComponent(escape(s)); } catch { return s; } }; // fix Meta's mojibake

export function scanInteractions(files: { path: string; text: string }[], since: number, flaggedHandles: Set<string>): Person[] {
  const people = new Map<string, Person>();
  const get = (who: string) => {
    const w = dec(who).trim(); const key = w.toLowerCase();
    const p = people.get(key) ?? { key, who: w, likes: 0, comments: [], flirty: [], stories: 0, messages: 0, links: [], score: 0, reasons: [] };
    people.set(key, p); return p;
  };
  const after = (ts: unknown) => { const n = typeof ts === 'number' ? (ts > 1e12 ? ts : ts * 1000) : typeof ts === 'string' ? Date.parse(ts) : NaN; return !Number.isNaN(n) && n >= since; };
  for (const { path, text } of files) {
    if (!FILES.test(path) || !/\.json$/i.test(path)) continue;
    let data: unknown; try { data = JSON.parse(text); } catch { continue; }
    const p = path.toLowerCase();
    // Message threads: count YOUR messages after the date, and flag flirty ones.
    if (/messages\/inbox|message_\d/.test(p) && data && typeof data === 'object' && Array.isArray((data as { messages?: unknown }).messages)) {
      const d = data as { participants?: { name: string }[]; messages: { sender_name?: string; timestamp_ms?: number; content?: string }[]; title?: string };
      const names = (d.participants ?? []).map((x) => dec(x.name)); const me = names[names.length - 1];
      const other = d.title ? dec(d.title) : names.filter((n) => n !== me).join(', ');
      if (!other) continue;
      const person = get(other);
      for (const m of d.messages) if (after(m.timestamp_ms) && dec(m.sender_name ?? '') === me) { person.messages++; const c = dec(m.content ?? ''); if (FLIRTY.test(c) && person.flirty.length < 5) person.flirty.push(c.slice(0, 140)); }
      continue;
    }
    const walk = (v: unknown) => {
      if (Array.isArray(v)) { v.forEach(walk); return; }
      if (!v || typeof v !== 'object') return;
      const o = v as Record<string, unknown>;
      // Instagram likes / story likes: { title: "username", string_list_data: [{ href, timestamp }] }
      const sld = Array.isArray(o.string_list_data) ? (o.string_list_data as Record<string, unknown>[]) : null;
      if (sld?.length && typeof o.title === 'string' && o.title) {
        const s = sld[0]; if (!after(s.timestamp)) return;
        const person = get(o.title as string);
        if (/stor/.test(p)) person.stories++; else person.likes++;
        if (typeof s.href === 'string' && person.links.length < 3) person.links.push(s.href);
        return;
      }
      // Instagram comments: { string_map_data: { Comment: {value}, "Media Owner": {value}, Time: {timestamp} } }
      const smd = o.string_map_data as Record<string, { value?: string; timestamp?: number }> | undefined;
      if (smd && smd.Comment) {
        if (!after(smd.Time?.timestamp)) return;
        const owner = smd['Media Owner']?.value || 'unknown account'; const c = dec(smd.Comment.value ?? '');
        const person = get(owner); person.comments.push(c.slice(0, 140)); if (FLIRTY.test(c) && person.flirty.length < 5) person.flirty.push(c.slice(0, 140));
        return;
      }
      // Facebook reactions / comments: { timestamp, title: "You liked Jane Doe's photo.", data: [{ comment: { comment } }] }
      if (typeof o.timestamp === 'number' && typeof o.title === 'string' && /(liked|reacted|commented|loved|haha|wow)/i.test(o.title)) {
        if (!after(o.timestamp)) return;
        const m = dec(o.title).match(/(?:liked|reacted to|commented on|loved)\s+(.+?)'s\s/i); if (!m) return;
        const person = get(m[1]);
        const c = (((o.data as { comment?: { comment?: string } }[] | undefined) ?? [])[0]?.comment?.comment) ?? '';
        if (c) { person.comments.push(dec(c).slice(0, 140)); if (FLIRTY.test(dec(c)) && person.flirty.length < 5) person.flirty.push(dec(c).slice(0, 140)); } else person.likes++;
        return;
      }
      Object.values(o).forEach(walk);
    };
    walk(data);
  }
  return [...people.values()].map((x) => {
    const reasons: string[] = []; let score = 0;
    if (x.flirty.length) { reasons.push(`${x.flirty.length} flirty or risqué ${x.flirty.length === 1 ? 'message/comment' : 'messages/comments'}`); score += 5 * x.flirty.length; }
    if (flaggedHandles.has(x.key)) { reasons.push('already flagged (ex or dating/adult account)'); score += 6; }
    const total = x.likes + x.stories + x.comments.length;
    if (total >= 10) { reasons.push(`frequent attention: ${total} likes, story likes and comments`); score += Math.min(10, Math.floor(total / 5)); }
    if (x.messages >= 20) { reasons.push(`${x.messages} private messages from you`); score += Math.min(8, Math.floor(x.messages / 20)); }
    return { ...x, reasons, score };
  }).filter((x) => x.likes + x.stories + x.comments.length + x.messages > 0).sort((a, b) => b.score - a.score || (b.likes + b.messages) - (a.likes + a.messages));
}
