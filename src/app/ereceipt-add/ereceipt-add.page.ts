import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MenuController, NavController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { BookingDetail } from '../booking-home/booking-home.models';
import { QuotationService } from '../services/quotation.service';
import { loadQuotationPrefill } from '../utils/quotation-prefill.util';

import { AuthService } from '../services/auth.service';
import { BookingService } from '../services/booking.service';
import { MenuItem, MenuService } from '../services/menu.service';
import { NetworkService } from '../services/network.service';
import { OfflineQueueService } from '../services/offline-queue.service';
import { ProductService } from '../services/product.service';
import { SyncService } from '../services/sync.service';

@Component({
  selector: 'app-ereceipt-add',
  templateUrl: './ereceipt-add.page.html',
  styleUrls: ['./ereceipt-add.page.scss'],
})
export class EreceiptAddPage implements OnInit {
  user: any = null;
  menuItems: MenuItem[] = [];

  bookingType: 'activity' | 'accommodation' | 'package' = 'activity';
  isSubmitting = false;
  // Convert to Receipt from a quotation (?quotation=<id>): the form starts pre-filled
  // and the booking is linked to the quotation on submit.
  prefill: BookingDetail | null = null;
  fromQuotation: { id: number; no: string } | null = null;
  isLoadingQuotation = false;
  // First day of a booking made from a quotation — the receipt's back button
  // opens the booking calendar on it.
  private calendarDate = '';

  typeLabels: Record<string, string> = {
    activity: 'Aktiviti Tarikan',
    accommodation: 'Tempat Penginapan',
    package: 'Pakej Pelancongan',
  };

  constructor(
    private route: ActivatedRoute,
    private menuCtrl: MenuController,
    private navCtrl: NavController,
    private menuService: MenuService,
    private authService: AuthService,
    private bookingService: BookingService,
    private productService: ProductService,
    private offlineQueue: OfflineQueueService,
    private syncService: SyncService,
    private networkService: NetworkService,
    private toastCtrl: ToastController,
    private quotationService: QuotationService,
  ) {}

