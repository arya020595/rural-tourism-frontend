# Frontend Technical Documentation: Offline-First Booking Module

**Feature**: Offline Booking Creation & Edit with Sync Queue  
**Version**: 1.0  
**Date**: May 8, 2026  
**Author**: Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Phase 1: Dependencies & Setup](#phase-1-dependencies--setup)
4. [Phase 2: Network Detection Service](#phase-2-network-detection-service)
5. [Phase 3: Offline Queue Service (IndexedDB)](#phase-3-offline-queue-service-indexeddb)
6. [Phase 4: Sync Service](#phase-4-sync-service)
7. [Phase 5: Booking Form Integration](#phase-5-booking-form-integration)
8. [Phase 6: Sync Status UI](#phase-6-sync-status-ui)
9. [Phase 7: Receipt Offline Caching](#phase-7-receipt-offline-caching)
10. [Phase 8: E-Receipt Walk-In Booking (Offline-Capable)](#phase-8-e-receipt-walk-in-booking-offline-capable)
11. [Phase 9: PWA Asset Caching & Offline Navigation](#phase-9-pwa-asset-caching--offline-navigation)
12. [Negative Scenario Handling](#negative-scenario-handling)
13. [Testing & Validation](#testing--validation)
14. [Deployment Guide](#deployment-guide)

---

## Overview

### Problem Statement

Operator admins create and edit booking data on-site where internet connectivity is unreliable. Without offline support, any network disruption completely blocks booking creation.

### Solution: Queue-First Architecture

Every booking operation is written to a local IndexedDB queue **before** any network request is made. The sync worker processes the queue whenever connectivity is available.

```
Operator submits form
  → ALWAYS write to IndexedDB queue first
  → If online: sync immediately
  → If offline: show "Saved locally" toast, sync later
  → UI always reflects true queue state (pending / syncing / synced / failed / conflict)
```

### Key Design Decisions

| Decision                            | Rationale                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| IndexedDB via Dexie.js              | Structured, queryable, handles large datasets; works in PWA + Capacitor                     |
| Queue-first (not interceptor-based) | HTTP interceptor never sees a failed booking request — data is safe before any network call |
| One sync worker at a time (lock)    | Prevents race conditions when app opens in multiple tabs                                    |
| Idempotency key per operation       | Makes all retries safe; no duplicate bookings                                               |
| `base_version` on edits             | Enables server-side conflict detection between concurrent editors                           |

### Scope

- **Offline-capable**: CREATE booking, EDIT booking
- **Online-only**: Delete booking, change booking status, generate PDF
- **Not covered**: Offline sync for non-booking modules
- **Offline navigation (page routing)**: ✅ Handled by cache-first service worker (`sw.js`)
- **Offline asset serving (images, icons, JS chunks)**: ✅ Handled by `sw.js` cache-first strategy + `prewarm-assets-v1` cache
- **Pre-warming caches at login**: ✅ `SyncService.prewarmCaches()` called on successful operator login

---

## Architecture

### Component Map

```
app.component.ts
  └── NetworkService         — detects online/offline via Capacitor Network
  └── SyncService            — processes queue on network events & app resume
        └── OfflineQueueService   — Dexie.js wrapper (queue CRUD, lock, dedup)
              └── booking.service.ts   — HTTP calls to backend

booking-add.page.ts
  └── OfflineQueueService   — writes CREATE operation to queue
  └── SyncService           — triggers immediate sync if online

booking-detail.page.ts
  └── OfflineQueueService   — writes EDIT operation to queue, collapses duplicates
  └── SyncService           — triggers immediate sync if online

booking-home.page.ts
  └── OfflineQueueService   — reads queue status to show sync badges
  └── OfflineQueueService   — caches booking list in `booking_cache` on load

booking-detail.page.ts  (receipt view)
  └── OfflineQueueService   — caches individual booking in `booking_cache` on load
  └── OfflineQueueService   — reads `booking_cache` to show receipt data when offline

login.page.ts
  └── SyncService.prewarmCaches()  — pre-warms data + asset caches on operator login

src/sw.js  (custom service worker, registered in main.ts)
  └── cache-first strategy for all same-origin app assets
  └── app-shell-v1 cache    — auto-populated on first fetch of each asset
  └── prewarm-assets-v1     — pre-populated by SyncService.prewarmAssets()

e-receipt.page.ts
  └── loadBgImages()        — loads background/tile images from prewarm-assets-v1 via blob URLs

header-logo.component.ts
  └── exploreSabahLogoSrc   — reads base64 from localStorage, falls back to asset path
```

### IndexedDB Schema (Dexie)

**Database name**: `rural_tourism_offline`

**Store: `offline_booking_queue`**

| Field               | Type                                                                                             | Description                                    |
| ------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `id`                | auto-increment PK                                                                                | Local queue item ID                            |
| `idempotency_key`   | string (UUID v4)                                                                                 | Unique key per operation                       |
| `operation`         | `'CREATE'` \| `'EDIT'`                                                                           | Operation type                                 |
| `local_booking_id`  | string                                                                                           | UUID for new bookings; server ID for edits     |
| `server_booking_id` | number \| null                                                                                   | Set after successful CREATE sync               |
| `payload`           | object                                                                                           | Full booking data to submit                    |
| `base_version`      | number \| null                                                                                   | Booking version at time of capture (EDIT only) |
| `status`            | `'pending'` \| `'syncing'` \| `'synced'` \| `'failed'` \| `'conflict'` \| `'permanently_failed'` | Sync state                                     |
| `retry_count`       | number                                                                                           | Number of sync attempts                        |
| `error_message`     | string \| null                                                                                   | Last error (for display)                       |
| `conflict_data`     | object \| null                                                                                   | Server's version on 409 conflict               |
| `company_id`        | number                                                                                           | Scopes data to operator's company              |
| `created_at`        | Date                                                                                             | When operation was queued                      |
| `updated_at`        | Date                                                                                             | Last status change                             |

**Store: `booking_cache`**

| Field        | Type                   | Description            |
| ------------ | ---------------------- | ---------------------- |
| `id`         | server booking ID (PK) |                        |
| `data`       | object                 | Full booking data      |
| `company_id` | number                 | Company scope          |
| `cached_at`  | Date                   | For cache invalidation |

**Store: `sync_lock`**

| Field         | Type                   | Description           |
| ------------- | ---------------------- | --------------------- |
| `id`          | `'global'` (fixed key) |                       |
| `locked_at`   | Date \| null           | Null = unlocked       |
| `lock_holder` | string                 | Tab/device identifier |

---

## Phase 1: Dependencies & Setup

### 1.1 Install Dexie.js

```bash
cd rural-tourism-frontend
npm install dexie
```

### 1.2 Install Capacitor Network Plugin

```bash
npm install @capacitor/network
npx cap sync
```

### 1.3 UUID Generation

````bash
npm install uuid
npm install --save-dev @types/uuid
```### 1.4 Update BookingService

**File**: `src/app/services/booking.service.ts`

The `SyncService` (Phase 4) calls `bookingService.createBooking()` and `bookingService.updateBooking()`. The `booking-detail` integration (Phase 5) also calls `bookingService.getBookingById()`. Add the two missing methods to the existing `BookingService`:

```typescript
// ── ADD to src/app/services/booking.service.ts ─────────────────────

/** Unified create endpoint used by both online and offline sync paths. */
createBooking(payload: Record<string, any>): Observable<any> {
  return this.http.post(`${this.apiUrl}/bookings`, payload);
}

/** Update an existing booking (used by SyncService for offline EDIT sync). */
updateBooking(id: number, payload: Record<string, any>): Observable<any> {
  return this.http.put(`${this.apiUrl}/bookings/${id}`, payload);
}

/** Fetch a single booking by server ID (used to hydrate booking-detail offline). */
getBookingById(id: number): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/bookings/${id}`);
}

/** Fetch paginated bookings list (used to populate booking_cache). */
getBookingList(params: Record<string, any> = {}): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/bookings`, { params });
}
````

> **Note**: The pre-existing `createActivityBooking()`, `createAccommodationBooking()`, etc. methods target the old per-type endpoints and should not be removed — they are used by the tourist-facing flows. The new unified `/bookings` endpoint is for the operator booking module only.

**File**: `src/app/services/network.service.ts`

```typescript
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { Network } from "@capacitor/network";

@Injectable({ providedIn: "root" })
export class NetworkService {
  private _isOnline$ = new BehaviorSubject<boolean>(true);

  readonly isOnline$: Observable<boolean> = this._isOnline$.asObservable();

  get isOnline(): boolean {
    return this._isOnline$.value;
  }

  async initialize(): Promise<void> {
    // Set initial state
    const status = await Network.getStatus();
    this._isOnline$.next(status.connected);

    // Listen for changes
    Network.addListener("networkStatusChange", (status) => {
      this._isOnline$.next(status.connected);
    });
  }

  destroy(): void {
    Network.removeAllListeners();
  }
}
```

**Register in `app.component.ts`**:

```typescript
export class AppComponent {
  constructor(
    private networkService: NetworkService,
    private syncService: SyncService,
    // ...existing injections
  ) {}

  async initializeApp() {
    await this.platform.ready();
    await this.networkService.initialize(); // ← add this
    this.syncService.initialize(); // ← add this (see Phase 4)
    // ...existing init code
  }
}
```

---

## Phase 3: Offline Queue Service (IndexedDB)

**File**: `src/app/services/offline-queue.service.ts`

```typescript
import { Injectable } from "@angular/core";
import Dexie, { Table } from "dexie";
import { v4 as uuidv4 } from "uuid";
import { StorageService } from "./storage.service";

export type QueueStatus = "pending" | "syncing" | "synced" | "failed" | "conflict" | "permanently_failed";

export interface QueueItem {
  id?: number;
  idempotency_key: string;
  operation: "CREATE" | "EDIT";
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
    super("rural_tourism_offline");

    this.version(1).stores({
      offline_booking_queue: "++id, idempotency_key, local_booking_id, status, company_id, created_at",
      booking_cache: "id, company_id, cached_at",
      sync_lock: "id",
    });
  }
}

@Injectable({ providedIn: "root" })
export class OfflineQueueService {
  private db = new OfflineDatabase();

  constructor(private storageService: StorageService) {}

  private get companyId(): number {
    const user = this.storageService.get<{ company_id: number }>("user");
    return user?.company_id ?? 0;
  }

  // ─── Queue Operations ───────────────────────────────────────────────────

  /**
   * Enqueue a CREATE booking operation.
   * Returns the idempotency_key for the form to track.
   */
  async enqueueCreate(payload: Record<string, any>): Promise<string> {
    const idempotency_key = uuidv4();
    const local_booking_id = uuidv4();

    // Prevent duplicate queue entries
    const existing = await this.db.offline_booking_queue.where("idempotency_key").equals(idempotency_key).first();
    if (existing) return idempotency_key;

    await this.db.offline_booking_queue.add({
      idempotency_key,
      operation: "CREATE",
      local_booking_id,
      server_booking_id: null,
      payload: { ...payload, idempotency_key },
      base_version: null,
      status: "pending",
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
   * Enqueue an EDIT booking operation.
   * Collapses: if a pending EDIT for same booking already exists,
   * replace its payload with the latest data (no duplicate entries).
   */
  async enqueueEdit(serverBookingId: number, payload: Record<string, any>, baseVersion: number): Promise<string> {
    const idempotency_key = uuidv4();

    // Collapse: check for existing pending EDIT for same booking
    const existingEdit = await this.db.offline_booking_queue
      .where("local_booking_id")
      .equals(String(serverBookingId))
      .filter((item) => item.operation === "EDIT" && item.status === "pending")
      .first();

    if (existingEdit?.id) {
      // Replace payload with latest data, generate new idempotency key
      await this.db.offline_booking_queue.update(existingEdit.id, {
        idempotency_key,
        payload: { ...payload, idempotency_key, base_version: baseVersion },
        base_version: baseVersion,
        updated_at: new Date(),
      });
      return idempotency_key;
    }

    // New EDIT entry
    await this.db.offline_booking_queue.add({
      idempotency_key,
      operation: "EDIT",
      local_booking_id: String(serverBookingId),
      server_booking_id: serverBookingId,
      payload: { ...payload, idempotency_key, base_version: baseVersion },
      base_version: baseVersion,
      status: "pending",
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
      .where("status")
      .equals("pending")
      .and((item) => item.company_id === this.companyId)
      .sortBy("created_at");
  }

  async getAllQueueItems(): Promise<QueueItem[]> {
    return this.db.offline_booking_queue.where("company_id").equals(this.companyId).sortBy("created_at");
  }

  async getFailedItems(): Promise<QueueItem[]> {
    return this.db.offline_booking_queue
      .where("status")
      .anyOf(["failed", "conflict", "permanently_failed"])
      .and((item) => item.company_id === this.companyId)
      .toArray();
  }

  async getPendingCount(): Promise<number> {
    return this.db.offline_booking_queue
      .where("status")
      .anyOf(["pending", "syncing"])
      .and((item) => item.company_id === this.companyId)
      .count();
  }

  async updateItemStatus(id: number, status: QueueStatus, extras: Partial<QueueItem> = {}): Promise<void> {
    await this.db.offline_booking_queue.update(id, {
      status,
      updated_at: new Date(),
      ...extras,
    });
  }

  /**
   * On app open: reset any items stuck in 'syncing' state (OS kill mid-sync).
   */
  async resetStaleSyncingItems(): Promise<void> {
    const staleItems = await this.db.offline_booking_queue.where("status").equals("syncing").toArray();

    for (const item of staleItems) {
      await this.updateItemStatus(item.id!, "pending");
    }
  }

  // ─── Sync Lock ───────────────────────────────────────────────────────────

  private readonly LOCK_TIMEOUT_MS = 60_000; // 60 seconds

  async acquireLock(): Promise<boolean> {
    const lock = await this.db.sync_lock.get("global");
    const now = new Date();

    if (lock?.locked_at) {
      const age = now.getTime() - new Date(lock.locked_at).getTime();
      if (age < this.LOCK_TIMEOUT_MS) {
        return false; // Another worker holds the lock
      }
      // Stale lock — steal it
    }

    await this.db.sync_lock.put({
      id: "global",
      locked_at: now,
      lock_holder: this.getLockHolder(),
    });
    return true;
  }

  async releaseLock(): Promise<void> {
    await this.db.sync_lock.put({
      id: "global",
      locked_at: null,
      lock_holder: null,
    });
  }

  private getLockHolder(): string {
    // Stable per-tab identifier
    if (!sessionStorage.getItem("tab_id")) {
      sessionStorage.setItem("tab_id", uuidv4());
    }
    return sessionStorage.getItem("tab_id")!;
  }

  // ─── Booking Cache ───────────────────────────────────────────────────────

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
    return this.db.booking_cache.where("company_id").equals(this.companyId).toArray();
  }

  async removeCachedBooking(id: number): Promise<void> {
    await this.db.booking_cache.delete(id);
  }

  // ─── Utility ─────────────────────────────────────────────────────────────

  async isAvailable(): Promise<boolean> {
    try {
      await this.db.open();
      return true;
    } catch {
      return false;
    }
  }
}
```

---

## Phase 4: Sync Service

**File**: `src/app/services/sync.service.ts`

```typescript
import { Injectable } from "@angular/core";
import { App } from "@capacitor/app";
import { BehaviorSubject, interval, Subscription } from "rxjs";
import { filter, switchMap } from "rxjs/operators";
import { BookingService } from "./booking.service";
import { NetworkService } from "./network.service";
import { OfflineQueueService, QueueItem } from "./offline-queue.service";
import { StorageService } from "./storage.service";

const MAX_RETRIES = 3;
const SYNC_INTERVAL_MS = 30_000; // 30 seconds
const RETRY_DELAYS_MS = [0, 5_000, 30_000]; // per attempt index

@Injectable({ providedIn: "root" })
export class SyncService {
  private isSyncing = false;
  private subscriptions: Subscription[] = [];

  // Emits total count of pending + failed items for UI badges
  readonly pendingCount$ = new BehaviorSubject<number>(0);

  constructor(
    private offlineQueue: OfflineQueueService,
    private bookingService: BookingService,
    private networkService: NetworkService,
    private storageService: StorageService,
    private companyService: CompanyService,
    private productService: ProductService,
  ) {}

  async initialize(): Promise<void> {
    // Reset any items stuck in "syncing" from previous session
    await this.offlineQueue.resetStaleSyncingItems();
    await this.refreshPendingCount();

    // Sync on network restore
    const networkSub = this.networkService.isOnline$.pipe(filter((online) => online)).subscribe(() => this.triggerSync());
    this.subscriptions.push(networkSub);

    // Periodic sync every 30s (catches missed events)
    const intervalSub = interval(SYNC_INTERVAL_MS)
      .pipe(filter(() => this.networkService.isOnline))
      .subscribe(() => this.triggerSync());
    this.subscriptions.push(intervalSub);

    // Sync on app resume (mobile)
    App.addListener("appStateChange", ({ isActive }) => {
      if (isActive && this.networkService.isOnline) {
        this.triggerSync();
      }
    });

    // Initial sync on startup
    if (this.networkService.isOnline) {
      this.triggerSync();
      await this.prewarmCaches();
    }
  }

  async triggerSync(): Promise<void> {
    if (this.isSyncing) return;

    // JWT expiry check before starting
    if (!this.isTokenValid()) return;

    const lockAcquired = await this.offlineQueue.acquireLock();
    if (!lockAcquired) return; // Another tab is syncing

    this.isSyncing = true;

    try {
      await this.processQueue();
    } finally {
      await this.offlineQueue.releaseLock();
      this.isSyncing = false;
      await this.refreshPendingCount();
    }
  }

  private async processQueue(): Promise<void> {
    const pendingItems = await this.offlineQueue.getPendingItems();
    if (!pendingItems.length) return;

    // Group by local_booking_id to preserve per-booking operation order
    const groups = this.groupByBookingId(pendingItems);

    for (const [, items] of groups) {
      for (const item of items) {
        await this.processItem(item);

        // If CREATE for this booking failed, block subsequent EDITs
        if (item.operation === "CREATE" && item.status !== "synced") {
          break;
        }
      }
    }

    // After queue is drained, refresh all caches
    if (this.networkService.isOnline) {
      try {
        const response = await this.bookingService
          .getBookingList()
          .toPromise();
        if (response?.data) {
          await this.offlineQueue.cacheBookings(response.data);
        }
      } catch {
        // Non-critical: cache refresh failure doesn't affect sync result
      }
      await this.prewarmCaches();
    }
  }

  private async processItem(item: QueueItem): Promise<void> {
    // Exponential backoff: don't retry too quickly
    if (item.retry_count > 0) {
      const delay = RETRY_DELAYS_MS[Math.min(item.retry_count - 1, RETRY_DELAYS_MS.length - 1)];
      if (delay > 0) await this.sleep(delay);
    }

    await this.offlineQueue.updateItemStatus(item.id!, "syncing");

    try {
      if (item.operation === "CREATE") {
        await this.syncCreate(item);
      } else {
        await this.syncEdit(item);
      }
    } catch (err: any) {
      await this.handleSyncError(item, err);
    }
  }

  private async syncCreate(item: QueueItem): Promise<void> {
    const response = await this.bookingService.createBooking(item.payload).toPromise();
    await this.offlineQueue.updateItemStatus(item.id!, "synced", {
      server_booking_id: response.data?.id ?? null,
    });
  }

  private async syncEdit(item: QueueItem): Promise<void> {
    const bookingId = item.server_booking_id!;
    await this.bookingService.updateBooking(bookingId, item.payload).toPromise();
    await this.offlineQueue.updateItemStatus(item.id!, "synced");
  }

  private async handleSyncError(item: QueueItem, err: any): Promise<void> {
    const status = err?.status;

    // 404: booking was deleted on server
    if (status === 404) {
      await this.offlineQueue.updateItemStatus(item.id!, "conflict", {
        error_message: "Booking was deleted on the server",
        conflict_data: null,
      });
      await this.offlineQueue.removeCachedBooking(item.server_booking_id!);
      return;
    }

    // 409: version conflict
    if (status === 409) {
      const conflictData = err?.error; // { conflict: true, serverVersion, serverData }
      await this.offlineQueue.updateItemStatus(item.id!, "conflict", {
        error_message: "Booking was modified by another user",
        conflict_data: conflictData,
      });
      return;
    }

    // 4xx validation error: don't retry — bad data
    if (status >= 400 && status < 500) {
      await this.offlineQueue.updateItemStatus(item.id!, "permanently_failed", {
        error_message: err?.error?.message || "Validation error",
        retry_count: item.retry_count + 1,
      });
      return;
    }

    // 5xx / timeout: retry with backoff
    const newRetryCount = item.retry_count + 1;
    if (newRetryCount >= MAX_RETRIES) {
      await this.offlineQueue.updateItemStatus(item.id!, "permanently_failed", {
        error_message: err?.error?.message || "Server error after 3 retries",
        retry_count: newRetryCount,
      });
    } else {
      await this.offlineQueue.updateItemStatus(item.id!, "pending", {
        retry_count: newRetryCount,
        error_message: err?.error?.message || "Network error",
      });
    }
  }

  async refreshPendingCount(): Promise<void> {
    const count = await this.offlineQueue.getPendingCount();
    const failed = (await this.offlineQueue.getFailedItems()).length;
    this.pendingCount$.next(count + failed);
  }

  /**
   * Pre-warms localStorage data caches (bookings, products, package companies).
   * Called on login (for operator roles) and after queue drains.
   */
  async prewarmCaches(): Promise<void> {
    try {
      // Fetch and cache bookings list
      const bookingsResp = await this.bookingService
        .getBookingList({ per_page: 1000 })
        .toPromise();
      if (bookingsResp?.data) {
        await this.offlineQueue.cacheBookings(bookingsResp.data);
      }

      // Fetch and cache operator's own products
      const productsResp = await this.productService.getProducts().toPromise();
      if (productsResp?.data) {
        localStorage.setItem('cached_products', JSON.stringify(productsResp.data));
      }

      // Fetch and cache package companies + their products
      const companiesResp = await this.companyService.getPackageCompanies().toPromise();
      if (companiesResp?.data) {
        localStorage.setItem('cached_package_companies', JSON.stringify(companiesResp.data));
      }

      await this.prewarmAssets();
    } catch {
      // Non-critical: prewarm failure does not affect booking operations
    }
  }

  /**
   * Fetches critical static assets and stores them in the Cache API
   * under `prewarm-assets-v1`. Also saves the Explore Sabah logo as
   * base64 to localStorage for immediate use in header-logo component.
   */
  private async prewarmAssets(): Promise<void> {
    if (!('caches' in window)) return;

    const cache = await caches.open('prewarm-assets-v1');

    const imageAssets = [
      'assets/icon/explore_sabah-without_bg.png',
      'assets/icon/RuralT Logo.png',
      'assets/icon/tree.png',
      'assets/icon/house.png',
      'assets/icon/pakej-removebg-preview.png',
      'assets/mountain.jpg',
      'assets/accom.jpg',
      'assets/package.jpg',
    ];

    const ioniconSvgs = [
      '/svg/calendar-clear-outline.svg',
      '/svg/time-outline.svg',
      '/svg/grid-outline.svg',
      '/svg/chevron-back-outline.svg',
      '/svg/chevron-forward-outline.svg',
      '/svg/notifications-outline.svg',
      '/svg/notifications.svg',
      '/svg/cloud-offline-outline.svg',
      '/svg/close-circle-outline.svg',
      '/svg/paper-plane-outline.svg',
      '/svg/trash-outline.svg',
      '/svg/add-circle-outline.svg',
      '/svg/alert-circle-outline.svg',
      '/svg/alert-circle.svg',
      '/svg/menu-outline.svg',
      '/svg/log-out-outline.svg',
      '/svg/checkmark-circle-outline.svg',
      '/svg/chevron-down-outline.svg',
      '/svg/search-outline.svg',
      '/svg/pencil-outline.svg',
      '/svg/eye-outline.svg',
      '/svg/eye-off-outline.svg',
    ];

    const allAssets = [...imageAssets, ...ioniconSvgs];

    for (const url of allAssets) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response.clone());

          // Save Explore Sabah logo as base64 for header-logo component
          if (url === 'assets/icon/explore_sabah-without_bg.png') {
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              localStorage.setItem('explore_sabah_logo', reader.result as string);
            };
            reader.readAsDataURL(blob);
          }
        }
      } catch {
        // Individual asset failure is non-fatal
      }
    }
  }

  private groupByBookingId(items: QueueItem[]): Map<string, QueueItem[]> {
    const groups = new Map<string, QueueItem[]>();
    for (const item of items) {
      const key = item.local_booking_id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return groups;
  }

  private isTokenValid(): boolean {
    const token = this.storageService.get<string>("token");
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  destroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    App.removeAllListeners();
  }
}
```

---

## Phase 5: Booking Form Integration

### 5.1 Create Booking Form (`booking-add.page.ts`)

**Key changes to submit handler**:

```typescript
import { v4 as uuidv4 } from "uuid";
import { OfflineQueueService } from "../services/offline-queue.service";
import { SyncService } from "../services/sync.service";
import { NetworkService } from "../services/network.service";

export class BookingAddPage {
  isSubmitting = false; // prevents double-tap

  constructor(
    private offlineQueue: OfflineQueueService,
    private syncService: SyncService,
    private networkService: NetworkService,
    private toastController: ToastController,
    // ...existing injections
  ) {}

  async submitBooking(): Promise<void> {
    if (this.isSubmitting) return; // guard against multiple taps
    this.isSubmitting = true;

    try {
      const bookingPayload = this.buildPayload(); // your existing form → payload logic

      // Write to queue first (always)
      const idempotencyKey = await this.offlineQueue.enqueueCreate(bookingPayload);

      if (this.networkService.isOnline) {
        // Attempt immediate sync
        await this.syncService.triggerSync();
        await this.showToast("Booking submitted successfully", "success");
      } else {
        await this.showToast("No internet. Booking saved locally — will sync when online.", "warning");
      }

      this.navigateBack(); // go back to booking list
    } catch (err) {
      await this.showToast("Failed to save booking. Please try again.", "danger");
    } finally {
      this.isSubmitting = false;
    }
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, color });
    await toast.present();
  }
}
```

### 5.2 Edit Booking Form (`booking-detail.page.ts`)

**Key changes: capture `base_version` when loading the booking**:

```typescript
export class BookingDetailPage {
  booking: any;
  isSubmitting = false;

  async loadBooking(id: number): Promise<void> {
    this.booking = await this.bookingService.getBookingById(id).toPromise();
    // base_version is captured here — the version at time of form open
  }

  async submitEdit(): Promise<void> {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    try {
      const payload = this.buildEditPayload();

      // Capture base_version from the loaded booking
      const baseVersion = this.booking.version ?? 0;

      await this.offlineQueue.enqueueEdit(this.booking.id, payload, baseVersion);

      if (this.networkService.isOnline) {
        await this.syncService.triggerSync();
        await this.showToast("Booking updated successfully", "success");
      } else {
        await this.showToast("No internet. Edit saved locally — will sync when online.", "warning");
      }

      this.navigateBack();
    } catch (err) {
      await this.showToast("Failed to save edit. Please try again.", "danger");
    } finally {
      this.isSubmitting = false;
    }
  }
}
```

---

## Phase 6: Sync Status UI

### 6.1 Sync Badge in Booking List Header

Display a badge showing unsync'd item count in the booking list header.

**Template snippet (`booking-home.page.html`)**:

```html
<ion-header>
  <ion-toolbar>
    <ion-title>Bookings</ion-title>
    <ion-buttons slot="end">
      <ion-button *ngIf="(pendingCount$ | async) as count">
        <ion-badge color="warning">{{ count }}</ion-badge>
        <ion-icon name="cloud-upload-outline"></ion-icon>
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<!-- Persistent banner for failed/conflict items -->
<ion-item color="danger" *ngIf="(failedCount$ | async) > 0" lines="none">
  <ion-icon name="warning-outline" slot="start"></ion-icon>
  <ion-label>
    {{ failedCount$ | async }} booking(s) failed to sync.
    <a (click)="openSyncQueue()">Review</a>
  </ion-label>
</ion-item>
```

**Component (`booking-home.page.ts`)**:

```typescript
pendingCount$ = this.syncService.pendingCount$;
failedCount$ = this.pendingCount$.pipe(
  switchMap(() => this.offlineQueue.getFailedItems()),
  map((items) => items.length),
);
```

### 6.2 Per-Booking Sync Dot in List

Each row in the booking list shows a colored status dot:

```html
<!-- In booking list row template -->
<ion-item *ngFor="let booking of bookings">
  <ion-label>{{ booking.tourist_full_name }}</ion-label>
  <ng-container *ngIf="getQueueStatus(booking.id) as queueStatus">
    <ion-badge slot="end" [color]="queueStatusColor(queueStatus)"> {{ queueStatus }} </ion-badge>
  </ng-container>
</ion-item>
```

Status to color mapping:

| Status               | Color     | Label      |
| -------------------- | --------- | ---------- |
| `pending`            | `medium`  | Pending    |
| `syncing`            | `primary` | Syncing... |
| `synced`             | `success` | Synced     |
| `failed`             | `warning` | Failed     |
| `conflict`           | `danger`  | Conflict   |
| `permanently_failed` | `danger`  | Failed     |

### 6.3 Conflict Resolution Screen

When a queue item has status `conflict`, navigate to a conflict resolution page:

```typescript
// conflict-resolve.page.ts
export class ConflictResolvePage {
  queueItem: QueueItem;

  // Show two columns: "My changes" vs "Server version"
  get myData() {
    return this.queueItem.payload;
  }
  get serverData() {
    return this.queueItem.conflict_data?.serverData;
  }

  async acceptServerVersion(): Promise<void> {
    // Mark item as resolved, update local cache with server data
    await this.offlineQueue.updateItemStatus(this.queueItem.id!, "synced");
    if (this.serverData) {
      await this.offlineQueue.cacheBookings([this.serverData]);
    }
    this.navCtrl.back();
  }

  async forceMyVersion(): Promise<void> {
    // Generate new idempotency key, set base_version to server's version
    const serverVersion = this.queueItem.conflict_data?.serverVersion;
    const newKey = uuidv4();
    await this.offlineQueue.updateItemStatus(this.queueItem.id!, "pending", {
      idempotency_key: newKey,
      base_version: serverVersion,
      payload: {
        ...this.queueItem.payload,
        idempotency_key: newKey,
        base_version: serverVersion,
      },
      retry_count: 0,
      error_message: null,
      conflict_data: null,
    });
    await this.syncService.triggerSync();
    this.navCtrl.back();
  }
}
```

---

## Phase 7: Receipt Offline Caching

### 7.1 Goal

Operators in rural areas must be able to **view** a booking confirmation (receipt) even without internet. PDF download remains online-only. This phase wires up `booking_cache` reads and writes in the booking list and booking detail pages.

### 7.2 Cache Bookings on List Load (`booking-home.page.ts`)

Every time the booking list loads successfully from the server, write the results to `booking_cache`. Bookings are sorted by `Number(b.id) - Number(a.id)` descending (latest booking ID first) in both the online and offline load paths:

```typescript
import { OfflineQueueService } from "../services/offline-queue.service";
import { NetworkService } from "../services/network.service";

export class BookingHomePage implements OnInit {
  bookings: any[] = [];

  constructor(
    private bookingService: BookingService,
    private offlineQueue: OfflineQueueService,
    private networkService: NetworkService,
    // ...existing injections
  ) {}

  async loadBookings(): Promise<void> {
    if (this.networkService.isOnline) {
      this.bookingService.getBookingList().subscribe({
        next: async (response) => {
          this.bookings = (response.data ?? []).sort(
            (a: any, b: any) => Number(b.id) - Number(a.id)
          );
          // ── ADD: persist to cache for offline receipt viewing ─────────
          await this.offlineQueue.cacheBookings(this.bookings);
          // ── END ADD ────────────────────────────────────────────────────
        },
        error: () => this.loadFromCache(), // network error → fall back to cache
      });
    } else {
      await this.loadFromCache();
    }
  }

  private async loadFromCache(): Promise<void> {
    const cached = await this.offlineQueue.getCachedBookings();
    this.bookings = cached.sort(
      (a: any, b: any) => Number(b.id) - Number(a.id)
    );
    if (this.bookings.length === 0) {
      // Show empty-state with offline indicator
      this.showOfflineBanner = true;
    }
  }

  showOfflineBanner = false;
}
```

**Template addition** — offline banner:

```html
<!-- Show when offline and no cached data -->
<ion-item color="medium" *ngIf="showOfflineBanner" lines="none">
  <ion-icon name="cloud-offline-outline" slot="start"></ion-icon>
  <ion-label>You are offline. Showing last synced bookings.</ion-label>
</ion-item>
```

### 7.3 Cache Single Booking on Detail Load (`booking-detail.page.ts`)

When the operator opens a booking detail (receipt) page, write the fresh booking data to cache. On subsequent offline visits, read from cache instead:

```typescript
export class BookingDetailPage implements OnInit {
  booking: any = null;
  isOffline = false;

  async loadBooking(id: number): Promise<void> {
    if (this.networkService.isOnline) {
      this.bookingService.getBookingById(id).subscribe({
        next: async (response) => {
          this.booking = response.data;
          // Capture base_version for offline EDIT (see Phase 5.2)
          // ── ADD: update cache with freshest data ───────────────────
          await this.offlineQueue.cacheBookings([this.booking]);
          // ── END ADD ─────────────────────────────────────────────────────
        },
        error: async () => this.loadBookingFromCache(id),
      });
    } else {
      await this.loadBookingFromCache(id);
    }
  }

  private async loadBookingFromCache(id: number): Promise<void> {
    const cached = await this.offlineQueue.getCachedBookings();
    this.booking = cached.find((b) => b.id === id) ?? null;
    this.isOffline = true;
  }
}
```

**Template addition** — offline receipt indicator and PDF guard:

```html
<!-- Offline banner on receipt/detail page -->
<ion-item color="warning" *ngIf="isOffline" lines="none">
  <ion-icon name="cloud-offline-outline" slot="start"></ion-icon>
  <ion-label>You are offline. Showing last saved receipt data.</ion-label>
</ion-item>

<!-- Disable PDF download when offline -->
<ion-button [disabled]="isOffline" (click)="viewPaymentReceipt()">
  <ion-icon name="document-outline" slot="start"></ion-icon>
  {{ isOffline ? 'PDF unavailable offline' : 'Download PDF' }}
</ion-button>
```

### 7.4 Post-Sync Cache Refresh

After `SyncService.processQueue()` completes, refresh `booking_cache` so the operator's receipt data reflects the server's latest state (e.g., status `pending` → `confirmed`). This is handled in `SyncService.processQueue()` — see Phase 4 for the implementation.

### 7.5 Scope Reminder

| Receipt operation              | Offline support                                         |
| ------------------------------ | ------------------------------------------------------- |
| View booking details           | ✅ Reads from `booking_cache`                           |
| See payment status, pax, dates | ✅ All fields cached as part of booking object          |
| Download PDF                   | ❌ Online only — button disabled with clear label       |
| Share / print receipt          | ⚠️ Depends on platform (browser print may work offline) |

---

## Phase 8: E-Receipt Walk-In Booking (Offline-Capable)

### 8.1 How the Current Online Flow Works

The e-receipt module is a **single-shot walk-in flow** — different from the regular booking module:

```
ereceipt-add.page.ts submits form
  → POST /api/bookings (status: paid)
  → Server returns booking with real ID
  → navigateToReceipt() → /receipt-activity/{bookingId}
  → receipt page renders from router history.state
  → html2canvas captures receipt DOM as PNG
  → PNG sent to receiptController.generatePdfFromImage()
  → Backend saves PDF → returns /uploads/receipt_{id}.pdf URL
  → generateQR() builds QR code pointing to that PDF URL
  → Tourist scans QR to download PDF receipt
```

### 8.2 The Offline Gap

The QR code points to a **server-generated PDF** at `{API}/uploads/receipt_{bookingId}.pdf`. That file only exists after:
1. The booking is synced (requires a real server `id`)
2. The receipt page captures the DOM and uploads the PNG to the backend

Both steps require the server. This means offline, **the QR code cannot be generated** — not just the PDF download, but the QR itself.

### 8.3 Offline Strategy: Render Receipt Immediately, Defer QR Until Synced

```
Operator submits walk-in booking (offline)
  → Save to IndexedDB queue with status: paid in payload
  → Navigate to receipt page passing local queue data via router state
  → Receipt page renders fully from local data ✅
  → QR code section replaced with a pending banner ⏳
  → Back online → SyncService syncs → booking gets real server ID
  → Receipt page re-visits with real ID → html2canvas → PDF → QR appears ✅
```

**Backend requires zero changes.** The `receiptController.generatePdfFromImage()` and booking PDF endpoints are unchanged.

### 8.4 Changes to `ereceipt-add.page.ts`

Replace the direct API call with the queue-first pattern, passing local data to the receipt page immediately:

```typescript
import { v4 as uuidv4 } from 'uuid';
import { OfflineQueueService } from '../services/offline-queue.service';
import { SyncService } from '../services/sync.service';
import { NetworkService } from '../services/network.service';

async handleFormSubmit(formType: string, payload: any): Promise<void> {
  if (this.isSubmitting) return;
  this.isSubmitting = true;

  try {
    const createPayload = await this.buildCreatePayload(
      formType,
      payload,
      this.authService.currentUser?.company_id ?? null,
    );

    // Always write to queue first (status: paid is already in createPayload)
    const idempotencyKey = await this.offlineQueue.enqueueCreate(createPayload);

    if (this.networkService.isOnline) {
      // Attempt immediate sync — receipt page will have a real server ID
      await this.syncService.triggerSync();
    }

    // Navigate immediately with local data — receipt page handles the QR state
    this.navigateToReceipt(formType, idempotencyKey, {
      ...createPayload,
      idempotency_key: idempotencyKey,
      _isLocalOnly: !this.networkService.isOnline,
    });
  } catch (error: any) {
    console.error('[ereceipt-add] failed to queue booking', error);
    alert(error?.error?.message || 'Failed to save e-receipt booking.');
  } finally {
    this.isSubmitting = false;
  }
}

// Updated navigateToReceipt: accepts idempotencyKey as local reference
private navigateToReceipt(formType: string, localRef: any, booking: any): void {
  const state = { booking, idempotencyKey: booking.idempotency_key };

  if (formType === 'activity') {
    this.navCtrl.navigateForward(`/receipt-activity/${localRef}`, {
      state,
      replaceUrl: true,
    });
    return;
  }
  if (formType === 'accommodation') {
    this.navCtrl.navigateForward(`/receipt/${localRef}`, { state, replaceUrl: true });
    return;
  }
  if (formType === 'package') {
    this.navCtrl.navigateForward(`/receipt-package/${localRef}`, { state, replaceUrl: true });
  }
}
```

### 8.5 Changes to Receipt Pages (`receipt-activity`, `receipt`, `receipt-package`)

Each receipt page needs to:
1. Detect whether it has a real server ID or a local-only queue reference
2. Hide the QR section when local-only, show a pending banner instead
3. After sync completes and a real server ID is available, auto-generate the PDF and QR

`isLocalOnly` is also set to `true` when `!networkService.isOnline` (not only when the `_isLocalOnly` flag is set), so opening an already-paid booking while offline shows the QR warning banner instead of "Error Generating PDF".

```typescript
export class ReceiptActivityPage implements OnInit {
  isLocalOnly = false;         // true when booking not yet synced or device is offline
  qrCodeReady = false;
  pdfUrl = '';
  pdfLink = '';

  async loadReceipt(): Promise<void> {
    const stateBooking = history.state?.['booking'] ?? null;
    const idempotencyKey = history.state?.['idempotency_key'] ?? null;

    if (stateBooking) {
      this.receipt = this.mapBookingToReceipt(stateBooking);
      this.isLocalOnly = stateBooking._isLocalOnly === true || !this.networkService.isOnline;

      if (!this.isLocalOnly) {
        // Real server ID available — proceed with auto PDF + QR generation
        this.receiptReady = true;
        this.tryAutoGenerateReceipt();
      } else {
        // Offline — render receipt only, poll queue for sync completion
        this.receiptReady = true;
        this.watchForSync(idempotencyKey);
      }
      return;
    }

    // Fallback: load from server by ID (existing behaviour)
    // ...existing loadReceipt logic unchanged...
  }

  // Poll the queue item until server_booking_id is populated (sync complete)
  private async watchForSync(idempotencyKey: string): Promise<void> {
    if (!idempotencyKey) return;

    const interval = setInterval(async () => {
      const items = await this.offlineQueue.getAllQueueItems();
      const item = items.find((i) => i.idempotency_key === idempotencyKey);

      if (item?.server_booking_id) {
        clearInterval(interval);
        // Re-load receipt with real server data, then generate PDF + QR
        this.receiptId = item.server_booking_id;
        this.isLocalOnly = false;
        this.tryAutoGenerateReceipt();
      }
    }, 3000); // check every 3 seconds
  }
}
```

**Template addition** — QR pending state:

```html
<!-- QR code section: show pending banner when not yet synced -->
<ng-container *ngIf="!isLocalOnly; else qrPending">
  <qrcode *ngIf="qrCodeReady" [qrdata]="pdfLink" [width]="200"></qrcode>
</ng-container>

<ng-template #qrPending>
  <ion-item color="warning" lines="none">
    <ion-icon name="cloud-upload-outline" slot="start"></ion-icon>
    <ion-label class="ion-text-wrap">
      QR code will be available once booking is confirmed online.
    </ion-label>
  </ion-item>
</ng-template>
```

### 8.6 Scope Summary

| E-Receipt operation                   | Offline support                                                        |
| ------------------------------------- | ---------------------------------------------------------------------- |
| Submit walk-in booking                | ✅ Queued locally with `status: paid`                                  |
| View receipt page immediately         | ✅ Renders from local queue payload via router state                   |
| QR code generation                    | ⏳ Hidden until synced — pending banner shown                          |
| PDF generation (`html2canvas` → backend) | ⏳ Runs automatically after sync completes and real ID is available |
| Tourist scans QR to download PDF      | ⏳ Available after sync                                                |

### 8.7 Key Design Decisions

| Decision | Rationale |
| -------- | --------- |
| Queue-first with `status: paid` | Consistent with the rest of the offline module; server receives a normal booking create request on sync |
| Navigate with local data immediately | Operator gets a receipt to show the tourist without waiting for sync |
| QR hidden (not disabled) when offline | A disabled QR is confusing — a pending banner with a clear message is better UX |
| Poll queue every 3s for sync completion | Avoids requiring a manual refresh; receipt page self-updates when online |
| Backend zero changes | `receiptController.generatePdfFromImage()` and PDF endpoints are unchanged |

---

## Phase 9: PWA Asset Caching & Offline Navigation

### 9.1 Problem Solved

After the login → page reload (online) → go offline sequence, navigating to pages such as the e-receipt page from the sidenav failed silently. Background images and Ionicons also failed to load when offline.

### 9.2 Root Cause

The app uses a custom `src/sw.js` registered in `main.ts` — **not** Angular's `ngsw-worker.js`. The original `sw.js` passed all fetches straight through to the network with no caching, so everything failed offline after a reload. The `ngsw-config.json` file exists in the repo with an Ionicons prefetch group (`/svg/**/*.svg`), but `ngsw-worker.js` is not registered anywhere — only `sw.js` is — making that config effectively unused.

### 9.3 Solution: Rewrite `src/sw.js` as Cache-First

**File**: `src/sw.js`

The service worker was rewritten with a cache-first strategy:

- **Install**: calls `skipWaiting()` immediately so the new SW activates without waiting
- **Activate**: clears all old caches except `prewarm-assets-v1`, then calls `clients.claim()`
- **Fetch**:
  - API calls (`/api/`) pass through to the network — no caching
  - All other same-origin requests (JS chunks, HTML, SVGs, images) use cache-first: check cache first, fetch-and-cache on miss, serve `index.html` for navigation failures so the Angular router keeps working offline

Two caches are maintained:

| Cache name          | Populated by                           | Contents                              |
| ------------------- | -------------------------------------- | ------------------------------------- |
| `app-shell-v1`      | Auto-populated on first fetch          | JS chunks, HTML, SVGs, images         |
| `prewarm-assets-v1` | `SyncService.prewarmAssets()` at login | Critical icons, background images     |

`caches.match(event.request)` searches **all** caches, so assets stored in `prewarm-assets-v1` are found and served by the normal fetch handler without any extra logic.

### 9.4 `SyncService` Extensions

**File**: `src/app/services/sync.service.ts`

Two new methods were added (see Phase 4 for full implementation):

**`prewarmCaches()` (public)** — fetches bookings (per_page: 1000), operator's own products, and package companies + their products, storing all results to localStorage caches. Calls `prewarmAssets()` at the end.

**`prewarmAssets()` (private)** — fetches critical assets and stores them in the Cache API under `prewarm-assets-v1`. Also saves the Explore Sabah logo as base64 to `localStorage` for the header logo component.

Critical image assets prewarmed:
- `assets/icon/explore_sabah-without_bg.png`
- `assets/icon/RuralT Logo.png`
- `assets/icon/tree.png`
- `assets/icon/house.png`
- `assets/icon/pakej-removebg-preview.png`
- `assets/mountain.jpg`
- `assets/accom.jpg`
- `assets/package.jpg`

Critical Ionicons SVGs prewarmed (absolute paths, e.g. `/svg/calendar-clear-outline.svg`):
`calendar-clear-outline`, `time-outline`, `grid-outline`, `chevron-back-outline`, `chevron-forward-outline`, `notifications-outline`, `notifications`, `cloud-offline-outline`, `close-circle-outline`, `paper-plane-outline`, `trash-outline`, `add-circle-outline`, `alert-circle-outline`, `alert-circle`, `menu-outline`, `log-out-outline`, `checkmark-circle-outline`, `chevron-down-outline`, `search-outline`, `pencil-outline`, `eye-outline`, `eye-off-outline`

After the sync queue drains, `processQueue()` calls `prewarmCaches()` to refresh all caches. `initialize()` calls `prewarmCaches()` on startup if the device is online.

### 9.5 Login Triggers Pre-Warm

**File**: `src/app/login/login.page.ts`

After a successful login for operator roles, `void this.syncService.prewarmCaches()` is called immediately before navigation. This ensures assets are cached as soon as the operator authenticates, before they navigate to any page that uses them.

### 9.6 E-Receipt Page: Background Images via Blob URLs

**File**: `src/app/e-receipt/e-receipt.page.ts`

Background card images and tile icons are loaded from the Cache API rather than direct asset paths. A `loadBgImages()` method is called in `ngOnInit()`:

1. Opens `prewarm-assets-v1` via `caches.open()`
2. Calls `cache.match()` for each asset URL
3. If found: creates a blob URL via `URL.createObjectURL()` and assigns it to the component property
4. If not found: falls back to the static asset path

Properties managed this way: `activityBgSrc`, `accomBgSrc`, `packageBgSrc`, `treeIconSrc`, `houseIconSrc`, `packageIconSrc`.

This avoids service worker fetch interception for these images before the cache is populated, eliminating the blank-image issue when navigating offline.

### 9.7 Header Logo: Base64 Fallback

**File**: `src/app/_components/header-logo/header-logo.component.ts`

An `exploreSabahLogoSrc` getter was added that reads `localStorage.getItem('explore_sabah_logo')` (a base64 data URL saved by `prewarmAssets()`) and falls back to the static asset path if the key is absent.

### 9.8 Offline Asset Flow (End-to-End)

```
Login
  → prewarmAssets() fetches SVGs + images
  → stores in prewarm-assets-v1 (Cache API)
  → saves Explore Sabah logo as base64 to localStorage

Go offline
  → browser requests /svg/calendar-clear-outline.svg
  → sw.js intercepts
  → caches.match() checks ALL caches including prewarm-assets-v1
  → found → serves it ✓

e-receipt page (offline)
  → loadBgImages() → cache.match('assets/mountain.jpg')
  → found in prewarm-assets-v1
  → URL.createObjectURL(blob) → img src = blob:// URL ✓

Angular navigation (offline)
  → sw.js: navigation fetch fails network
  → falls back to index.html from app-shell-v1 cache
  → Angular router renders the requested page ✓
```

### 9.9 Key Files Changed

| File | Change |
| ---- | ------ |
| `src/sw.js` | Rewritten as cache-first SW with `app-shell-v1` + `prewarm-assets-v1` |
| `src/app/services/sync.service.ts` | Added `CompanyService`/`ProductService` injections, `prewarmCaches()`, `prewarmAssets()` |
| `src/app/login/login.page.ts` | Calls `syncService.prewarmCaches()` after successful operator login |
| `src/app/e-receipt/e-receipt.page.ts` | Added `loadBgImages()` using Cache API blob URLs for background images |
| `src/app/_components/header-logo/header-logo.component.ts` | Added `exploreSabahLogoSrc` getter reading base64 from localStorage |
| `src/app/receipt-activity/receipt-activity.page.ts` | `isLocalOnly` also true when `!networkService.isOnline` |
| `src/app/receipt/receipt.page.ts` | `isLocalOnly` also true when `!networkService.isOnline` |
| `src/app/receipt-package/receipt-package.page.ts` | `isLocalOnly` also true when `!networkService.isOnline` |
| `src/app/booking-home/booking-home.page.ts` | Bookings sorted by `Number(b.id) - Number(a.id)` descending in both load paths |

---

## Negative Scenario Handling

### Full Reference Table

| #                     | Scenario                               | Prevention                                                                                       | Mitigation                                                                   |
| --------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 1                     | Duplicate tap on submit                | `isSubmitting` flag disables button on first tap; `idempotency_key` generated once on form mount | Queue deduplication check; server unique index catches any leaked duplicates |
| 2                     | Two operators edit same booking        | `base_version` captured at form load; version check on server                                    | 409 response → conflict UI shows both versions; operator chooses             |
| 4                     | Partial sync (7/10 succeed)            | Per-item independent status                                                                      | Only failed items remain in queue; success doesn't block others              |
| 5                     | Network drops mid-request              | Queue-first; data safe before any request                                                        | Retry with same `idempotency_key`; server deduplicates                       |
| 6                     | Edit after server deletion             | Cache refresh marks item `conflict` on 404                                                       | Operator sees "booking was deleted" with option to recreate                  |
| 9                     | Infinite retry loop                    | Max 3 retries; exponential backoff                                                               | After 3 failures → `permanently_failed`; manual operator action required     |
| 10                    | Out-of-order sync                      | Operations grouped by `local_booking_id`; processed in sequence                                  | CREATE failure blocks subsequent EDITs for same booking                      |
| 15                    | Silent failures                        | All statuses are visible in UI (badge, banner, list dot)                                         | Persistent (non-dismissable) banner for failed/conflict items                |
| 16                    | OS kills app mid-sync                  | On app open: `resetStaleSyncingItems()` resets `syncing` → `pending`                             | Idempotency key makes re-sending safe                                        |
| 17                    | Duplicate queue entries                | Check by `idempotency_key` before insert; EDIT collapse by `local_booking_id`                    | Dexie transaction ensures atomicity                                          |
| JWT expired           | Token expired during offline period    | Check JWT `exp` before starting sync                                                             | Sync pauses; user prompted to re-login; queue preserved                      |
| Concurrent tabs       | Two browser tabs running sync worker   | `sync_lock` in Dexie (shared IndexedDB); stale lock stolen after 60s                             | Idempotency makes concurrent re-sends safe                                   |
| IndexedDB unavailable | Private mode, iOS storage pressure     | Check availability at init                                                                       | Disable offline mode; show "offline unavailable" banner; submit online only  |
| Edit collapse         | Operator edits same booking 5× offline | Replace existing pending EDIT payload (not add new entry)                                        | Queue stays 1 EDIT per booking; last write is synced                         |

---

## Testing & Validation

### Manual Test Scenarios

**Test 1 — Create while offline**

1. Enable airplane mode
2. Open booking create form
3. Fill form, tap submit
4. Verify: toast says "Saved locally", booking list shows "Pending" badge
5. Re-enable network
6. Verify: badge changes to "Synced", booking appears on server

**Test 2 — Duplicate tap protection**

1. Go offline (or throttle network to very slow)
2. Open booking create form, fill it
3. Tap submit button 5× rapidly
4. Verify: only 1 queue item in IndexedDB
5. Sync: verify only 1 booking on server

**Test 3 — Conflict detection**

1. Open booking #123 in two browser tabs
2. Tab A: edit tourist name → go offline before submitting
3. Tab B: edit phone number → submit while online (version: 0 → 1)
4. Tab A: come back online, sync triggers
5. Verify: Tab A's edit shows "Conflict" status
6. Verify: Conflict UI shows Tab B's version vs Tab A's version
7. Choose "Force my version" → verify booking on server has Tab A's name

**Test 4 — OS kill recovery**

1. Queue 3 bookings while offline
2. Trigger sync (go online), wait for first item to start syncing
3. Force-close the app (simulate OS kill)
4. Reopen app
5. Verify: item that was "syncing" is back to "pending"
6. Verify: sync resumes and all 3 bookings sync successfully

**Test 5 — JWT expiry**

1. Queue 2 bookings offline
2. Manually expire token (or wait for expiry in a test environment)
3. Come online
4. Verify: sync does NOT start, user is redirected to login
5. Re-login
6. Verify: queue picks up, both bookings sync

**Test 6 — Partial sync failure**

1. Queue 5 bookings
2. Intercept API to return 422 for booking #3 only
3. Trigger sync
4. Verify: bookings #1, #2, #4, #5 → "Synced"; booking #3 → "Permanently Failed"
5. Verify: "Needs Attention" banner shows 1 item

**Test 7 — Offline navigation after reload**

1. Login as operator, allow `prewarmCaches()` to complete
2. Hard-reload the page (Ctrl+Shift+R) while online
3. Enable airplane mode
4. Navigate to e-receipt page from the sidenav
5. Verify: page loads correctly with background images and icons ✓
6. Verify: Ionicons render correctly in the header/sidenav ✓

**Test 8 — Asset pre-warm at login**

1. Clear all caches (DevTools → Application → Storage → Clear site data)
2. Login as operator
3. Enable airplane mode immediately after login completes
4. Navigate to the e-receipt page
5. Verify: background images load (served from `prewarm-assets-v1`)
6. Verify: header Explore Sabah logo loads (served from localStorage base64)

### Unit Tests

```typescript
describe("OfflineQueueService", () => {
  it("deduplicates queue entries by idempotency_key", async () => {
    const key = "test-key-001";
    await service.enqueueCreate({ ...payload, idempotency_key: key });
    const before = await service.getAllQueueItems();
    await service.enqueueCreate({ ...payload, idempotency_key: key });
    const after = await service.getAllQueueItems();
    expect(after.length).toBe(before.length);
  });

  it("collapses multiple edits for same booking", async () => {
    await service.enqueueEdit(123, { tourist_full_name: "A" }, 0);
    await service.enqueueEdit(123, { tourist_full_name: "B" }, 0);
    const items = await service.getPendingItems();
    const edits = items.filter((i) => i.local_booking_id === "123");
    expect(edits.length).toBe(1);
    expect(edits[0].payload.tourist_full_name).toBe("B");
  });

  it("resets syncing items on app open", async () => {
    await service.db.offline_booking_queue.add({ ...mockItem, status: "syncing" });
    await service.resetStaleSyncingItems();
    const items = await service.getAllQueueItems();
    expect(items.every((i) => i.status !== "syncing")).toBe(true);
  });
});

describe("SyncService", () => {
  it("blocks EDITs when CREATE for same booking fails", async () => {
    // CREATE fails → EDIT for same local_booking_id should remain 'pending' (blocked)
    // ...
  });

  it("marks item permanently_failed after 3 retries", async () => {
    // simulate 3× 500 responses
    // ...
  });
});
```

---

## Deployment Guide

### Step 1: Install Dependencies

```bash
cd rural-tourism-frontend
npm install dexie uuid @capacitor/network
npm install --save-dev @types/uuid
npx cap sync
```

### Step 2: Create New Services

Create the following files:

- `src/app/services/network.service.ts` (Phase 2)
- `src/app/services/offline-queue.service.ts` (Phase 3)
- `src/app/services/sync.service.ts` (Phase 4)

### Step 3: Initialize in `app.component.ts`

```typescript
async initializeApp() {
  await this.platform.ready();

  // Check IndexedDB availability first
  const available = await this.offlineQueue.isAvailable();
  if (!available) {
    console.warn('IndexedDB unavailable — offline mode disabled');
    // Set a flag to disable offline features
  }

  await this.networkService.initialize();
  await this.syncService.initialize();

  // ...existing init code
}
```

### Step 4: Modify Booking Forms

Update `booking-add.page.ts` and `booking-detail.page.ts` submit handlers (Phase 5).

### Step 5: Update Booking List UI

Add sync badge, persistent banner, and per-row status dots (Phase 6). Add the offline cache load path and offline banner (Phase 7.2).

### Step 6: Create Conflict Resolution Page

```bash
ionic generate page conflict-resolve
```

### Step 7: Wire Up Receipt Offline Caching

Update `booking-home.page.ts` and `booking-detail.page.ts` with the cache read/write logic from Phase 7. No new page is needed.

### Step 8: Deploy Custom Service Worker (Phase 9)

Replace `src/sw.js` with the cache-first implementation. Verify it is the file registered in `main.ts` (not `ngsw-worker.js`). After deployment:

1. Open DevTools → Application → Service Workers
2. Verify the new SW is activated (not waiting)
3. Enable offline mode in DevTools
4. Navigate through all main pages and verify they load from cache

### Step 9: Build and Test

```bash
# Web build
npm run build

# Capacitor sync for mobile
npx cap sync android
npx cap open android
```

### Rollback Plan

The offline module is fully additive — no existing API calls are removed. To disable:

1. Remove `SyncService.initialize()` from `app.component.ts`
2. Revert `booking-add.page.ts` submit handler to direct API call
3. Revert `booking-detail.page.ts` submit handler to direct API call

The IndexedDB stores remain but are inert.

To revert the service worker to pass-through (removes asset caching):

1. Revert `src/sw.js` to the original pass-through implementation
2. Rebuild and redeploy

---

## Appendix: Sync State Machine

```
                    ┌─────────────────┐
         form       │                 │
         submit ──► │    PENDING      │ ◄── reset (app open / stale lock)
                    │                 │
                    └────────┬────────┘
                             │ sync worker picks up item
                             ▼
                    ┌─────────────────┐
                    │                 │
                    │    SYNCING      │
                    │                 │
                    └────────┬────────┘
               ┌─────────────┼──────────────────┐
         200 OK│         5xx/timeout         4xx│(validation)
               ▼                │               ▼
      ┌──────────────┐          │    ┌──────────────────────┐
      │    SYNCED    │   retry  │    │  PERMANENTLY_FAILED  │
      │   (terminal) │  count < 3    │     (terminal)       │
      └──────────────┘    │    │    └──────────────────────┘
                          ▼    │              ▲
                       PENDING │              │ retry count >= 3
                               │              │
                               └──────────────┘

       409 Conflict ──► CONFLICT (terminal — needs operator action)
       404 Not Found ──► CONFLICT (terminal — needs operator action)
```

Operator-initiated transitions from terminal states:

- `CONFLICT` → `PENDING` (operator chooses "force my version")
- `CONFLICT` → `SYNCED` (operator chooses "accept server version")
- `PERMANENTLY_FAILED` → `PENDING` (operator taps "Retry" manually)
