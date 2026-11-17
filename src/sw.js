// sw.js — website only (not registered in the Android app, see main.ts).
// Pages: network-first, so a new deploy loads straight away; the saved copy
// is only used offline. Other same-origin assets: cache-first (Angular's JS/CSS
// file names change every build, so a cached copy is never stale).
// API calls and uploads: network-only.

// v2: v1 served index.html cache-first under a name that never changed, so
// returning users kept the old version after every deploy. Bumping the name
// makes 'activate' below delete the stale v1 cache.
const CACHE_NAME = 'app-shell-v2';

// The production build writes ngsw.json listing every file of the build; its
// "app" group is index.html plus all JS/CSS (~7 MB). Saving that group at
// install means the app opens offline even if the user never reloaded after
// logging in, and every page works offline even if it was never opened
// online (each page's code is a separate lazy-loaded JS file).
async function appFiles() {
  try {
    const res = await fetch('/ngsw.json', { cache: 'no-cache' });
    if (!res.ok) return null;
    const manifest = await res.json();
    const app = (manifest.assetGroups || []).find(group => group.name === 'app');
    return app ? app.urls.filter(url => !url.includes('index.csr')) : null;
  } catch {
    return null; // offline / no manifest: files are still cached as they are used
  }
}

async function precacheAppFiles() {
  const urls = await appFiles();
  if (!urls) return;
  const cache = await caches.open(CACHE_NAME);
  // One failed file must not block the rest.
  await Promise.allSettled(
    urls.map(url => cache.add(new Request(url, { cache: 'no-cache' }))),
  );
}

// JS/CSS from earlier deploys are never requested again (new file names):
// drop them so the cache doesn't grow by a full build per deploy.
async function pruneOldBuilds() {
  const urls = await appFiles();
  if (!urls) return;
  const current = new Set(urls);
  const cache = await caches.open(CACHE_NAME);
  for (const request of await cache.keys()) {
    const path = new URL(request.url).pathname;
    if (/\.(js|css)$/.test(path) && !current.has(path)) await cache.delete(request);
  }
}

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(precacheAppFiles());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== 'prewarm-assets-v1')
          .map(key => caches.delete(key))
      )
    )
      .then(() => pruneOldBuilds())
      .then(() => clients.claim())
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

  // Pages (index.html for every Angular route): network-first. Every route
  // returns the same index.html, so the latest copy is also saved under
  // '/index.html' to serve any route offline. 'no-cache' makes the browser
  // check with the server instead of reusing an HTTP-cached index.html, which
  // would point at the previous deploy's bundles.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put('/index.html', clone));
          }
          return response;
        })
        .catch(() =>
          caches.match('/index.html').then(
            cached => cached || new Response('', { status: 503 }),
          ),
        ),
    );
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
