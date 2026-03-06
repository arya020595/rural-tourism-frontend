import { Injectable } from '@angular/core';
import { ToastController, ToastOptions } from '@ionic/angular';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * ToastService - Centralized toast notification management
 *
 * Benefits:
 * - Consistent toast styling across the app
 * - Simple API for common toast operations
 * - Queue management to prevent toast overflow
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastQueue: ToastOptions[] = [];
  private isShowingToast = false;

  constructor(private toastController: ToastController) {}

  /**
   * Show a success toast
   */
  async success(message: string, duration = 2000): Promise<void> {
    await this.show({
      message,
      duration,
      cssClass: 'success-toast',
      icon: 'checkmark-circle',
    });
  }

  /**
   * Show an error toast
   */
  async error(message: string, duration = 3000): Promise<void> {
    await this.show({
      message,
      duration,
      cssClass: 'error-toast',
      icon: 'alert-circle',
    });
  }

  /**
   * Show a warning toast
   */
  async warning(message: string, duration = 3000): Promise<void> {
    await this.show({
      message,
      duration,
      cssClass: 'warning-toast',
      icon: 'warning',
    });
  }

  /**
   * Show an info toast
   */
  async info(message: string, duration = 2500): Promise<void> {
    await this.show({
      message,
      duration,
      cssClass: 'info-toast',
      icon: 'information-circle',
    });
  }

  /**
   * Show a custom toast with full options
   */
  async show(options: ToastOptions): Promise<void> {
    const mergedOptions: ToastOptions = {
      position: 'bottom',
      duration: 2000,
      ...options,
    };

    // Add to queue
    this.toastQueue.push(mergedOptions);

    // Process queue if not already processing
    if (!this.isShowingToast) {
      await this.processQueue();
    }
  }

  /**
   * Process the toast queue
   */
  private async processQueue(): Promise<void> {
    if (this.toastQueue.length === 0) {
      this.isShowingToast = false;
      return;
    }

    this.isShowingToast = true;
    const options = this.toastQueue.shift();

    if (!options) {
      this.isShowingToast = false;
      return;
    }

    try {
      const toast = await this.toastController.create(options);
      await toast.present();

      // Wait for toast to dismiss before showing next
      await toast.onDidDismiss();
    } catch (error) {
      console.error('Error while processing toast queue:', error);
    } finally {
      // Process next toast in queue
      await this.processQueue();
    }
  }

  /**
   * Clear all pending toasts
   */
  clearQueue(): void {
    this.toastQueue = [];
  }
}
