import { Injectable } from '@angular/core';

/**
 * StorageService - Centralized localStorage management
 *
 * Benefits:
 * - Consistent API for storage operations
 * - Type-safe get/set with generics
 * - Easy to switch to other storage (IndexedDB, Capacitor Storage, etc.)
 * - Centralized key management
 */
@Injectable({
  providedIn: 'root',
})
export class StorageService {
  // Storage keys as constants to prevent typos
  private readonly KEYS = {
    TOKEN: 'token',
    USER: 'user',
    UID: 'uid',
    TOURIST_USER_ID: 'tourist_user_id',
  } as const;

  constructor() {}

  // ========== Generic Methods ==========

  /**
   * Get an item from localStorage
   * @param key - The storage key
   * @returns The stored value or null
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      // Try to parse as JSON, fallback to raw string
      try {
        return JSON.parse(item) as T;
      } catch {
        return item as unknown as T;
      }
    } catch (error) {
      console.error(`Error reading from storage: ${key}`, error);
      return null;
    }
  }

  /**
   * Set an item in localStorage
   * @param key - The storage key
   * @param value - The value to store
   */
  set<T>(key: string, value: T): void {
    try {
      const serialized =
        typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error writing to storage: ${key}`, error);
    }
  }

  /**
   * Remove an item from localStorage
   * @param key - The storage key
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from storage: ${key}`, error);
    }
  }

  /**
   * Clear all localStorage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing storage', error);
    }
  }

  // ========== Auth-specific Methods ==========

  /**
   * Get the authentication token
   */
  getToken(): string | null {
    return this.get<string>(this.KEYS.TOKEN);
  }

  /**
   * Set the authentication token
   */
  setToken(token: string): void {
    this.set(this.KEYS.TOKEN, token);
  }

  /**
   * Get the current user ID (operator)
   */
  getUid(): string | null {
    return this.get<string>(this.KEYS.UID);
  }

  /**
   * Set the current user ID
   */
  setUid(uid: string): void {
    this.set(this.KEYS.UID, uid);
  }

  /**
   * Get the tourist user ID
   */
  getTouristUserId(): string | null {
    return this.get<string>(this.KEYS.TOURIST_USER_ID);
  }

  /**
   * Set the tourist user ID
   */
  setTouristUserId(id: string): void {
    this.set(this.KEYS.TOURIST_USER_ID, id);
  }

  /**
   * Get the stored user object
   */
  getUser<T = any>(): T | null {
    return this.get<T>(this.KEYS.USER);
  }

  /**
   * Set the user object
   */
  setUser<T>(user: T): void {
    this.set(this.KEYS.USER, user);
  }

  /**
   * Clear all authentication data
   */
  clearAuth(): void {
    this.remove(this.KEYS.TOKEN);
    this.remove(this.KEYS.UID);
    this.remove(this.KEYS.USER);
    this.remove(this.KEYS.TOURIST_USER_ID);
  }

  /**
   * Check if user is authenticated (has token or user data)
   */
  isAuthenticated(): boolean {
    return !!(this.getToken() || this.getUid() || this.getUser());
  }

  /**
   * Check if tourist user is logged in
   */
  isTouristLoggedIn(): boolean {
    return !!this.getTouristUserId() || !!this.getUser();
  }

  // ========== IndexedDB — large binary storage ==========
  // Used for assets that exceed localStorage's 5 MB quota (e.g. company logo).

  private openLogoDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('rt-assets', 1);
      req.onupgradeneeded = (e) => {
        (e.target as IDBOpenDBRequest).result.createObjectStore('logos');
      };
      req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
      req.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
    });
  }

  async setCompanyLogo(companyId: string | number, logo: string): Promise<void> {
    try {
      const db = await this.openLogoDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('logos', 'readwrite');
        tx.objectStore('logos').put(logo, String(companyId));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error('Error saving company logo to IndexedDB', error);
    }
  }

  async getCompanyLogo(companyId: string | number): Promise<string | null> {
    try {
      const db = await this.openLogoDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('logos', 'readonly');
        const req = tx.objectStore('logos').get(String(companyId));
        req.onsuccess = () => resolve((req.result as string) ?? null);
        req.onerror = () => reject(req.error);
      });
    } catch (error) {
      console.error('Error reading company logo from IndexedDB', error);
      return null;
    }
  }

  async clearCompanyLogo(companyId: string | number): Promise<void> {
    try {
      const db = await this.openLogoDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('logos', 'readwrite');
        tx.objectStore('logos').delete(String(companyId));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error('Error clearing company logo from IndexedDB', error);
    }
  }
}
