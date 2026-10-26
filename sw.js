/*!
 * AkihiroLabs — ShiftPay — service worker
 * Bump CACHE whenever you change files so installed apps pick up the update.
 */
const CACHE = 'shiftpay-v4';
const SHELL = [
  './',
  './index.html',
  './css/main.css',
  './js/version.js',
  './js/i18n.js',
  './js/holidays.js',
  './js/storage.js',
  './js/income.js',
  './js/calendar-view.js',
  './js/charts-view.js',
  './js/reports.js',
  './js/modals.js',
  './js/app.js',
  './js/pwa.js',
  './js/push.js',
  './js/cloud.js',
  './favicon.png',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './manifest.json'
];

// Third-party CDNs (fonts, libraries, dictionaries) — cache-first, they are versioned
const CDN_HOSTS = ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('shiftpay-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Pages: network first so updates show, cached copy when offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // CDN files: cache first
  if (CDN_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }))
    );
    return;
  }

  // Own files: serve cache instantly, refresh it in the background
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then(hit => {
        const net = fetch(req).then(res => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});

// Web Push: show the reminder
self.addEventListener('push', e => {
  let d = { title: 'ShiftPay', body: '' };
  try { d = { ...d, ...e.data.json() }; } catch {}
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body,
    icon: './icon-192.png',
    badge: './favicon.png',
    tag: d.tag || 'shiftpay',
    renotify: true,
    data: { url: d.url || './' }
  }));
});

// Tap on a notification: focus the app or open it
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || './', self.location.origin).href;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const win = list.find(c => new URL(c.url).origin === self.location.origin);
      return win ? win.focus() : clients.openWindow(url);
    })
  );
});
