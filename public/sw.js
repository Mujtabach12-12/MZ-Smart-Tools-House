/* MZ Smart Tool House service worker. Generated cache version is replaced before build. */
const CACHE_VERSION = '0.1.0-f04d1837d2';
const SHELL_CACHE = `mz-tools-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `mz-tools-runtime-${CACHE_VERSION}`;
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable.png', '/startup/mz-office-welcome.mp4', '/startup/mz-office-welcome-poster.jpg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('mz-tools-') && ![SHELL_CACHE, RUNTIME_CACHE].includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigation: prefer the network so new Netlify deployments are never pinned by the SW.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', copy));
        return response;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Hashed Vite assets are immutable; cache them after first use.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      }))
    );
  }
});
