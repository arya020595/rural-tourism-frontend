import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from './storage.service';

export type QueueStatus =
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'failed'
  | 'conflict'
  | 'permanently_failed';

export interface QueueItem {
  id?: number;
  idempotency_key: string;
  operation: 'CREATE' | 'EDIT';
  local_booking_id: string;
  server_booking_id: number | null;
  payload: Record<string, any>;
  base_version: number | null;
  status: QueueStatus;
  retry_count: number;
  error_message: string | null;
  conflict_data: Record<string, any> | null;
  company_id: number;
  created_at: Date;
  updated_at: Date;
}

class OfflineDatabase extends Dexie {
  offline_booking_queue!: Table<QueueItem, number>;
  booking_cache!: Table<any, number>;
  sync_lock!: Table<any, string>;
  // Products cached per company (key = company_id) and the package-companies
  // list (single fixed key). Moved here from localStorage — the per-company
  // product lists overflowed localStorage's ~5MB quota. IndexedDB has ample
  // space, so offline caching no longer breaks the dropdowns.
  product_cache!: Table<any, number>;
  company_cache!: Table<any, string>;

  constructor() {
    super('rural_tourism_offline');

    this.version(1).stores({
      offline_booking_queue:
        '++id, idempotency_key, local_booking_id, status, company_id, created_at',
      booking_cache: 'id, company_id, cached_at',
      sync_lock: 'id',
    });

    this.version(2).stores({
      product_cache: 'company_id, cached_at',
      company_cache: 'key, cached_at',
    });
  }
}

