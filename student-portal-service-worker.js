// Student Portal service worker — same network-first design as the
// CRM's own (see that file's comments for the full reasoning). This is
// a live data app; the cache is a fallback for offline moments only,
// never the primary source of truth.

const CACHE_NAME = 's4p-student-portal-v1'; // bump on every deploy

const PRECACHE = [
  '/student-portal/manifest.json',
  '/student-portal/icons/icon-192.png',
  '/student-portal/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Lora:wght@400;500;600&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
];

const NETWORK_ONLY = ['supabase.co'];

function isNavigationOrHTML(request) {
  return request.mode === 'navigate' || request.url.endsWith('/student-portal/') || request.url.endsWith('student-portal.html');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(PRECACHE.map((url) => cache.add(url).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  if (NETWORK_ONLY.some((p) => url.includes(p))) {
    event.respondWith(fetch(event.request));
    return;
  }
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }
  if (isNavigationOrHTML(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((c) => c || caches.match('/student-portal/student-portal.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && (response.type === 'basic' || response.type === 'cors')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/student-portal/') || caches.match('/student-portal/student-portal.html');
        }
      });
    })
  );
});
