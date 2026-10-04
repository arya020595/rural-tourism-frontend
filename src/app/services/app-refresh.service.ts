import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { NetworkService } from './network.service';
import { SyncService } from './sync.service';

/**
 * Manual "refresh the app" — the installed app has no browser refresh, so
 * this is how users get back to a synced state after being offline. Used by
 * the header refresh button and pull-to-refresh.
 */
@Injectable({ providedIn: 'root' })
export class AppRefreshService {
  constructor(
    private networkService: NetworkService,
    private syncService: SyncService,
    private toastController: ToastController,
  ) {}

  /**
   * Pushes offline-queued bookings to the server, then reloads the app.
   * Returns false (without reloading) when offline, so the caller can reset
   * its spinner — reloading with no connection could leave a blank screen.
   */
  async refresh(): Promise<boolean> {
    if (!this.networkService.isOnline) {
      const toast = await this.toastController.create({
        message:
          'Anda di luar talian / You are offline. Data will sync when you are back online.',
        color: 'warning',
        duration: 3000,
        position: 'top',
      });
      await toast.present();
      return false;
    }

    try {
      // Push queued offline bookings first so nothing is lost by the reload.
      await this.syncService.triggerSync();
    } catch {
      // Failed items stay in the queue and retry automatically; still reload.
    }
    window.location.reload();
    return true;
  }
}
