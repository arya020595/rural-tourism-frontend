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

  constructor() {
    super('rural_tourism_offline');

    this.version(1).stores({
      offline_booking_queue:
        '++id, idempotency_key, local_booking_id, status, company_id, created_at',
      booking_cache: 'id, company_id, cached_at',
      sync_lock: 'id',
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
    return this.db.booking_cache
      .where('company_id')
      .equals(this.companyId)
      .toArray();
  }

  async removeCachedBooking(id: number): Promise<void> {
    await this.db.booking_cache.delete(id);
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
