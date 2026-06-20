import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { BookingDetail } from '../../../booking-home/booking-home.models';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-accommodation-booking-form',
  templateUrl: './accommodation-booking-form.component.html',
  styleUrls: ['./accommodation-booking-form.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class AccommodationBookingFormComponent implements OnInit, OnChanges {
  @Input() booking: BookingDetail | null = null;
  @Input() mode: 'add' | 'edit' | 'view' = 'add';
  @Input() hideCancel = false;
  // Shifts the displayed field numbers. booking-add renders a "1. Select Type"
  // field before this form, so its fields start at 2 (offset 0). The e-receipt
  // page has no preceding field, so it passes -1 to start the numbering at 1.
  @Input() numberOffset = 0;
  @Output() bookingCancel = new EventEmitter<void>();
  @Output() bookingSubmit = new EventEmitter<Record<string, unknown>>();

  selectedNationality = 'domestic';
  checkInDate = '';
  checkOutDate = '';
  checkOutMin: string = '';
  fullName = '';
  phone = '';
  email = '';
  paxCount = '';
  domesticPax = '';
  internationalPax = '';
  nights = '';
  homestay = '';
  total = '';
  totalDeposit = '';
  operatorName = '';
  accommodationOptions: string[] = [];
  homestaySelectionError = '';
  emailError = '';
  validationErrors: string[] = [];

  constructor(
    private productService: ProductService,
    private authService: AuthService,
  ) {}

  /** Displayed field number for a given base number, shifted by numberOffset. */
  n(base: number): number {
    return base + this.numberOffset;
  }

  ngOnInit(): void {
    this.loadAccommodationOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['booking'] || changes['mode']) {
      this.applyBooking();
    }
  }

  get isMixedNationality(): boolean {
    return this.selectedNationality === 'both';
  }

  onCancel(): void {
    this.bookingCancel.emit();
  }

  get formTitle(): string {
    return this.mode === 'view'
      ? 'View Accommodation Booking'
      : this.mode === 'edit'
        ? 'Edit Accommodation Booking'
        : 'New Accommodation Booking';
  }

  get submitLabel(): string {
    if (this.mode === 'edit') return 'Kemaskini Tempahan/Update Booking';
    if (this.hideCancel) return 'Hantar/Submit';
    return 'Hantar Tempahan/Submit Booking';
  }

  get isViewMode(): boolean {
    return this.mode === 'view';
  }

  submitForm(): void {
    this.validationErrors = [];
    this.homestaySelectionError = '';
    this.emailError = '';

    if (!this.isViewMode) {
      if (!this.fullName.trim()) this.validationErrors.push('Full name is required.');
      if (!this.phone.trim()) this.validationErrors.push('Phone number is required.');
      if (!this.email.trim()) this.validationErrors.push('Email is required.');
      else if (!this.isValidEmail(this.email)) {
        this.emailError = 'Please enter a valid email address.';
        this.validationErrors.push('Please enter a valid email address.');
      }
      if (!this.paxCount && !this.domesticPax && !this.internationalPax) this.validationErrors.push('Number of pax is required.');
      if (!this.checkInDate) this.validationErrors.push('Check-in date is required.');
      if (!this.checkOutDate) this.validationErrors.push('Check-out date is required.');
      if (!this.nights || Number(this.nights) <= 0) this.validationErrors.push('Number of nights is required.');
      if (!this.total || Number(this.total) <= 0) this.validationErrors.push('Total amount is required.');
      if (!this.operatorName.trim()) this.validationErrors.push('Operator name is required.');
      if (!this.hasValidHomestaySelection()) {
        this.homestaySelectionError = 'Please select an accommodation from the existing product list.';
        this.validationErrors.push('Please select a valid accommodation.');
      }
      if (this.validationErrors.length > 0) return;
    }

    const selectedHomestay = this.getCanonicalOption(
      this.homestay,
      this.accommodationOptions,
    );

    const normalizedCheckIn = this.normalizeDateForInput(this.checkInDate);
    const normalizedCheckOut = this.normalizeDateForInput(this.checkOutDate);

    this.bookingSubmit.emit({
      bookingType: 'accommodation',
      nationality: this.selectedNationality,
      checkInDate: normalizedCheckIn,
      checkOutDate: normalizedCheckOut,
      fullName: this.fullName,
      phone: this.phone,
      email: this.email,
      paxCount: this.paxCount,
      domesticPax: this.domesticPax,
      internationalPax: this.internationalPax,
      nights: this.nights,
      homestay: selectedHomestay,
      total: this.total,
      totalDeposit: this.totalDeposit,
      operatorName: this.operatorName,
    });
  }

  onHomestayInput(): void {
    if (this.homestaySelectionError && this.hasValidHomestaySelection()) {
      this.homestaySelectionError = '';
    }
  }

  private applyBooking(): void {
    if (!this.booking || this.mode === 'add') {
      return;
    }

    this.selectedNationality = this.booking.nationality || 'domestic';
    this.checkInDate = this.normalizeDateForInput(
      this.booking.checkInDate || this.booking.bookedDate || '',
    );
    this.checkOutDate = this.normalizeDateForInput(
      this.booking.checkOutDate || '',
    );
    this.fullName = this.booking.fullName || '';
    this.phone = this.booking.phone || '';
    this.email = this.booking.email || '';
    this.domesticPax = this.booking.domesticPax?.toString() || '';
    this.internationalPax = this.booking.internationalPax?.toString() || '';
    // For a single-nationality booking the pax sits in either domestic or
    // international. Use whichever is non-zero (a plain `||` would treat a
    // domestic value of 0 as truthy via "0" and hide an international count).
    const domesticPaxNum = Number(this.booking.domesticPax || 0);
    const internationalPaxNum = Number(this.booking.internationalPax || 0);
    const singlePax = domesticPaxNum || internationalPaxNum;
    this.paxCount = singlePax ? String(singlePax) : '';
    this.nights = this.booking.nights?.toString() || '';
    this.homestay = this.booking.homestay || '';
    this.total = this.booking.totalAmount?.toString() || '';
    this.totalDeposit = this.booking.totalDeposit?.toString() || '';
    this.operatorName = this.booking.operatorName || '';
    // compute check-out min (next day after check-in)
    const inIso =
      this.normalizeDateForInput(this.checkInDate) || this.checkInDate;
    if (inIso) {
      this.checkOutMin = this.addDaysIso(inIso, 1);
    } else {
      this.checkOutMin = '';
    }
  }

  private loadAccommodationOptions(): void {
    const companyId = this.getCurrentCompanyId();
    if (!companyId) {
      this.accommodationOptions = [];
      return;
    }

    const cacheKey = `products_cache_${companyId}`;

    this.productService
      .getProductsByCompany(companyId, { page: 1, per_page: 1000 })
      .subscribe({
        next: (response) => {
          const products = Array.isArray(response?.data) ? response.data : [];
          localStorage.setItem(cacheKey, JSON.stringify(products));
          const names = products
            .filter((item: any) => item?.product_type === 'accommodation')
            .map((item: any) => String(item?.name || '').trim())
            .filter((name: string) => name.length > 0);

          this.accommodationOptions = this.uniqueSorted(names);
        },
        error: () => {
          const cached = localStorage.getItem(cacheKey);
          const products = cached ? JSON.parse(cached) : [];
          const names = products
            .filter((item: any) => item?.product_type === 'accommodation')
            .map((item: any) => String(item?.name || '').trim())
            .filter((name: string) => name.length > 0);
          this.accommodationOptions = this.uniqueSorted(names);
        },
      });
  }

  private getCurrentCompanyId(): number | null {
    const companyId = this.authService.currentUser?.company_id;
    const normalized = Number(companyId);
    return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
  }

  private hasValidHomestaySelection(): boolean {
    return this.hasExistingOption(this.homestay, this.accommodationOptions);
  }

  private hasExistingOption(value: string, options: string[]): boolean {
    return !!this.getCanonicalOption(value, options);
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  private getCanonicalOption(value: string, options: string[]): string {
    const normalized = String(value || '')
      .trim()
      .toLowerCase();
    if (!normalized) {
      return '';
    }

    return options.find((option) => option.toLowerCase() === normalized) || '';
  }

  private uniqueSorted(items: string[]): string[] {
    return Array.from(new Set(items)).sort((a, b) => a.localeCompare(b));
  }

  onNumericInput(field: string, value: string): void {
    const digits = String(value || '').replace(/\D+/g, '');
    (this as any)[field] = digits;
  }

  onNumericKeydown(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
      'Home',
      'End',
    ];

    const isShortcut =
      (event.ctrlKey || event.metaKey) &&
      ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase());

    if (allowedKeys.includes(event.key) || isShortcut) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onNumericPaste(field: string, event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';
    if (/\D/.test(pastedText)) {
      event.preventDefault();
      const sanitized = pastedText.replace(/\D+/g, '');
      (this as any)[field] = `${(this as any)[field] || ''}${sanitized}`;
    }
  }

  onCheckInChange(value: string): void {
    // Ensure check-in is stored in ISO format when possible
    this.checkInDate = this.normalizeDateForInput(value) || value || '';
    // compute new check-out min = check-in + 1 day
    const inIso =
      this.normalizeDateForInput(this.checkInDate) || this.checkInDate;
    if (inIso) {
      this.checkOutMin = this.addDaysIso(inIso, 1);
    } else {
      this.checkOutMin = '';
    }

    // Leave check-out empty for the user to pick. Only correct an already
    // selected check-out that is now before the minimum (check-in + 1 day).
    if (this.checkOutDate) {
      const outIso =
        this.normalizeDateForInput(this.checkOutDate) || this.checkOutDate;
      if (this.checkOutMin && outIso && outIso < this.checkOutMin) {
        this.checkOutDate = this.checkOutMin;
      }
    }

    // Recalculate nights if both dates present
    this.updateNightsFromDates();
  }

  onCheckOutChange(value: string): void {
    this.checkOutDate = this.normalizeDateForInput(value) || value || '';
    // Ensure check-out respects min; if it's before min, set to min
    if (this.checkOutMin) {
      const outIso =
        this.normalizeDateForInput(this.checkOutDate) || this.checkOutDate;
      if (outIso && outIso < this.checkOutMin) {
        this.checkOutDate = this.checkOutMin;
      }
    }
    // recalc nights
    this.updateNightsFromDates();
  }

  private updateNightsFromDates(): void {
    const inIso =
      this.normalizeDateForInput(this.checkInDate) || this.checkInDate;
    const outIso =
      this.normalizeDateForInput(this.checkOutDate) || this.checkOutDate;
    if (!inIso || !outIso) {
      return;
    }

    const inDate = new Date(inIso + 'T00:00:00');
    const outDate = new Date(outIso + 'T00:00:00');
    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) return;

    const diffMs = outDate.getTime() - inDate.getTime();
    let diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    // Nights should be at least 1 when out >= in
    if (diffDays < 1) diffDays = 1;
    this.nights = String(diffDays);
  }

  private addDaysIso(isoDate: string, days: number): string {
    const d = new Date(isoDate + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private normalizeDateForInput(value: string): string {
    const text = String(value || '').trim();
    if (!text) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const dmy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) {
      const dd = String(Number(dmy[1])).padStart(2, '0');
      const mm = String(Number(dmy[2])).padStart(2, '0');
      const yyyy = dmy[3];
      return `${yyyy}-${mm}-${dd}`;
    }
    const parsed = new Date(text);
    if (!isNaN(parsed.getTime())) {
      const yyyy = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const dd = String(parsed.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return '';
  }

  openDatePicker(input: HTMLInputElement): void {
    if (this.isViewMode) return;
    const withPicker = input as HTMLInputElement & { showPicker?: () => void };
    if (typeof withPicker.showPicker === 'function') {
      withPicker.showPicker();
      return;
    }
    input.focus();
    input.click();
  }
}
