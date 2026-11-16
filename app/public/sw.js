// Marriage Mode service worker: lets the site open like an app and work offline
// after the first visit. Pages: network first (fresh), cached copy when offline.
// Static build files: cache first (they never change once built).
const CACHE = 'marriage-mode-v2';
const SCOPE = self.registration.scope;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([SCOPE, SCOPE + 'audit/'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(SCOPE)) return; // never touch the database, analytics or other sites
  if (req.url.includes('/_next/static/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })));
    return;
  }
  e.respondWith(fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })
    .catch(() => caches.match(req).then((hit) => hit || caches.match(SCOPE + 'audit/'))));
});

// Free phone reminders (opt-in). The message never names an app or anything personal.
self.addEventListener('push', (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { /* plain text */ }
  e.waitUntil(self.registration.showNotification(d.title || 'Marriage Mode', {
    body: d.body || 'Something you planned is due today.', icon: SCOPE + 'icon-192.png', badge: SCOPE + 'icon-192.png', tag: 'mm-due', data: { url: SCOPE + (d.url || 'audit/') },
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || SCOPE;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    const c = cs.find((w) => w.url.startsWith(SCOPE)); return c ? c.navigate(url).then((w) => (w || c).focus()).catch(() => self.clients.openWindow(url)) : self.clients.openWindow(url);
  }));
});
