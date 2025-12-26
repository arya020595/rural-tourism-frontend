// sw.js (minimal functional service worker)

// Install event (runs once when the worker is installed)
self.addEventListener('install', event => {
  console.log('[SW] Installed');
  // Activate immediately after installation
  self.skipWaiting();
});

// Activate event (runs after installation, takes control)
self.addEventListener('activate', event => {
  console.log('[SW] Activated');
  // Claim clients so it starts controlling open tabs
  event.waitUntil(clients.claim());
});

// Fetch event (intercepts network requests)
self.addEventListener('fetch', event => {
  // Right now just passes everything through
  event.respondWith(fetch(event.request));
});
