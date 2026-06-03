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
  @Output() bookingCancel = new EventEmitter<void>();
  @Output() bookingSubmit = new EventEmitter<Record<string, unknown>>();

  selectedNationality = 'domestic';
  checkInDate = '5/03/2026';
  checkOutDate = '7/03/2026';
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

  constructor(
    private productService: ProductService,
    private authService: AuthService,
  ) {}

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
    if (!this.isViewMode && !this.hasValidHomestaySelection()) {
      this.homestaySelectionError =
        'Please select an accommodation from the existing product list.';
      return;
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
    this.paxCount =
      this.booking.domesticPax?.toString() ||
      this.booking.internationalPax?.toString() ||
      '';
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

    // If no check-out selected, default it to check-in +1 day. If existing check-out is before min, bump it.
    if (!this.checkOutDate) {
      this.checkOutDate = this.checkOutMin;
    } else {
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
