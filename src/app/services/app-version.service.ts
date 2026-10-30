import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { environment } from '../../environments/environment';

/**
 * Website only: makes sure a new deploy is picked up.
 *
 * The JS bundle names change on every build (main-<hash>.js), and index.html
 * says which bundle to load. A tab that is already open — or a stale copy of
 * index.html — keeps running the old bundle, so after a deploy operators could
 * log in and still see the old app. On the login page (fresh visit or after
 * logout) we fetch the live index.html, compare its main bundle with the one
 * this page is running, and if a new version is out, clear the app-file cache
 * and reload.
 *
 * Only the service worker's app-shell cache is cleared. IndexedDB (offline
 * bookings queue, cached products/companies) and 'prewarm-assets-v1' are
 * never touched.
 */
@Injectable({ providedIn: 'root' })
export class AppVersionService {
  /** One reload per new bundle, so a bad check can never loop. */
  private static readonly RELOADED_FOR_KEY = 'app_version_reloaded_for';
  private checking = false;

  /** Not on the Android/iOS app (files come from the APK) or in dev builds. */
  private get enabled(): boolean {
    return environment.production && !Capacitor.isNativePlatform() && typeof fetch === 'function';
  }

  /** Check for a new deploy; reload to it if there is one. */
  async reloadIfNewVersion(): Promise<boolean> {
    if (!this.enabled || this.checking || !navigator.onLine) return false;
    this.checking = true;
    try {
      const latest = await this.latestMainBundle();
      if (!latest || this.isRunning(latest)) return false;

      // Guard: if we already reloaded for this bundle and still don't run it,
      // stop (e.g. a proxy serving an old copy) instead of reloading forever.
      if (this.read(AppVersionService.RELOADED_FOR_KEY) === latest) return false;
      this.write(AppVersionService.RELOADED_FOR_KEY, latest);

      await this.clearAppShellCache();
      window.location.reload();
      return true;
    } catch {
      return false; // offline / blocked — keep the current version
    } finally {
      this.checking = false;
    }
  }

  /** The main bundle named in the live index.html (bypassing every cache). */
  private async latestMainBundle(): Promise<string | null> {
    const response = await fetch(`/index.html?v=${Date.now()}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) return null;
    const html = await response.text();
    const match = html.match(/src="([^"]*\bmain[.-][^"]*\.js)"/);
    return match ? match[1].split('/').pop() || null : null;
  }

  private isRunning(bundle: string): boolean {
    return Array.from(document.querySelectorAll('script[src]')).some((script) =>
      (script.getAttribute('src') || '').split('?')[0].endsWith(bundle),
    );
  }

  private async clearAppShellCache(): Promise<void> {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith('app-shell-')).map((key) => caches.delete(key)));
    }
    // Pick up a changed sw.js too.
    const registration = await navigator.serviceWorker?.getRegistration();
    await registration?.update().catch(() => undefined);
  }

  private read(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // storage unavailable — the check still works, just without the guard
    }
  }
}
