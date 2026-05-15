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
  selector: 'app-activity-booking-form',
  templateUrl: './activity-booking-form.component.html',
  styleUrls: ['./activity-booking-form.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class ActivityBookingFormComponent implements OnInit, OnChanges {
  @Input() booking: BookingDetail | null = null;
  @Input() mode: 'add' | 'edit' | 'view' = 'add';
  @Output() bookingCancel = new EventEmitter<void>();
  @Output() bookingSubmit = new EventEmitter<Record<string, unknown>>();

  selectedNationality = 'domestic';
  bookingDate = '12/03/2026';
  bookingTime = '';
  fullName = '';
  phone = '';
  email = '';
  paxCount = '';
  domesticPax = '';
  internationalPax = '';
  activity = '';
  total = '';
  operatorName = '';
  activityOptions: string[] = [];
  activitySelectionError = '';

  constructor(
    private productService: ProductService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadActivityOptions();
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
      ? 'View Activity Booking'
      : this.mode === 'edit'
        ? 'Edit Activity Booking'
        : 'New Activity Booking';
  }

  get submitLabel(): string {
    return this.mode === 'edit'
      ? 'Kemaskini Tempahan/Update Booking'
      : 'Hantar Tempahan/Submit Booking';
  }

  get isViewMode(): boolean {
    return this.mode === 'view';
  }

  submitForm(): void {
    if (!this.isViewMode && !this.hasValidActivitySelection()) {
      this.activitySelectionError =
        'Please select an activity from the existing product list.';
      return;
    }

    const selectedActivity = this.getCanonicalOption(
      this.activity,
      this.activityOptions,
    );
    const normalizedTime = this.normalizeTimeForInput(this.bookingTime);

    const normalizedDate = this.normalizeDateForInput(this.bookingDate);

    this.bookingSubmit.emit({
      bookingType: 'activity',
      nationality: this.selectedNationality,
      bookingDate: normalizedDate,
      bookingTime: normalizedTime,
      fullName: this.fullName,
      phone: this.phone,
      email: this.email,
      paxCount: this.paxCount,
      domesticPax: this.domesticPax,
      internationalPax: this.internationalPax,
      activity: selectedActivity,
      total: this.total,
      operatorName: this.operatorName,
    });
  }

  onActivityInput(): void {
    if (this.activitySelectionError && this.hasValidActivitySelection()) {
      this.activitySelectionError = '';
    }
  }

  openTimePicker(input: HTMLInputElement): void {
    if (this.isViewMode) {
      return;
    }

    const withPicker = input as HTMLInputElement & {
      showPicker?: () => void;
    };

    if (typeof withPicker.showPicker === 'function') {
      withPicker.showPicker();
      return;
    }

    input.focus();
    input.click();
  }

  private applyBooking(): void {
    if (!this.booking || this.mode === 'add') {
      return;
    }

    this.selectedNationality = this.booking.nationality || 'domestic';
    this.bookingDate = this.normalizeDateForInput(
      this.booking.bookedDate || '',
    );
    this.bookingTime = this.normalizeTimeForInput(this.booking.time || '');
    this.fullName = this.booking.fullName || '';
    this.phone = this.booking.phone || '';
    this.email = this.booking.email || '';
    this.domesticPax = this.booking.domesticPax?.toString() || '';
    this.internationalPax = this.booking.internationalPax?.toString() || '';
    this.paxCount =
      this.booking.domesticPax?.toString() ||
      this.booking.internationalPax?.toString() ||
      '';
    this.activity = this.booking.activityName || this.booking.serviceName || '';
    this.total = this.booking.totalAmount?.toString() || '';
    this.operatorName = this.booking.operatorName || '';
  }

  private loadActivityOptions(): void {
    const companyId = this.getCurrentCompanyId();
    if (!companyId) {
      this.activityOptions = [];
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
            .filter((item: any) => item?.product_type === 'activity')
            .map((item: any) => String(item?.name || '').trim())
            .filter((name: string) => name.length > 0);

          this.activityOptions = this.uniqueSorted(names);
        },
        error: () => {
          const cached = localStorage.getItem(cacheKey);
          const products = cached ? JSON.parse(cached) : [];
          const names = products
            .filter((item: any) => item?.product_type === 'activity')
            .map((item: any) => String(item?.name || '').trim())
            .filter((name: string) => name.length > 0);
          this.activityOptions = this.uniqueSorted(names);
        },
      });
  }

  private getCurrentCompanyId(): number | null {
    const companyId = this.authService.currentUser?.company_id;
    const normalized = Number(companyId);
    return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
  }

  private hasValidActivitySelection(): boolean {
    return this.hasExistingOption(this.activity, this.activityOptions);
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

  private normalizeDateForInput(value: string): string {
    const text = String(value || '').trim();
    if (!text) return '';

    // If already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

    // Try DD/MM/YYYY or D/M/YYYY
    const dmy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) {
      const dd = String(Number(dmy[1])).padStart(2, '0');
      const mm = String(Number(dmy[2])).padStart(2, '0');
      const yyyy = dmy[3];
      return `${yyyy}-${mm}-${dd}`;
    }

    // Fallback try Date parsing
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

  private normalizeTimeForInput(value: string): string {
    const text = String(value || '').trim();
    if (!text) {
      return '';
    }

    const twentyFourHourMatch = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (twentyFourHourMatch) {
      const hours = Math.min(Number(twentyFourHourMatch[1]), 23);
      const minutes = Math.min(Number(twentyFourHourMatch[2]), 59);
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    const meridiemMatch = text.match(/^\s*(\d{1,2}):(\d{2})\s*([AP]M)\s*$/i);
    if (meridiemMatch) {
      let hours = Number(meridiemMatch[1]);
      const minutes = Math.min(Number(meridiemMatch[2]), 59);
      const period = meridiemMatch[3].toUpperCase();

      if (period === 'PM' && hours < 12) {
        hours += 12;
      }
      if (period === 'AM' && hours === 12) {
        hours = 0;
      }

      return `${String(Math.min(hours, 23)).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    return text;
  }
}
