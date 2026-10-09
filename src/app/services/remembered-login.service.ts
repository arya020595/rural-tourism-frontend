import { Injectable } from '@angular/core';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Capacitor } from '@capacitor/core';

export interface RememberedLogin {
  username: string;
  /** Always '' on the website — the browser's password manager keeps it. */
  password: string;
}

const NATIVE_KEY = 'remembered_login';
const WEB_USERNAME_KEY = 'remembered_username';

/**
 * "Ingat saya / Remember me" on the login page.
 *
 * - Android app: username + password in the plugin's encrypted storage
 *   (Android Keystore) — never in localStorage, which is plain text.
 * - Website: only the username (localStorage); the password is left to the
 *   browser's own password manager.
 *
 * Kept separate from the login token: logging out does not forget it, only
 * unticking the box (or a saved password that stops working) does.
 */
@Injectable({ providedIn: 'root' })
export class RememberedLoginService {
  /** Whether this device can remember the password, not just the username. */
  get savesPassword(): boolean {
    return Capacitor.isNativePlatform();
  }

  async load(): Promise<RememberedLogin | null> {
    try {
      if (this.savesPassword) {
        const saved = (await SecureStorage.get(NATIVE_KEY, false)) as
          | Partial<RememberedLogin>
          | null;
        if (saved && typeof saved === 'object' && saved.username) {
          return {
            username: String(saved.username),
            password: String(saved.password || ''),
          };
        }
        return null;
      }

      const username = localStorage.getItem(WEB_USERNAME_KEY);
      return username ? { username, password: '' } : null;
    } catch (err) {
      console.warn('[RememberedLogin] could not read saved login:', err);
      return null;
    }
  }

  async save(username: string, password: string): Promise<void> {
    try {
      if (this.savesPassword) {
        await SecureStorage.set(NATIVE_KEY, { username, password }, false);
        return;
      }
      localStorage.setItem(WEB_USERNAME_KEY, username);
    } catch (err) {
      console.warn('[RememberedLogin] could not save login:', err);
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.savesPassword) {
        await SecureStorage.remove(NATIVE_KEY);
        return;
      }
      localStorage.removeItem(WEB_USERNAME_KEY);
    } catch (err) {
      console.warn('[RememberedLogin] could not clear saved login:', err);
    }
  }

  /** Keeps the username but drops a saved password that no longer works. */
  async forgetPassword(): Promise<void> {
    const saved = await this.load();
    if (saved && saved.password) {
      await this.save(saved.username, '');
    }
  }
}
