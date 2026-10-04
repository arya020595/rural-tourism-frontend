import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Capacitor } from '@capacitor/core';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

console.log('📢 main.ts loaded, SW check running');

/**
 * One-time cleanup of obsolete localStorage caches that were migrated to
 * IndexedDB. These per-company product lists overflowed localStorage's ~5MB
 * quota (QuotaExceededError), which broke the booking dropdowns. The app no
 * longer reads or writes these keys, so remove the dead data to free space for
 * existing users who won't clear their cache. Safe to run every load.
 */
try {
  Object.keys(localStorage)
    .filter(
      (key) =>
        key === 'package_companies_cache' || key.startsWith('products_cache_'),
    )
    .forEach((key) => localStorage.removeItem(key));
} catch {
  // localStorage unavailable (private mode / disabled) — nothing to clean.
}

if (environment.production && 'serviceWorker' in navigator) {
  if (Capacitor.isNativePlatform()) {
    // The Android app's files are inside the APK, so they load offline without
    // a service worker. The old one served its saved copy of the app first,
    // which survives Play Store updates and kept showing the old version.
    // Remove it and its app-shell cache. Keep 'prewarm-assets-v1' — e-receipt
    // reads its images directly. Offline bookings (IndexedDB) are unaffected.
    navigator.serviceWorker.getRegistrations()
      .then(regs => Promise.all(regs.map(reg => reg.unregister())))
      .catch(() => undefined);
    if ('caches' in window) {
      caches.keys()
        .then(keys => Promise.all(
          keys.filter(key => key.startsWith('app-shell-')).map(key => caches.delete(key)),
        ))
        .catch(() => undefined);
    }
  } else {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ SW registered:', reg.scope))
      .catch(err => console.error('❌ SW registration failed:', err));
  }
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
