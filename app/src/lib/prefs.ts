// Appearance & accessibility preferences. Saved on the device (and to the
// account when signed in). Applied as attributes on <html>.
export type Prefs = { theme: 'dark' | 'light'; textSize: 's' | 'm' | 'l' | 'xl'; reduceMotion: boolean; highContrast: boolean; underlineLinks: boolean; analytics: boolean; lang: 'en' | 'es' };
export const DEFAULT_PREFS: Prefs = { theme: 'dark', textSize: 'm', reduceMotion: false, highContrast: false, underlineLinks: false, analytics: true, lang: 'en' };
export const PREFS_KEY = 'marriage-mode:prefs';

export function loadPrefs(): Prefs {
  try { const raw = localStorage.getItem(PREFS_KEY); return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS; } catch { return DEFAULT_PREFS; }
}
export function applyPrefs(p: Prefs) {
  const h = document.documentElement;
  h.dataset.theme = p.theme; h.dataset.size = p.textSize;
  h.dataset.motion = p.reduceMotion ? 'reduce' : 'full';
  h.dataset.contrast = p.highContrast ? 'high' : 'normal';
  h.dataset.links = p.underlineLinks ? 'underline' : 'normal';
  if (location.pathname.includes('/audit')) h.lang = p.lang || 'en';
}
export function savePrefs(p: Prefs) { try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* private mode */ } applyPrefs(p); }

// Runs before paint (inlined in <head>) so there is no flash of the wrong theme.
export const PREFS_BOOT = `try{var p=JSON.parse(localStorage.getItem('${PREFS_KEY}')||'{}'),h=document.documentElement;h.dataset.theme=p.theme||'dark';h.dataset.size=p.textSize||'m';h.dataset.motion=p.reduceMotion?'reduce':'full';h.dataset.contrast=p.highContrast?'high':'normal';h.dataset.links=p.underlineLinks?'underline':'normal'}catch(e){}`;
