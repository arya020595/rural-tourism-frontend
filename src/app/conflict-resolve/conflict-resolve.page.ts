import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import { v4 as uuidv4 } from 'uuid';
import { OfflineQueueService, QueueItem } from '../services/offline-queue.service';
import { SyncService } from '../services/sync.service';

@Component({
  selector: 'app-conflict-resolve',
  templateUrl: './conflict-resolve.page.html',
  styleUrls: ['./conflict-resolve.page.scss'],
})
export class ConflictResolvePage implements OnInit {
  queueItem: QueueItem | null = null;
  isResolving = false;

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private offlineQueue: OfflineQueueService,
    private syncService: SyncService,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit(): void {
    this.queueItem = history.state?.['queueItem'] ?? null;
  }

  get myData(): Record<string, any> {
    return this.queueItem?.payload ?? {};
  }

  get serverData(): Record<string, any> | null {
    return this.queueItem?.conflict_data?.['serverData'] ?? null;
  }

  get conflictReason(): string {
    return this.queueItem?.error_message ?? 'Conflict detected';
  }

  get displayFields(): string[] {
    const mine = Object.keys(this.myData);
    const server = this.serverData ? Object.keys(this.serverData) : [];
    const all = new Set([...mine, ...server]);
    // Skip internal sync fields
    const skip = new Set(['idempotency_key', 'base_version']);
    return [...all].filter((k) => !skip.has(k));
  }

  async acceptServerVersion(): Promise<void> {
    if (!this.queueItem?.id || this.isResolving) return;
    this.isResolving = true;

    try {
      await this.offlineQueue.updateItemStatus(this.queueItem.id, 'synced');
      if (this.serverData) {
        await this.offlineQueue.cacheBookings([this.serverData]);
      }
      await this.showToast('Server version accepted', 'success');
      this.navCtrl.back();
    } catch {
      await this.showToast('Failed to resolve conflict. Please try again.', 'danger');
    } finally {
      this.isResolving = false;
    }
  }

  async forceMyVersion(): Promise<void> {
    if (!this.queueItem?.id || this.isResolving) return;
    this.isResolving = true;

    try {
      const serverVersion = this.queueItem.conflict_data?.['serverVersion'] ?? 0;
      const newKey = uuidv4();

      await this.offlineQueue.updateItemStatus(this.queueItem.id, 'pending', {
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
      await this.showToast('Your version is being re-submitted', 'primary');
      this.navCtrl.back();
    } catch {
      await this.showToast('Failed to re-submit. Please try again.', 'danger');
    } finally {
      this.isResolving = false;
    }
  }

  goBack(): void {
    this.navCtrl.back();
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
