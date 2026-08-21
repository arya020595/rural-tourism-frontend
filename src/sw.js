// sw.js — cache-first for same-origin app assets, network-only for API calls

const CACHE_NAME = 'app-shell-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== 'prewarm-assets-v1')
          .map(key => caches.delete(key))
      )
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Let API calls, uploaded files, and external requests go straight to network
  // (will fail offline — handled by app). Uploaded files are backend-proxied,
  // user-replaceable content, not static app-shell assets — caching them here
  // risks serving a stale/broken response after a deploy blip long after the
  // origin has recovered.
  if (
    url.origin !== location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/uploads/')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for same-origin app assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Only cache successful same-origin GET responses
        if (!response || response.status !== 200 || event.request.method !== 'GET') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // For navigation requests offline, return index.html so Angular router works
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('', { status: 503 });
      });
    })
  );
});
