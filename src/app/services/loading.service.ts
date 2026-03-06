import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';

/**
 * LoadingService - Centralized loading indicator management
 *
 * Benefits:
 * - Prevents multiple loading spinners from appearing
 * - Consistent loading UX across the app
 * - Observable loading state for reactive components
 */
@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loading: HTMLIonLoadingElement | null = null;
  private loadingCount = 0;

  // Observable loading state for components that need to track it
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private loadingController: LoadingController) {}

  /**
   * Show loading indicator
   * @param message - Optional loading message
   */
  async show(message = 'Please wait...'): Promise<void> {
    this.loadingCount++;
    this.loadingSubject.next(true);

    // Only create a new loading if one doesn't exist
    if (!this.loading) {
      this.loading = await this.loadingController.create({
        message,
        spinner: 'crescent',
        cssClass: 'custom-loading',
        backdropDismiss: false,
      });
      await this.loading.present();
    }
  }

  /**
   * Hide loading indicator
   */
  async hide(): Promise<void> {
    this.loadingCount--;

    // Only dismiss when all loading requests are complete
    if (this.loadingCount <= 0) {
      this.loadingCount = 0;
      this.loadingSubject.next(false);

      if (this.loading) {
        try {
          await this.loading.dismiss();
        } catch {
          // Loading may already be dismissed during rapid calls
        }
        this.loading = null;
      }
    }
  }

  /**
   * Force hide loading (dismiss regardless of count)
   */
  async forceHide(): Promise<void> {
    this.loadingCount = 0;
    this.loadingSubject.next(false);

    if (this.loading) {
      try {
        await this.loading.dismiss();
      } catch {
        // Loading may already be dismissed
      }
      this.loading = null;
    }
  }

  /**
   * Check if loading is currently active
   */
  isLoading(): boolean {
    return this.loadingCount > 0;
  }
}
