import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

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
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('✅ SW registered:', reg.scope))
    .catch(err => console.error('❌ SW registration failed:', err));
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
