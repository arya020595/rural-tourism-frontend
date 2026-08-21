import { Injectable } from '@angular/core';
import { App } from '@capacitor/app';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { BookingService } from './booking.service';
import { CompanyService } from './company.service';
import { NetworkService } from './network.service';
import { OfflineQueueService, QueueItem } from './offline-queue.service';
import { ProductService } from './product.service';
import { StorageService } from './storage.service';

const MAX_RETRIES = 3;
const SYNC_INTERVAL_MS = 30_000;
const RETRY_DELAYS_MS = [0, 5_000, 30_000];

@Injectable({ providedIn: 'root' })
export class SyncService {
  private isSyncing = false;
  private subscriptions: Subscription[] = [];

  readonly pendingCount$ = new BehaviorSubject<number>(0);

  constructor(
    private offlineQueue: OfflineQueueService,
    private bookingService: BookingService,
    private companyService: CompanyService,
    private productService: ProductService,
    private networkService: NetworkService,
    private storageService: StorageService,
  ) {}

  async initialize(): Promise<void> {
    await this.offlineQueue.resetStaleSyncingItems();
    await this.refreshPendingCount();

    const networkSub = this.networkService.isOnline$
      .pipe(filter((online) => online))
      .subscribe(() => this.triggerSync());
    this.subscriptions.push(networkSub);

    const intervalSub = interval(SYNC_INTERVAL_MS)
      .pipe(filter(() => this.networkService.isOnline))
      .subscribe(() => this.triggerSync());
    this.subscriptions.push(intervalSub);

    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && this.networkService.isOnline) {
        this.triggerSync();
      }
    });

    if (this.networkService.isOnline) {
      this.triggerSync();
      void this.prewarmCaches();
    }
  }

  async triggerSync(): Promise<void> {
    if (this.isSyncing) return;
    if (!this.isTokenValid()) return;

    const lockAcquired = await this.offlineQueue.acquireLock();
    if (!lockAcquired) return;

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

    const groups = this.groupByBookingId(pendingItems);

    for (const [, items] of groups) {
      for (const item of items) {
        await this.processItem(item);

        if (item.operation === 'CREATE' && item.status !== 'synced') {
          break;
        }
      }
    }

    // Re-warm all caches after queue is drained
    if (this.networkService.isOnline) {
      void this.prewarmCaches();
    }
  }

  private async processItem(item: QueueItem): Promise<void> {
    if (item.retry_count > 0) {
      const delay =
        RETRY_DELAYS_MS[Math.min(item.retry_count - 1, RETRY_DELAYS_MS.length - 1)];
      if (delay > 0) await this.sleep(delay);
    }

    await this.offlineQueue.updateItemStatus(item.id!, 'syncing');

    try {
      if (item.operation === 'CREATE') {
        await this.syncCreate(item);
      } else {
        await this.syncEdit(item);
      }
    } catch (err: any) {
      await this.handleSyncError(item, err);
    }
  }

  private async syncCreate(item: QueueItem): Promise<void> {
    const response = await firstValueFrom(
      this.bookingService.createUnifiedBooking(item.payload),
    );
    await this.offlineQueue.updateItemStatus(item.id!, 'synced', {
      server_booking_id: response?.data?.id ?? null,
    });
  }

  private async syncEdit(item: QueueItem): Promise<void> {
    const bookingId = String(item.server_booking_id!);
    await firstValueFrom(
      this.bookingService.updateBooking(bookingId, item.payload),
    );
    await this.offlineQueue.updateItemStatus(item.id!, 'synced');
  }

  private async handleSyncError(item: QueueItem, err: any): Promise<void> {
    const status = err?.status;

    if (status === 404) {
      await this.offlineQueue.updateItemStatus(item.id!, 'conflict', {
        error_message: 'Booking was deleted on the server',
        conflict_data: null,
      });
      if (item.server_booking_id) {
        await this.offlineQueue.removeCachedBooking(item.server_booking_id);
      }
      return;
    }

    if (status === 409) {
      const conflictData = err?.error;
      await this.offlineQueue.updateItemStatus(item.id!, 'conflict', {
        error_message: 'Booking was modified by another user',
        conflict_data: conflictData,
      });
      return;
    }

    if (status >= 400 && status < 500) {
      await this.offlineQueue.updateItemStatus(item.id!, 'permanently_failed', {
        error_message: err?.error?.message || 'Validation error',
        retry_count: item.retry_count + 1,
      });
      return;
    }

    const newRetryCount = item.retry_count + 1;
    if (newRetryCount >= MAX_RETRIES) {
      await this.offlineQueue.updateItemStatus(item.id!, 'permanently_failed', {
        error_message: err?.error?.message || 'Server error after 3 retries',
        retry_count: newRetryCount,
      });
    } else {
      await this.offlineQueue.updateItemStatus(item.id!, 'pending', {
        retry_count: newRetryCount,
        error_message: err?.error?.message || 'Network error',
      });
    }
  }

  async refreshPendingCount(): Promise<void> {
    const pending = await this.offlineQueue.getPendingCount();
    const failed = (await this.offlineQueue.getFailedItems()).length;
    this.pendingCount$.next(pending + failed);
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
    const token = this.storageService.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  private async prewarmAssets(): Promise<void> {
    const criticalAssets = [
      'assets/icon/explore_sabah-without_bg.png',
      'assets/icon/RuralT Logo.png',
      'assets/icon/tree.png',
      'assets/icon/house.png',
      'assets/icon/pakej-removebg-preview.png',
      'assets/mountain.jpg',
      'assets/accom.jpg',
      'assets/package.jpg',
      // Ionicons used in booking forms and nav
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

    // Store in Cache API (large quota, survives offline)
    try {
      const cache = await caches.open('prewarm-assets-v1');
      await Promise.all(
        criticalAssets.map(async (url) => {
          try {
            const existing = await cache.match(url);
            if (existing) return;
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
              console.log(`[prewarm] cached ${url}`);
            }
          } catch (e) {
            console.warn(`[prewarm] failed to cache ${url}:`, e);
          }
        }),
      );
    } catch (e) {
      console.warn('[prewarm] Cache API unavailable:', e);
    }

    // Only save the small PNG logo to localStorage (it's small enough)
    try {
      if (!localStorage.getItem('explore_sabah_logo')) {
        const response = await fetch('assets/icon/explore_sabah-without_bg.png');
        if (response.ok) {
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          if (dataUrl.startsWith('data:')) {
            localStorage.setItem('explore_sabah_logo', dataUrl);
            console.log('[prewarm] cached explore_sabah_logo to localStorage');
          }
        }
      }
    } catch (e) {
      console.warn('[prewarm] failed to cache explore_sabah_logo:', e);
    }
  }

  async prewarmCaches(): Promise<void> {
    if (!this.networkService.isOnline || !this.isTokenValid()) return;

    const user = this.storageService.getUser<any>();
    const userId = user?.id;
    const companyId = user?.company_id ? Number(user.company_id) : null;

    await this.prewarmAssets();

    // The booking/product prefetch below is operator-only. Other user types
    // (association, tourist) lack the permissions for these endpoints, so the
    // calls would 403 and surface a misleading "no permission" toast. Skip them.
    const roleName = String(
      user?.role?.name || user?.role || user?.user_type || '',
    ).toLowerCase();
    const isOperator =
      !!companyId ||
      roleName === 'operator' ||
      roleName === 'operator_admin' ||
      roleName === 'operator_staff';
    if (!isOperator) {
      return;
    }

    // 1. Bookings
    try {
      const params: any = { page: 1, per_page: 1000 };
      if (userId) params.user_id = String(userId);
      const res = await firstValueFrom(this.bookingService.getBookings(params));
      if (Array.isArray(res?.data)) {
        await this.offlineQueue.cacheBookings(res.data);
      }
    } catch { /* non-critical */ }

    // 2. Operator's own products (cached in IndexedDB, not localStorage — the
    //    per-company product lists overflow localStorage's ~5MB quota).
    if (companyId) {
      try {
        const res = await firstValueFrom(
          this.productService.getProductsByCompany(companyId, { per_page: 1000 }),
        );
        if (Array.isArray(res?.data)) {
          await this.offlineQueue.cacheProducts(companyId, res.data);
        }
      } catch { /* non-critical */ }
    }

    // 3. Package companies + their products (all in IndexedDB).
    try {
      const res = await firstValueFrom(this.companyService.getPackageCompanies());
      const companies = Array.isArray(res?.data) ? res.data : [];
      if (companies.length) {
        await this.offlineQueue.cachePackageCompanies(companies);
        for (const company of companies) {
          // Re-checked on every iteration, not just once before the loop
          // started: this loop can run for several seconds (one request per
          // company). If the user logs out partway through, each remaining
          // request was still firing with no token, hitting the interceptor's
          // 401 handler, and popping its own "Session expired" toast — a
          // burst of duplicate toasts right as the login page loads.
          if (!this.isTokenValid()) break;

          const id = Number(company.id);
          if (!id) continue;
          try {
            const pRes = await firstValueFrom(
              this.productService.getProductsByCompany(id, { per_page: 1000 }),
            );
            if (Array.isArray(pRes?.data)) {
              await this.offlineQueue.cacheProducts(id, pRes.data);
            }
          } catch { /* non-critical */ }
        }
      }
    } catch { /* non-critical */ }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  destroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    App.removeAllListeners();
  }
}
