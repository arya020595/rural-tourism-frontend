import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuController, NavController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { BookingService } from '../services/booking.service';
import { NetworkService } from '../services/network.service';
import { OfflineQueueService } from '../services/offline-queue.service';
import { ProductService } from '../services/product.service';
import { SyncService } from '../services/sync.service';
import { MenuItem, MenuService } from '../services/menu.service';
import { BookingDetail } from '../booking-home/booking-home.models';

@Component({
  selector: 'app-booking-edit',
  templateUrl: './booking-edit.page.html',
  styleUrls: ['./booking-edit.page.scss'],
})
export class BookingEditPage implements OnInit {
  user: any = null;
  menuItems: MenuItem[] = [];
  booking: BookingDetail | null = null;

  selectedType: 'activity' | 'accommodation' | 'package' = 'activity';
  isSubmitting = false;
  isSuccessAlertOpen = false;
  successAlertButtons = [
    {
      text: 'OK',
      handler: () => {
        this.isSuccessAlertOpen = false;
        this.navCtrl.navigateBack('/booking-home', { replaceUrl: true });
      },
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private menuCtrl: MenuController,
    private menuService: MenuService,
    private authService: AuthService,
    private bookingService: BookingService,
    private productService: ProductService,
    private offlineQueue: OfflineQueueService,
    private syncService: SyncService,
    private networkService: NetworkService,
    private toastCtrl: ToastController,
    private navCtrl: NavController,
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.loadBooking();
    this.syncSelectedType();
  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, 'booking-edit-menu');
    this.loadUser();
    this.loadBooking();
    this.syncSelectedType();
  }

  async handleFormSubmit(formType: string, payload: any): Promise<void> {
    if (this.isSubmitting || !this.booking?.id) {
      return;
    }

    const numericId = this.booking.numericId ?? Number(this.booking.id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      await this.showToast('Cannot edit — booking has no server ID yet.', 'warning');
      return;
    }

    this.isSubmitting = true;

    try {
      const updatePayload = await this.buildUpdatePayload(formType, payload);
      const baseVersion = this.booking.version ?? 0;

      await this.offlineQueue.enqueueEdit(numericId, updatePayload, baseVersion);

      // Update booking_cache immediately so booking-home reflects the edit offline
      if (!this.networkService.isOnline) {
        const cached = await this.offlineQueue.getCachedBookings();
        const existing = cached.find(
          (b: any) => Number(b.id) === numericId || Number(b.numericId) === numericId,
        );
        if (existing) {
          await this.offlineQueue.cacheBookings([{ ...existing, ...updatePayload }]);
        }
      }

      if (this.networkService.isOnline) {
        await this.syncService.triggerSync();
        await this.showToast('Booking updated successfully', 'success');
      } else {
        await this.showToast(
          'No internet. Edit saved locally — will sync when online.',
          'warning',
        );
      }

      this.isSuccessAlertOpen = true;
    } catch (error: any) {
      console.error(`[booking-edit] failed to queue ${formType} edit`, error);
      await this.showToast(
        error?.error?.message || error?.message || 'Failed to save edit. Please try again.',
        'danger',
      );
    } finally {
      this.isSubmitting = false;
    }
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

  onMenuItemTap(_item: MenuItem): void {
    this.menuCtrl.close('booking-edit-menu');
  }

  logOut(): void {
    this.authService.logout('/login');
    this.user = null;
    this.menuCtrl.enable(false, 'booking-edit-menu');
    this.menuCtrl.close('booking-edit-menu');
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.navCtrl.back();
      return;
    }

    this.navCtrl.navigateBack('/booking-home', { replaceUrl: true });
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
      const stateBooking = navigation?.extras?.state?.['booking'];
      this.booking = (stateBooking || history.state?.['booking']) ?? null;
      return;
    }

