import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  MenuController,
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { BookingDetail } from '../booking-home/booking-home.models';
import { BookingStateService } from '../services/booking-state.service';
import { BookingService } from '../services/booking.service';
import { LoadingService } from '../services/loading.service';
import { MenuItem, MenuService } from '../services/menu.service';
import { ToastService } from '../services/toast.service';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private menuCtrl: MenuController,
    private menuService: MenuService,
    private authService: AuthService,
    private bookingService: BookingService,
    private bookingStateService: BookingStateService,
    private loadingService: LoadingService,
    private toastService: ToastService,
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['booking']) {
      this.booking = navigation.extras.state['booking'];
    }
  }

  ngOnInit(): void {
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
    this.router.navigate(['/booking-home']);
  }

  editBooking(): void {
    if (!this.booking || this.booking.status !== 'pending') {
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

  async viewPaymentReceipt(): Promise<void> {
    if (this.isGeneratingPdf) {
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
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `booking-${this.booking.id ?? this.booking.numericId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(anchor);
      }, 100);
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
      this.menuService.getVisibleMenuItemsForContext('operator_admin');
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

    this.bookingService.getBookingById(id).subscribe({
      next: (response: any) => {
        const data = response?.data ?? response;
        this.booking = data ? this.mapBookingToDetail(data) : null;
      },
      error: () => {
        const navigation = this.router.getCurrentNavigation();
        const fallback =
          navigation?.extras?.state?.['booking'] ??
          history.state?.['booking'] ??
          null;
        this.booking = fallback ? this.mapBookingToDetail(fallback) : null;
      },
    });
  }

  private mapBookingToDetail(record: any): BookingDetail {
    const bookingType = String(record?.booking_type || '').toLowerCase();
    const type =
      bookingType === 'accommodation'
        ? 'Accommodation'
        : bookingType === 'package'
          ? 'Package'
          : 'Activity';

    return {
      id: String(record?.id || ''),
      bookedDate: String(
        record?.activity_date ||
          record?.check_in_date ||
          record?.receipt_created_at ||
          record?.created_at ||
          record?.updated_at ||
          '',
      ).slice(0, 10),
      serviceName:
        type === 'Package'
          ? String(record?.product_name || 'Package')
          : String(record?.product_name || record?.serviceName || ''),
      type,
      status: String(
        record?.status || 'pending',
      ).toLowerCase() as BookingDetail['status'],
      time: this.formatTime(
        record?.activity_time || record?.time || record?.activity_date,
      ),
      fullName: String(record?.tourist_full_name || ''),
      phone: String(
        record?.phone_number || record?.phone || record?.contact_phone || '',
      ),
      email: String(record?.email || record?.contact_email || ''),
      nationality:
        String(record?.citizenship || '').toLowerCase() === 'international'
          ? 'international'
          : String(record?.citizenship || '').toLowerCase() === 'both'
            ? 'both'
            : 'domestic',
      domesticPax: Number(record?.no_of_pax_domestik || 0),
      internationalPax: Number(record?.no_of_pax_antarbangsa || 0),
      totalAmount: Number(record?.total_price || 0),
      operatorName: String(record?.operator_name || ''),
      activityName:
        type === 'Activity' ? String(record?.product_name || '') : undefined,
      checkInDate:
        type === 'Accommodation'
          ? String(record?.check_in_date || '').slice(0, 10)
          : undefined,
      checkOutDate:
        type === 'Accommodation'
          ? String(record?.check_out_date || '').slice(0, 10)
          : undefined,
      nights:
        type === 'Accommodation'
          ? Number(record?.total_of_night || 0)
          : undefined,
      homestay:
        type === 'Accommodation'
          ? String(record?.product_name || '')
          : undefined,
      packageName:
        type === 'Package'
          ? String(record?.product_name || 'Package')
          : undefined,
      packagePrice:
        type === 'Package' ? Number(record?.total_price || 0) : undefined,
      customerType:
        String(record?.citizenship || '').toLowerCase() === 'company'
          ? 'company'
          : 'tourist',
      createdAt: record?.created_at || record?.createdAt,
      updatedAt: record?.updated_at || record?.updatedAt,
      package_companies: Array.isArray(record?.package_companies)
        ? record.package_companies
        : [],
    };
  }

  private formatTime(value: any): string | undefined {
    const raw = String(value || '').trim();
    if (!raw) {
      return undefined;
    }

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return raw || undefined;
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