@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  private db = new OfflineDatabase();

  constructor(private storageService: StorageService) {}

  private get companyId(): number {
    const user = this.storageService.getUser<{ company_id: number }>();
    return user?.company_id ?? 0;
  }

  // ─── Queue Operations ──────────────────────────────────────────────────────

  async enqueueCreate(payload: Record<string, any>): Promise<string> {
    const idempotency_key = uuidv4();
    const local_booking_id = uuidv4();

    const existing = await this.db.offline_booking_queue
      .where('idempotency_key')
      .equals(idempotency_key)
      .first();
    if (existing) return idempotency_key;

    await this.db.offline_booking_queue.add({
      idempotency_key,
      operation: 'CREATE',
      local_booking_id,
      server_booking_id: null,
      payload: { ...payload, idempotency_key },
      base_version: null,
      status: 'pending',
      retry_count: 0,
      error_message: null,
      conflict_data: null,
      company_id: this.companyId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return idempotency_key;
  }

  async enqueueEdit(
    serverBookingId: number,
    payload: Record<string, any>,
    baseVersion: number,
  ): Promise<string> {
    const idempotency_key = uuidv4();

    const existingEdit = await this.db.offline_booking_queue
      .where('local_booking_id')
      .equals(String(serverBookingId))
      .filter(
        (item) => item.operation === 'EDIT' && item.status === 'pending',
      )
      .first();

    if (existingEdit?.id) {
      await this.db.offline_booking_queue.update(existingEdit.id, {
        idempotency_key,
        payload: { ...payload, idempotency_key, base_version: baseVersion },
        base_version: baseVersion,
        updated_at: new Date(),
      });
      return idempotency_key;
    }

    await this.db.offline_booking_queue.add({
      idempotency_key,
      operation: 'EDIT',
      local_booking_id: String(serverBookingId),
      server_booking_id: serverBookingId,
      payload: { ...payload, idempotency_key, base_version: baseVersion },
      base_version: baseVersion,
      status: 'pending',
      retry_count: 0,
      error_message: null,
      conflict_data: null,
      company_id: this.companyId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return idempotency_key;
  }

  /**
   * Records an edit that was already applied directly to the server (online
   * path, e.g. marking a booking paid while connected). Stored as 'synced' so
   * the booking list shows the transient "Synced" indicator, consistent with
   * edits that went through the offline queue.
   */
  async recordSyncedEdit(
    serverBookingId: number,
    payload: Record<string, any> = {},
  ): Promise<void> {
    try {
      const idempotency_key = uuidv4();
      const now = new Date();

      const existing = await this.db.offline_booking_queue
        .where('local_booking_id')
        .equals(String(serverBookingId))
        .filter((item) => item.operation === 'EDIT')
        .first();

      if (existing?.id) {
        await this.db.offline_booking_queue.update(existing.id, {
          status: 'synced',
          payload: { ...payload, idempotency_key },
          error_message: null,
          conflict_data: null,
          updated_at: now,
        });
        return;
      }

      await this.db.offline_booking_queue.add({
        idempotency_key,
        operation: 'EDIT',
        local_booking_id: String(serverBookingId),
        server_booking_id: serverBookingId,
        payload: { ...payload, idempotency_key },
        base_version: 0,
        status: 'synced',
        retry_count: 0,
        error_message: null,
        conflict_data: null,
        company_id: this.companyId,
        created_at: now,
        updated_at: now,
      });
    } catch (err) {
      console.warn('[OfflineQueue] Failed to record synced edit:', err);
    }
  }

  async getPendingItems(): Promise<QueueItem[]> {
    return this.db.offline_booking_queue
      .where('status')
      .equals('pending')
      .and((item) => item.company_id === this.companyId)
      .sortBy('created_at');
  }

  async getAllQueueItems(): Promise<QueueItem[]> {
    return this.db.offline_booking_queue
      .where('company_id')
      .equals(this.companyId)
      .sortBy('created_at');
  }

  async getFailedItems(): Promise<QueueItem[]> {
    return this.db.offline_booking_queue
      .where('status')
      .anyOf(['failed', 'conflict', 'permanently_failed'])
      .and((item) => item.company_id === this.companyId)
      .toArray();
  }

  async getPendingCount(): Promise<number> {
    return this.db.offline_booking_queue
      .where('status')
      .anyOf(['pending', 'syncing'])
      .and((item) => item.company_id === this.companyId)
      .count();
  }

  async updateItemStatus(
    id: number,
    status: QueueStatus,
    extras: Partial<QueueItem> = {},
  ): Promise<void> {
    await this.db.offline_booking_queue.update(id, {
      status,
      updated_at: new Date(),
      ...extras,
    });
  }

  /**
   * Removes already-synced queue items. Called on logout so the transient
   * "Synced" indicator does not reappear after logging back in — only genuinely
   * pending/failed items (or new changes made in the next session) keep a badge.
   */
  async clearSyncedItems(): Promise<void> {
    try {
      await this.db.offline_booking_queue
        .where('status')
        .equals('synced')
        .delete();
    } catch (err) {
      console.warn('[OfflineQueue] Failed to clear synced items:', err);
    }
  }

  async resetStaleSyncingItems(): Promise<void> {
    const staleItems = await this.db.offline_booking_queue
      .where('status')
      .equals('syncing')
      .toArray();

    for (const item of staleItems) {
      await this.updateItemStatus(item.id!, 'pending');
    }
  }

  // ─── Sync Lock ─────────────────────────────────────────────────────────────

  private readonly LOCK_TIMEOUT_MS = 60_000;

  async acquireLock(): Promise<boolean> {
    const lock = await this.db.sync_lock.get('global');
    const now = new Date();

    if (lock?.locked_at) {
      const age = now.getTime() - new Date(lock.locked_at).getTime();
      if (age < this.LOCK_TIMEOUT_MS) return false;
    }

    await this.db.sync_lock.put({
      id: 'global',
      locked_at: now,
      lock_holder: this.getLockHolder(),
    });
    return true;
  }

  async releaseLock(): Promise<void> {
    await this.db.sync_lock.put({
      id: 'global',
      locked_at: null,
      lock_holder: null,
    });
  }

  private getLockHolder(): string {
    if (!sessionStorage.getItem('tab_id')) {
      sessionStorage.setItem('tab_id', uuidv4());
    }
    return sessionStorage.getItem('tab_id')!;
  }

  // ─── Booking Cache ──────────────────────────────────────────────────────────

  async cacheBookings(bookings: any[]): Promise<void> {
    const companyId = this.companyId;
    const records = bookings.map((b) => ({
      ...b,
      company_id: companyId,
      cached_at: new Date(),
    }));
    await this.db.booking_cache.bulkPut(records);
  }

  async getCachedBookings(): Promise<any[]> {
    await this.pruneSyncedPlaceholders();
    return this.db.booking_cache
      .where('company_id')
      .equals(this.companyId)
      .toArray();
  }

  async removeCachedBooking(id: number | string): Promise<void> {
    await this.db.booking_cache.delete(id as any);
  }

  /**
   * Bookings created offline are cached under their idempotency key (a UUID)
   * so they show in the booking list before they reach the server. Once
   * synced, the server copy (numeric id) replaces them, so the placeholder
   * must go — otherwise the booking shows twice when offline again. Removes
   * any placeholder whose queue item is synced or no longer exists (synced
   * items are cleared on logout).
   */
  async pruneSyncedPlaceholders(): Promise<void> {
    try {
      const placeholders = await this.db.booking_cache
        .filter((row) => typeof row?.id === 'string' && !/^\d+$/.test(row.id))
        .toArray();
      if (!placeholders.length) return;

      const unsynced = new Set(
        (await this.db.offline_booking_queue.toArray())
          .filter((item) => item.status !== 'synced')
          .map((item) => item.idempotency_key),
      );
      const stale = placeholders
        .filter((row) => !unsynced.has(row.id))
        .map((row) => row.id);
      if (stale.length) await this.db.booking_cache.bulkDelete(stale);
    } catch (err) {
      console.warn('[OfflineQueue] Failed to prune synced placeholders:', err);
    }
  }

  /**
   * Dates (YYYY-MM-DD, device-local) between from and to that have a cached,
   * non-cancelled booking — the offline fallback for the booked-dates
   * endpoint used by the calendar dots. Same rules as the backend:
   * activity/package on the activity date, accommodation on every day from
   * check-in to check-out inclusive. Includes bookings made offline.
   */
  async getCachedBookedDates(from: string, to: string): Promise<string[]> {
    const localKey = (date: Date): string =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const toKey = (value: any): string => {
      const raw = String(value || '').trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
      const date = new Date(raw);
      return !raw || Number.isNaN(date.getTime()) ? '' : localKey(date);
    };

    const dates = new Set<string>();
    for (const row of await this.getCachedBookings()) {
      const status = String(row?.status || '').toLowerCase();
      if (status === 'cancelled' || status === 'rejected') continue;

      if (String(row?.booking_type || '').toLowerCase() === 'accommodation') {
        const checkIn = toKey(row?.check_in_date);
        const checkOut = toKey(row?.check_out_date) || checkIn;
        if (!checkIn || checkOut < from || checkIn > to) continue;
        const [y, m, d] = checkIn.split('-').map(Number);
        for (let day = new Date(y, m - 1, d); ; day.setDate(day.getDate() + 1)) {
          const key = localKey(day);
          if (key > checkOut || key > to) break;
          if (key >= from) dates.add(key);
        }
        continue;
      }

      const key = toKey(row?.activity_date);
      if (key && key >= from && key <= to) dates.add(key);
    }
    return [...dates];
  }

  // ─── Product / Company Cache (moved off localStorage) ────────────────────────

  /** Cache a company's product/service list for offline booking. */
  async cacheProducts(companyId: number, products: any[]): Promise<void> {
    const id = Number(companyId);
    if (!id) return;
    await this.db.product_cache.put({
      company_id: id,
      products: Array.isArray(products) ? products : [],
      cached_at: new Date(),
    });
  }

  /** Read a company's cached products (empty array if none). */
  async getCachedProducts(companyId: number): Promise<any[]> {
    const id = Number(companyId);
    if (!id) return [];
    const row = await this.db.product_cache.get(id);
    return Array.isArray(row?.products) ? row.products : [];
  }

  /** Cache the package-companies dropdown list. */
  async cachePackageCompanies(companies: any[]): Promise<void> {
    await this.db.company_cache.put({
      key: 'package_companies',
      companies: Array.isArray(companies) ? companies : [],
      cached_at: new Date(),
    });
  }

  /** Read the cached package-companies list (empty array if none). */
  async getCachedPackageCompanies(): Promise<any[]> {
    const row = await this.db.company_cache.get('package_companies');
    return Array.isArray(row?.companies) ? row.companies : [];
  }

  // ─── Utility ───────────────────────────────────────────────────────────────

  async isAvailable(): Promise<boolean> {
    try {
      await this.db.open();
      return true;
    } catch {
      return false;
    }
  }
}
