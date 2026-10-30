import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  MenuController,
  AlertController,
  ToastController,
  NavController,
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { BookingDetail } from '../booking-home/booking-home.models';
import { BookingStateService } from '../services/booking-state.service';
import { BookingService } from '../services/booking.service';
import { LoadingService } from '../services/loading.service';
import { MenuItem, MenuService } from '../services/menu.service';
import { NetworkService } from '../services/network.service';
import { OfflineQueueService } from '../services/offline-queue.service';
import { ToastService } from '../services/toast.service';
import { NativeDownloadService } from '../services/native-download.service';
import { mapBookingToDetail } from '../utils/booking-detail.mapper';

@Component({
  selector: 'app-booking-detail',
  templateUrl: './booking-detail.page.html',
  styleUrls: ['./booking-detail.page.scss'],
})
export class BookingDetailPage implements OnInit {
  user: any = null;
  menuItems: MenuItem[] = [];
  booking: BookingDetail | null = null;
  isGeneratingPdf = false;
  isOffline = false;
  private fromDashboard = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController,
    private menuCtrl: MenuController,
    private menuService: MenuService,
    private authService: AuthService,
    private bookingService: BookingService,
    private bookingStateService: BookingStateService,
    private loadingService: LoadingService,
    private toastService: ToastService,
    private networkService: NetworkService,
    private offlineQueue: OfflineQueueService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private nativeDownload: NativeDownloadService,
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['booking']) {
      this.booking = navigation.extras.state['booking'];
    }
  }

  ngOnInit(): void {
    this.fromDashboard = this.route.snapshot.queryParamMap.get('from') === 'dashboard';
    // Fall back to BookingStateService if router navigation state was lost
    // (common in Ionic lazy-loaded pages)
    if (!this.booking) {
      this.booking = this.bookingStateService.get();
    }
    this.loadUser();
    this.loadBooking();
  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, 'booking-detail-menu');
    this.loadUser();
    this.loadBooking();
  }

  onMenuItemTap(_item: MenuItem): void {
    this.menuCtrl.close('booking-detail-menu');
  }

  logOut(): void {
    this.authService.logout('/login');
    this.user = null;
    this.menuCtrl.enable(false, 'booking-detail-menu');
    this.menuCtrl.close('booking-detail-menu');
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.navCtrl.back();
      return;
    }

    this.navCtrl.navigateRoot(this.fromDashboard ? '/home' : '/booking-home');
  }

  async cancelBooking(): Promise<void> {
    if (!this.booking || this.booking.isLegacy) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Cancel Booking',
      message: 'Are you sure you want to cancel this booking?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
        },
        {
          text: 'Yes, Cancel It',
          handler: async () => {
            await this.loadingService.show('Cancelling booking...');
            this.bookingService
              .cancelBooking(String(this.booking!.id))
              .subscribe({
                next: async () => {
                  this.booking = {
                    ...this.booking!,
                    status: 'cancelled',
                  };
                  // Record the change so the booking list shows the "Synced"
                  // indicator, consistent with other status changes.
                  await this.offlineQueue.recordSyncedEdit(
                    this.booking.numericId ?? Number(this.booking.id),
                    { status: 'cancelled' },
                  );
                  await this.loadingService.hide();
                  // Stay on this page (like Recall) — it switches to the
                  // cancelled status and buttons; the user goes back when
                  // they choose to.
                  await this.toastService.success(
                    'Booking cancelled successfully',
                  );
                },
                error: async (error) => {
                  await this.loadingService.hide();
                  await this.toastService.error(
                    error?.error?.message || 'Failed to cancel booking',
                  );
                },
              });
          },
        },
      ],
    });

    await alert.present();
  }

  async recallBooking(): Promise<void> {
    if (!this.booking || this.booking.status !== 'paid' || this.booking.isLegacy) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Recall Booking',
      message:
        'Recall this booking back to Pending? The receipt will be removed and the booking can be edited again.',
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Yes, Recall',
          handler: async () => {
            await this.loadingService.show('Recalling booking...');
            this.bookingService.recallBooking(String(this.booking!.id)).subscribe({
              next: async () => {
                this.booking = { ...this.booking!, status: 'pending' };
                await this.offlineQueue.recordSyncedEdit(
                  this.booking.numericId ?? Number(this.booking.id),
                  { status: 'pending' },
                );
                await this.loadingService.hide();
                await this.toastService.success('Booking recalled to pending');
              },
              error: async (error) => {
                await this.loadingService.hide();
                await this.toastService.error(
                  error?.error?.message || 'Failed to recall booking',
                );
              },
            });
          },
        },
      ],
    });

    await alert.present();
  }

  editBooking(): void {
    if (!this.booking || this.booking.status !== 'pending' || this.booking.isLegacy) {
      return;
    }

    this.router.navigate(['/booking-home/edit', this.booking.id], {
      state: { booking: this.booking },
    });
  }

  async generatePdf(): Promise<void> {
    const toast = await this.toastCtrl.create({
      message:
        'Generate PDF is not linked here. Use the Payment Receipt button to process payment and view receipt.',
      duration: 2500,
      color: 'warning',
    });
    await toast.present();
  }

  canCancel(): boolean {
    return this.booking?.status === 'pending';
  }

  canEdit(): boolean {
    return this.booking?.status === 'pending';
  }

  canPayment(): boolean {
    return (
      this.booking?.status === 'pending' || this.booking?.status === 'booked'
    );
  }

  get bookingMode(): 'view' {
    return 'view';
  }

  get bookingType(): 'activity' | 'accommodation' | 'package' | null {
    if (!this.booking) {
      return null;
    }

    switch (this.booking.type) {
      case 'Accommodation':
        return 'accommodation';
      case 'Package':
        return 'package';
      default:
        return 'activity';
    }
  }

  private getReceiptRouteForBooking(): string {
    switch (this.bookingType) {
      case 'accommodation':
        return '/receipt';
      case 'package':
        return '/receipt-package';
      default:
        return '/receipt-activity';
    }
  }

  async goToReceipt(): Promise<void> {
    if (!this.booking || this.booking.isLegacy) {
      return;
    }

    const receiptId = this.booking.numericId ?? Number(this.booking.id);
    if (!Number.isFinite(receiptId)) {
      this.toastService.error('Receipt ID is not available for this booking.');
      return;
    }

    if (this.booking.status !== 'paid') {
      if (!this.networkService.isOnline) {
        const serverBookingId = this.booking.numericId ?? Number(this.booking.id);
        const baseVersion = this.booking.version ?? 0;
        await this.offlineQueue.enqueueEdit(serverBookingId, { status: 'paid' }, baseVersion);
        this.booking = { ...this.booking, status: 'paid' };
        // Update booking_cache so booking-home reflects the paid status offline
        const cached = await this.offlineQueue.getCachedBookings();
        const existing = cached.find(
          (b: any) => Number(b.id) === serverBookingId || Number(b.numericId) === serverBookingId,
        );
        if (existing) {
          await this.offlineQueue.cacheBookings([{ ...existing, status: 'paid' }]);
        }
        await this.toastService.success('Payment queued — will sync when back online.');
      } else {
        try {
          await this.loadingService.show('Updating payment status...');
          const response = await firstValueFrom(
            this.bookingService.markBookingAsPaid(String(this.booking.id)),
          );
          const data = response?.data ?? response;
          this.booking = data ? mapBookingToDetail(data) : this.booking;
          // Record the change so the booking list shows the "Synced" indicator,
          // consistent with edits made through the offline queue.
          await this.offlineQueue.recordSyncedEdit(
            this.booking.numericId ?? Number(this.booking.id),
            { status: 'paid' },
          );
        } catch (error) {
          await this.loadingService.hide();
          const err = error as any;
          this.toastService.error(
            err?.error?.message || 'Failed to mark booking as paid.',
          );
          return;
        } finally {
          await this.loadingService.hide();
        }
      }
    }

    const receiptRoute = this.getReceiptRouteForBooking();
    this.router.navigate([receiptRoute, receiptId], {
      state: { booking: this.booking },
    });
  }

  async viewPaymentReceipt(): Promise<void> {
    if (this.isGeneratingPdf || this.booking?.isLegacy) {
      return;
    }
    if (!this.booking?.numericId) {
      this.toastService.error('PDF receipt is not available for this booking.');
      return;
    }

    this.isGeneratingPdf = true;
    try {
      await this.loadingService.show('Menjana PDF / Generating PDF...');
      const blob = await firstValueFrom(
        this.bookingService.downloadBookingPdf(this.booking.numericId),
      );
      await this.nativeDownload.downloadBlob(
        blob,
        `booking-${this.booking.id ?? this.booking.numericId}.pdf`,
      );
    } catch (err) {
      console.error('Failed to download booking PDF:', err);
      this.toastService.error(
        'Failed to download the booking PDF. Please try again.',
      );
    } finally {
      await this.loadingService.hide();
      this.isGeneratingPdf = false;
    }
  }

  /**
   * Download the payment receipt PDF directly (the same document the receipt
   * QR code links to), so operators don't have to show the QR to the customer.
   * Only used for paid bookings.
   */
  async downloadReceiptPdf(): Promise<void> {
    if (this.isGeneratingPdf || this.booking?.isLegacy) {
      return;
    }
    if (!this.booking?.numericId) {
      this.toastService.error('PDF receipt is not available for this booking.');
      return;
    }

    this.isGeneratingPdf = true;
    try {
      await this.loadingService.show('Menjana PDF / Generating PDF...');
      const blob = await firstValueFrom(
        this.bookingService.downloadReceiptPdf(this.booking.numericId),
      );
      await this.nativeDownload.downloadBlob(
        blob,
        `receipt-${this.booking.id ?? this.booking.numericId}.pdf`,
      );
    } catch (err) {
      console.error('Failed to download receipt PDF:', err);
      this.toastService.error(
        'Failed to download the receipt PDF. Please try again.',
      );
    } finally {
      await this.loadingService.hide();
      this.isGeneratingPdf = false;
    }
  }

  private loadUser(): void {
    const rawUser = localStorage.getItem('user');
    this.user = this.authService.currentUser;

    if (!this.user && rawUser) {
      try {
        this.user = JSON.parse(rawUser);
      } catch {
        this.user = null;
      }
    }

    this.menuItems =
      this.menuService.getVisibleMenuItemsForCurrentUser();
  }

  private loadBooking(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      const navigation = this.router.getCurrentNavigation();
      this.booking =
        navigation?.extras?.state?.['booking'] ??
        history.state?.['booking'] ??
        null;
      return;
    }

    if (!this.networkService.isOnline) {
      this.loadBookingFromCache(id);
      return;
    }

    this.bookingService.getBookingById(id).subscribe({
      next: async (response: any) => {
        const data = response?.data ?? response;
        this.booking = data ? mapBookingToDetail(data) : null;
        this.isOffline = false;
        if (this.booking && data) {
          await this.offlineQueue.cacheBookings([data]);
        }
      },
      error: () => {
        this.loadBookingFromCache(id);
      },
    });
  }

  private async loadBookingFromCache(id: string): Promise<void> {
    const cached = await this.offlineQueue.getCachedBookings();
    const match = cached.find(
      (b: any) => String(b.id) === id || String(b.numericId) === id,
    );

    if (match) {
      this.booking = mapBookingToDetail(match);
      this.isOffline = true;
      return;
    }

    const stateBooking = history.state?.['booking'] ?? null;
    this.booking = stateBooking ? mapBookingToDetail(stateBooking) : null;
    this.isOffline = true;
  }

}
