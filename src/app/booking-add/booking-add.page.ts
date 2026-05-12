import { Component, OnInit } from '@angular/core';
import { MenuController, NavController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { BookingService } from '../services/booking.service';
import { MenuItem, MenuService } from '../services/menu.service';
import { ProductService } from '../services/product.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-booking-add',
  templateUrl: './booking-add.page.html',
  styleUrls: ['./booking-add.page.scss'],
})
export class BookingAddPage implements OnInit {
  user: any = null;
  menuItems: MenuItem[] = [];

  selectedType = 'activity';
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
    private menuCtrl: MenuController,
    private navCtrl: NavController,
    private menuService: MenuService,
    private authService: AuthService,
    private bookingService: BookingService,
    private productService: ProductService,
  ) {}

  ngOnInit(): void {
    this.loadUser();
  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, 'booking-add-menu');
    this.loadUser();
  }

  async handleFormSubmit(formType: string, payload: any): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    try {
      const currentUser = this.authService.currentUser;
      const operatorCompanyId =
        currentUser?.company_id !== undefined &&
        currentUser?.company_id !== null
          ? Number(currentUser.company_id)
          : null;

      const createPayload = await this.buildCreatePayload(
        formType,
        payload,
        operatorCompanyId,
      );

      const response = await firstValueFrom(
        this.bookingService.createUnifiedBooking(createPayload),
      );

      console.log(`[booking-add] ${formType} created`, response);
      // Show registration-style success popup, navigate when user confirms
      this.isSuccessAlertOpen = true;
    } catch (error: any) {
      console.error(
        `[booking-add] failed to create ${formType} booking`,
        error,
      );
      alert(error?.error?.message || 'Failed to create booking.');
    } finally {
      this.isSubmitting = false;
    }
  }

  private async buildCreatePayload(
    formType: string,
    payload: any,
    operatorCompanyId: number | null,
  ): Promise<Record<string, unknown>> {
    if (formType === 'package') {
      return this.buildPackagePayload(payload, operatorCompanyId);
    }

    if (formType === 'activity') {
      return this.buildActivityPayload(payload);
    }

    if (formType === 'accommodation') {
      return this.buildAccommodationPayload(payload);
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

    const checkInDate = this.normalizeDateInput(payload.checkInDate);
    const checkOutDate = this.normalizeDateInput(payload.checkOutDate);

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
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      total_of_night:
        payload.nights !== undefined && payload.nights !== ''
          ? Number(payload.nights)
          : undefined,
      total_price: Number(payload.total || 0),
      operator_name: payload.operatorName || '',
    };
  }

  private buildPackagePayload(
    payload: any,
    operatorCompanyId: number | null,
  ): Record<string, unknown> {
    const packageItems = Array.isArray(payload.packageItems)
      ? payload.packageItems.filter((item: any) => item?.companyId)
      : [];

    const totalPrice = packageItems.reduce(
      (sum: number, item: any) => sum + (Number(item.price) || 0),
      0,
    );

    if (!operatorCompanyId) {
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
      operator_name: payload.operatorName || '',
      package_companies: packageItems.map((item: any) => ({
        referrer_id: operatorCompanyId,
        referee_id: Number(item.companyId),
        description: item.description || '',
        per_price: Number(item.price || 0),
      })),
    };
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

    const response = await firstValueFrom(
      this.productService.getProductsByLocation({ page: 1, per_page: 1000 }),
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

  private normalizeDateInput(value: string): string {
    const raw = String(value || '').trim();
    if (!raw) {
      return '';
    }

    const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const day = slashMatch[1].padStart(2, '0');
      const month = slashMatch[2].padStart(2, '0');
      const year = slashMatch[3];
      return `${year}-${month}-${day}`;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return raw;
    }

    return parsed.toISOString().split('T')[0];
  }

  private normalizeTimeInput(value: string): string {
    const raw = String(value || '').trim();
    if (!raw) {
      return '';
    }

    const twentyFourHourMatch = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (twentyFourHourMatch) {
      const hours = Math.min(Number(twentyFourHourMatch[1]), 23);
      const minutes = Math.min(Number(twentyFourHourMatch[2]), 59);
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
        2,
        '0',
      )}`;
    }

    return raw;
  }

  private buildActivityDateTime(
    bookingDate: string,
    bookingTime: string,
  ): string {
    const normalizedDate = this.normalizeDateInput(bookingDate);
    const normalizedTime = this.normalizeTimeInput(bookingTime);

    if (!normalizedDate) {
      return '';
    }

    if (!normalizedTime) {
      return normalizedDate;
    }

    return `${normalizedDate}T${normalizedTime}:00`;
  }

  onMenuItemTap(_item: MenuItem): void {
    this.menuCtrl.close('booking-add-menu');
  }

  logOut(): void {
    this.authService.logout('/login');
    this.user = null;
    this.menuCtrl.enable(false, 'booking-add-menu');
    this.menuCtrl.close('booking-add-menu');
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
}