    this.bookingService.getBookingById(id).subscribe({
      next: (response: any) => {
        const data = response?.data ?? response;
        this.booking = data ? this.mapBookingToDetail(data) : null;
        this.syncSelectedType();
      },
      error: () => {
        const navigation = this.router.getCurrentNavigation();
        const stateBooking = navigation?.extras?.state?.['booking'];
        const fallback = (stateBooking || history.state?.['booking']) ?? null;
        this.booking = fallback ? this.mapBookingToDetail(fallback) : null;
        this.syncSelectedType();
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
      totalDeposit: Number(record?.total_deposit || 0),
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
        String(record?.customer_type || record?.customerType || '')
          .toLowerCase()
          .trim() === 'company'
          ? 'company'
          : 'tourist',
      createdAt: record?.created_at || record?.createdAt,
      updatedAt: record?.updated_at || record?.updatedAt,
      package_companies: Array.isArray(record?.package_companies)
        ? record.package_companies
        : [],
      version:
        record?.version !== undefined ? Number(record.version) : undefined,
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

  private async buildUpdatePayload(
    formType: string,
    payload: any,
  ): Promise<Record<string, unknown>> {
    if (formType === 'package') {
      return this.buildPackageUpdatePayload(payload);
    }

    if (formType === 'activity') {
      return this.buildActivityUpdatePayload(payload);
    }

    if (formType === 'accommodation') {
      return this.buildAccommodationUpdatePayload(payload);
    }

    throw new Error(`Unsupported booking type: ${formType}`);
  }

  private async buildActivityUpdatePayload(
    payload: any,
  ): Promise<Record<string, unknown>> {
    const product = await this.findProductByName(payload.activity, 'activity');

    return {
      booking_type: 'activity',
      customer_type: 'tourist',
      tourist_full_name: payload.fullName || '',
      phone_number: payload.phone || '',
      email: payload.email || '',
      citizenship: payload.nationality || 'domestic',
      no_of_pax_domestik: this.resolveDomesticPax(payload),
      no_of_pax_antarbangsa: this.resolveInternationalPax(payload),
      product_id: product.id,
      product_name: product.name,
      bookingDate: payload.bookingDate,
      bookingTime: payload.bookingTime,
      activity_date: this.buildActivityDateTime(
        payload.bookingDate,
        payload.bookingTime,
      ),
      total_price: Number(payload.total || 0),
      total_deposit: this.normalizeDeposit(payload.totalDeposit),
      operator_name: payload.operatorName || '',
    };
  }

  private async buildAccommodationUpdatePayload(
    payload: any,
  ): Promise<Record<string, unknown>> {
    const product = await this.findProductByName(
      payload.homestay,
      'accommodation',
    );

    return {
      booking_type: 'accommodation',
      customer_type: 'tourist',
      tourist_full_name: payload.fullName || '',
      phone_number: payload.phone || '',
      email: payload.email || '',
      citizenship: payload.nationality || 'domestic',
      no_of_pax_domestik: this.resolveDomesticPax(payload),
      no_of_pax_antarbangsa: this.resolveInternationalPax(payload),
      product_id: product.id,
      product_name: product.name,
      check_in_date: this.normalizeDateInput(payload.checkInDate),
      check_out_date: this.normalizeDateInput(payload.checkOutDate),
      total_of_night:
        payload.nights !== undefined && payload.nights !== ''
          ? Number(payload.nights)
          : undefined,
      total_price: Number(payload.total || 0),
      total_deposit: this.normalizeDeposit(payload.totalDeposit),
      operator_name: payload.operatorName || '',
    };
  }

  private async buildPackageUpdatePayload(
    payload: any,
  ): Promise<Record<string, unknown>> {
    const currentCompanyId = this.getCurrentCompanyId();
    const packageItems = Array.isArray(payload.packageItems)
      ? payload.packageItems.filter((item: any) => item?.companyId)
      : [];

    const totalPrice = packageItems.reduce(
      (sum: number, item: any) => sum + (Number(item.price) || 0),
      0,
    );

    if (!currentCompanyId) {
      throw new Error(
        'Your account does not have a company_id. Package bookings need an operator company.',
      );
    }

    if (packageItems.length === 0 || totalPrice <= 0) {
      throw new Error(
        'Please add at least one package item with a valid price.',
      );
    }

    return {
      booking_type: 'package',
      customer_type: payload.customerType || 'tourist',
      tourist_full_name: payload.fullName || '',
      phone_number: payload.phone || '',
      email: payload.email || '',
      citizenship: payload.nationality || 'domestic',
      no_of_pax_domestik: this.resolveDomesticPax(payload),
      no_of_pax_antarbangsa: this.resolveInternationalPax(payload),
      total_price: totalPrice,
      total_deposit: this.normalizeDeposit(payload.totalDeposit),
      operator_name: payload.operatorName || '',
      package_companies: packageItems.map((item: any) => ({
        referrer_id: currentCompanyId,
        referee_id: Number(item.companyId),
        description: item.description || '',
        per_price: Number(item.price || 0),
      })),
    };
  }

  private normalizeDeposit(value: any): number | undefined {
    if (value === 0) return 0;
    if (value === undefined || value === null) return undefined;
    const raw = String(value).trim();
    if (!raw) return undefined;
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return undefined;
    return Math.trunc(parsed);
  }

  private async findProductByName(
    productName: string,
    productType: 'activity' | 'accommodation',
  ): Promise<{ id: number; name: string }> {
    const normalizedName = String(productName || '')
      .trim()
      .toLowerCase();
    if (!normalizedName) {
      throw new Error('Please select a product from the list.');
    }

    const companyId = this.getCurrentCompanyId();
    if (!companyId) {
      throw new Error('Your account does not have a company_id.');
    }

    const response = await firstValueFrom(
      this.productService.getProductsByCompany(companyId, {
        page: 1,
        per_page: 1000,
      }),
    );
    const products = Array.isArray(response?.data) ? response.data : [];
    const match = products.find((item: any) => {
      const matchesType = item?.product_type === productType;
      const matchesName =
        String(item?.name || '')
          .trim()
          .toLowerCase() === normalizedName;
      return matchesType && matchesName;
    });

    if (!match?.id) {
      throw new Error('Selected product was not found. Please pick from list.');
    }

    return {
      id: Number(match.id),
      name: String(match.name || '').trim(),
    };
  }

  private buildActivityDateTime(dateValue: string, timeValue: string): string {
    const date = this.normalizeDateInput(dateValue);
    const time = this.normalizeTimeInput(timeValue);
    if (!date) {
      return '';
    }
    if (!time) {
      return `${date}T00:00:00`;
    }
    return `${date}T${time}:00`;
  }

  private normalizeTimeInput(value: string): string {
    const text = String(value || '').trim();
    if (!text) return '';
    const match = text.match(
      /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?(?:\s*(AM|PM))?$/i,
    );
    if (!match) return '';
    let hours = Number(match[1]);
    const minutes = String(Number(match[2])).padStart(2, '0');
    const meridiem = match[4]?.toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  private normalizeDateInput(value: string): string {
    const text = String(value || '').trim();
    if (!text) return '';

    const parts = text.includes('-') ? text.split('-') : text.split('/');
    if (parts.length !== 3) return '';

    const [a, b, c] = parts.map((part) => Number(part));
    if ([a, b, c].some((n) => Number.isNaN(n))) return '';

    let day = a;
    let month = b;
    let year = c;

    if (text.includes('-') && a > 1900) {
      year = a;
      month = b;
      day = c;
    }

    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) {
      return '';
    }

    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  private resolveDomesticPax(payload: any): number {
    const nationality = payload?.nationality;
    if (nationality === 'international') {
      return 0;
    }

    if (nationality === 'both') {
      return Number(payload?.domesticPax || 0);
    }

    return Number(payload?.paxCount || 0);
  }

  private resolveInternationalPax(payload: any): number {
    const nationality = payload?.nationality;
    if (nationality === 'domestic') {
      return 0;
    }

    if (nationality === 'both') {
      return Number(payload?.internationalPax || 0);
    }

    return Number(payload?.paxCount || 0);
  }

  private getCurrentCompanyId(): number | null {
    const companyId = this.authService.currentUser?.company_id;
    const normalized = Number(companyId);
    return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
  }

  private syncSelectedType(): void {
    if (!this.booking) {
      return;
    }

    // Editable bookings in this app use the pending state.
    if (this.booking.status !== 'pending' && this.booking.status !== 'booked') {
      this.navCtrl.navigateBack('/booking-home', { replaceUrl: true });
      return;
    }

    this.selectedType = this.normalizeBookingType(this.booking.type);
  }

  private normalizeBookingType(
    bookingType: BookingDetail['type'],
  ): 'activity' | 'accommodation' | 'package' {
    switch (bookingType) {
      case 'Accommodation':
        return 'accommodation';
      case 'Package':
        return 'package';
      default:
        return 'activity';
    }
  }
}