  ngOnInit(): void {
    const type = this.route.snapshot.paramMap.get('type') as any;
    if (type === 'activity' || type === 'accommodation' || type === 'package') {
      this.bookingType = type;
    }
    this.loadUser();
  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, 'ereceipt-add-menu');
    this.loadUser();
    this.loadQuotationFromQuery();
  }

  private async loadQuotationFromQuery(): Promise<void> {
    const quotationId = Number(this.route.snapshot.queryParamMap.get('quotation'));
    if (!Number.isInteger(quotationId) || quotationId <= 0) {
      this.prefill = null;
      this.fromQuotation = null;
      return;
    }
    if (this.fromQuotation?.id === quotationId) return;

    if (!this.networkService.isOnline) {
      await this.showToast(
        'Perlu internet untuk memuatkan sebut harga / Internet needed to load the quotation.',
        'warning',
      );
      this.navCtrl.navigateBack(`/quotation/${quotationId}`, { replaceUrl: true });
      return;
    }
    this.isLoadingQuotation = true;
    try {
      const loaded = await loadQuotationPrefill(this.quotationService, quotationId, 'receipt');
      if (loaded.bookingType !== this.bookingType) {
        // The quotation decides the type: open the matching e-receipt form.
        this.navCtrl.navigateForward(`/e-receipt/add/${loaded.bookingType}`, {
          queryParams: { quotation: quotationId },
          replaceUrl: true,
        });
        return;
      }
      this.prefill = loaded.prefill;
      this.fromQuotation = { id: loaded.quotationId, no: loaded.quotationNo };
    } catch (error: any) {
      await this.showToast(
        error?.error?.message || 'Gagal memuatkan sebut harga / Failed to load the quotation.',
        'danger',
      );
      this.navCtrl.navigateBack(`/quotation/${quotationId}`, { replaceUrl: true });
    } finally {
      this.isLoadingQuotation = false;
    }
  }

  get pageTitle(): string {
    return this.typeLabels[this.bookingType] ?? 'E-Receipt';
  }

  async handleFormSubmit(formType: string, payload: any): Promise<void> {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    try {
      const currentUser = this.authService.currentUser;
      const operatorCompanyId =
        currentUser?.company_id != null ? Number(currentUser.company_id) : null;

      const createPayload = await this.buildCreatePayload(
        formType,
        payload,
        operatorCompanyId,
      );
      // Links the quotation (marked accepted in the same server transaction).
      if (this.fromQuotation) {
        createPayload['quotation_id'] = this.fromQuotation.id;
        this.calendarDate = this.firstBookingDay(createPayload);
      }

      // Write to queue first — data is safe before any network call
      const idempotencyKey = await this.offlineQueue.enqueueCreate(createPayload);

      // Also write into booking_cache so it shows in booking-home while offline
      if (!this.networkService.isOnline) {
        await this.offlineQueue.cacheBookings([{
          ...createPayload,
          id: idempotencyKey,
          status: 'paid',
          created_at: new Date().toISOString(),
        }]);
      }

      if (this.networkService.isOnline) {
        // Attempt immediate sync so receipt page can get a real server ID
        await this.syncService.triggerSync();

        // After sync, the queue item carries the numeric server booking id.
        // Navigate with that id (not the local UUID) so the QR points at a
        // valid /api/bookings/:id/receipt-pdf URL and the server record's
        // created_at is available for the receipt date.
        const synced = (await this.offlineQueue.getAllQueueItems()).find(
          (i) => i.idempotency_key === idempotencyKey,
        );
        if (synced?.server_booking_id) {
          // Navigate by numeric id WITHOUT the local booking state so the
          // receipt page fetches the server record (which carries created_at /
          // receipt_created_at for the receipt date) instead of rendering the
          // local payload that has no server-generated timestamp.
          this.navigateToReceipt(
            formType,
            String(synced.server_booking_id),
            null,
          );
          return;
        }
      } else {
        await this.showToast(
          'No internet. Receipt saved locally — QR will appear once synced.',
          'warning',
        );
      }

      // Fall back to local data — receipt page handles the QR pending state
      // and will swap in the server id once the booking finishes syncing.
      this.navigateToReceipt(formType, idempotencyKey, {
        ...createPayload,
        idempotency_key: idempotencyKey,
        _isLocalOnly: !this.networkService.isOnline,
      });
    } catch (error: any) {
      console.error('[ereceipt-add] failed to queue booking', error);
      await this.showToast(
        error?.error?.message || 'Failed to save e-receipt booking.',
        'danger',
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  private navigateToReceipt(
    formType: string,
    localRef: string,
    booking: any,
  ): void {
    // When booking is null we navigate by numeric server id and let the
    // receipt page fetch the server record (no local state needed).
    const state = booking
      ? { booking, idempotency_key: booking.idempotency_key }
      : {};
    // From a quotation: the receipt's back button goes to the booking calendar.
    const queryParams = this.fromQuotation
      ? { from: 'quotation', ...(this.calendarDate ? { date: this.calendarDate } : {}) }
      : undefined;

    if (formType === 'activity') {
      this.navCtrl.navigateForward(`/receipt-activity/${localRef}`, {
        state,
        queryParams,
        replaceUrl: true,
      });
      return;
    }

    if (formType === 'accommodation') {
      this.navCtrl.navigateForward(`/receipt/${localRef}`, {
        state,
        queryParams,
        replaceUrl: true,
      });
      return;
    }

    if (formType === 'package') {
      this.navCtrl.navigateForward(`/receipt-package/${localRef}`, {
        state,
        queryParams,
        replaceUrl: true,
      });
    }
  }

  /** Earliest YYYY-MM-DD of the booking (its own date or its package items'). */
  private firstBookingDay(payload: Record<string, any>): string {
    const days: string[] = [];
    const add = (value: unknown) => {
      const day = String(value || '').slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(day)) days.push(day);
    };
    const items = Array.isArray(payload['package_companies']) ? payload['package_companies'] : [];
    if (items.length) {
      items.forEach((item: any) => {
        add(item?.activity_date);
        add(item?.check_in_date);
      });
    } else {
      add(payload['activity_date']);
      add(payload['check_in_date']);
    }
    return days.sort()[0] || '';
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

  private async buildCreatePayload(
    formType: string,
    payload: any,
    operatorCompanyId: number | null,
  ): Promise<Record<string, unknown>> {
    if (formType === 'activity') {
      return this.buildActivityPayload(payload);
    }
    if (formType === 'accommodation') {
      return this.buildAccommodationPayload(payload);
    }
    if (formType === 'package') {
      return this.buildPackagePayload(payload, operatorCompanyId);
    }
    throw new Error(`Unsupported booking type: ${formType}`);
  }

  private async buildActivityPayload(
    payload: any,
  ): Promise<Record<string, unknown>> {
    const product = await this.findProductByName(payload.activity, 'activity');
    const activityDateTime = this.buildActivityDateTime(
      payload.bookingDate,
      payload.bookingTime,
    );

    return {
      booking_type: 'activity',
      customer_type: 'tourist',
      status: 'paid',
      tourist_full_name: payload.fullName || '',
      phone_number: payload.phone || '',
      email: payload.email || '',
      citizenship: payload.nationality || 'domestic',
      no_of_pax_domestik: this.resolveDomesticPax(payload),
      no_of_pax_antarbangsa: this.resolveInternationalPax(payload),
      product_id: product.id,
      product_name: product.name,
      activity_date: activityDateTime,
      total_price: Number(payload.total || 0),
      total_deposit: this.normalizeDeposit(payload.totalDeposit),
      operator_name: payload.operatorName || '',
    };
  }

  private async buildAccommodationPayload(
    payload: any,
  ): Promise<Record<string, unknown>> {
    const product = await this.findProductByName(
      payload.homestay,
      'accommodation',
    );

    return {
      booking_type: 'accommodation',
      customer_type: 'tourist',
      status: 'paid',
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

  private buildPackagePayload(
    payload: any,
    operatorCompanyId: number | null,
  ): Record<string, unknown> {
    if (!operatorCompanyId) {
      throw new Error(
        'Your account does not have a company_id. Package bookings need an operator company.',
      );
    }

    const packageItems = Array.isArray(payload.packageItems)
      ? payload.packageItems.filter((item: any) => item?.companyId)
      : [];

    const totalPrice = packageItems.reduce(
      (sum: number, item: any) => sum + (Number(item.price) || 0),
      0,
    );

    if (packageItems.length === 0 || totalPrice <= 0) {
      throw new Error(
        'Please add at least one package item with a valid price.',
      );
    }

    return {
      booking_type: 'package',
      customer_type: payload.customerType || 'tourist',
      status: 'paid',
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
        referrer_id: operatorCompanyId,
        referee_id: Number(item.companyId),
        description: item.serviceName || item.description || '',
        per_price: Number(item.price || 0),
        // Same item type/dates as booking-add (calendar + receipts).
        product_type: item.productType || null,
        activity_date: item.activityDate
          ? `${item.activityDate}T${item.activityTime || '00:00'}:00`
          : null,
        check_in_date: item.checkInDate || null,
        check_out_date: item.checkOutDate || null,
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
    // Keep cents (e.g. RM3.50); round to 2 decimal places.
    return Math.round(parsed * 100) / 100;
  }

  private async findProductByName(
    productName: string,
    productType: 'activity' | 'accommodation',
  ): Promise<{ id: number; name: string }> {
    const normalizedName = String(productName || '').trim().toLowerCase();
    if (!normalizedName) {
      throw new Error('Please select a product from the list.');
    }

    const findInList = (products: any[]) =>
      products.find(
        (item: any) =>
          item?.product_type === productType &&
          String(item?.name || '').trim().toLowerCase() === normalizedName,
      );

    // Scoped to the operator's own company — a location-wide search would
    // risk matching another company's product of the same name (e.g. two
    // operators in the same district both having a "Kayak" product), which
    // would silently attach the booking to the wrong company's product_id.
    const companyId = this.authService.currentUser?.company_id;

    if (companyId) {
      try {
        const response = await firstValueFrom(
          this.productService.getProductsByCompany(Number(companyId), {
            page: 1,
            per_page: 1000,
          }),
        );
        const products = Array.isArray(response?.data) ? response.data : [];
        const match = findInList(products);
        if (match?.id) {
          return { id: Number(match.id), name: String(match.name || '').trim() };
        }
      } catch {
        // offline — fall through to local cache
      }

      const cached = await this.offlineQueue.getCachedProducts(Number(companyId));
      const match = findInList(cached);
      if (match?.id) {
        return { id: Number(match.id), name: String(match.name || '').trim() };
      }
    }

    throw new Error('Selected product was not found. Please pick from list.');
  }

  private resolveDomesticPax(payload: any): number {
    if (payload?.nationality === 'international') return 0;
    if (payload?.nationality === 'both') return Number(payload?.domesticPax || 0);
    return Number(payload?.paxCount || 0);
  }

  private resolveInternationalPax(payload: any): number {
    if (payload?.nationality === 'domestic') return 0;
    if (payload?.nationality === 'both') return Number(payload?.internationalPax || 0);
    return Number(payload?.paxCount || 0);
  }

  private normalizeDateInput(value: string): string {
    const raw = String(value || '').trim();
    if (!raw) return '';

    const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const day = slashMatch[1].padStart(2, '0');
      const month = slashMatch[2].padStart(2, '0');
      return `${slashMatch[3]}-${month}-${day}`;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    return parsed.toISOString().split('T')[0];
  }

  private buildActivityDateTime(bookingDate: string, bookingTime: string): string {
    const date = this.normalizeDateInput(bookingDate);
    if (!date) return '';

    const raw = String(bookingTime || '').trim();
    const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!match) return date;

    const hh = String(Math.min(Number(match[1]), 23)).padStart(2, '0');
    const mm = String(Math.min(Number(match[2]), 59)).padStart(2, '0');
    return `${date}T${hh}:${mm}:00`;
  }

  onMenuItemTap(_item: MenuItem): void {
    this.menuCtrl.close('ereceipt-add-menu');
  }

  logOut(): void {
    this.authService.logout('/login');
    this.user = null;
    this.menuCtrl.enable(false, 'ereceipt-add-menu');
    this.menuCtrl.close('ereceipt-add-menu');
  }

  goBack(): void {
    // Opened from a quotation (Convert to Receipt): back to that quotation.
    const quotationId = this.quotationIdFromQuery();
    if (quotationId) {
      this.navCtrl.navigateBack(`/quotation/${quotationId}`, { replaceUrl: true });
      return;
    }
    this.navCtrl.navigateBack('/e-receipt', { replaceUrl: true });
  }

  private quotationIdFromQuery(): number | null {
    const id = Number(this.route.snapshot.queryParamMap.get('quotation'));
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  private loadUser(): void {
    this.user = this.authService.currentUser;
    if (!this.user) {
      const raw = localStorage.getItem('user');
      try { this.user = raw ? JSON.parse(raw) : null; } catch { this.user = null; }
    }
    this.menuItems = this.menuService.getVisibleMenuItemsForCurrentUser();
  }
}
