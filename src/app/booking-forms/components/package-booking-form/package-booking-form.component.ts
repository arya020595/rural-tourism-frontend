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
import { CompanyService } from '../../../services/company.service';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-package-booking-form',
  templateUrl: './package-booking-form.component.html',
  styleUrls: ['./package-booking-form.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class PackageBookingFormComponent implements OnInit, OnChanges {
  @Input() booking: BookingDetail | null = null;
  @Input() mode: 'add' | 'edit' | 'view' = 'add';
  @Input() hideCancel = false;
  // Shifts the displayed field numbers. booking-add renders a "1. Select Type"
  // field before this form, so its numbered fields start at 3 (offset 0). The
  // e-receipt page has no preceding field, so it passes -1; the customer-type
  // selector then becomes "1." and the rest start at 2.
  @Input() numberOffset = 0;
  @Output() bookingCancel = new EventEmitter<void>();
  @Output() bookingSubmit = new EventEmitter<Record<string, unknown>>();

  customerType = 'tourist';
  selectedNationality = 'domestic';
  fullName = '';
  phone = '';
  email = '';
  emailError = '';
  validationErrors: string[] = [];
  paxCount = '';
  domesticPax = '';
  internationalPax = '';
  bookingDate = '';
  packageName = '';
  packagePrice = '';
  totalDeposit = '';
  serviceName = '';
  operatorName = '';
  // Dynamic package items (company selection + price + description)
  companies: Array<{ id: number; name: string }> = [];
  serviceOptionsByCompanyId: Record<
    number,
    Array<{ id: number; name: string }>
  > = {};
  companySearchText: Record<number, string> = {};
  filteredCompanies: Record<number, Array<{ id: number; name: string }>> = {};
  showCompanyDropdown: Record<number, boolean> = {};
  serviceSearchText: Record<number, string> = {};
  filteredServices: Record<number, Array<{ id: number; name: string }>> = {};
  showServiceDropdown: Record<number, boolean> = {};
  packageItems: Array<{
    companyId?: number;
    serviceName?: string;
    price?: string;
    description?: string;
  }> = [{ companyId: undefined, price: '', description: '' }];

  constructor(
    private companyService: CompanyService,
    private productService: ProductService,
  ) {}

  /** Displayed field number for a given base number, shifted by numberOffset. */
  n(base: number): number {
    return base + this.numberOffset;
  }

  /**
   * Number for the customer-type selector. It sits immediately before field 3,
   * so it is one less than n(3): "2" on the booking pages (after their
   * "1. Select Type" field) and "1" on the e-receipt page (numberOffset -1).
   */
  get customerTypeNumber(): number {
    return this.n(3) - 1;
  }

  ngOnInit(): void {
    this.loadCompanies();
  }

  addPackageItem(): void {
    const newIndex = this.packageItems.length;
    this.packageItems.push({
      companyId: undefined,
      serviceName: '',
      price: '',
      description: '',
    });
    this.companySearchText[newIndex] = '';
    this.filteredCompanies[newIndex] = [...this.companies];
    this.showCompanyDropdown[newIndex] = false;
    this.serviceSearchText[newIndex] = '';
    this.filteredServices[newIndex] = [];
    this.showServiceDropdown[newIndex] = false;
  }

  removePackageItem(index: number): void {
    this.packageItems.splice(index, 1);
  }

  onCompanySearchChange(index: number, searchText: string): void {
    this.companySearchText[index] = searchText;
    this.showCompanyDropdown[index] = true;

    if (!searchText.trim()) {
      this.filteredCompanies[index] = [...this.companies];
    } else {
      const lowerSearch = searchText.toLowerCase();
      this.filteredCompanies[index] = this.companies.filter((c) =>
        c.name.toLowerCase().includes(lowerSearch),
      );
    }
  }

  selectCompany(index: number, company: { id: number; name: string }): void {
    const item = this.packageItems[index];
    if (!item) {
      return;
    }

    item.companyId = company.id;
    this.companySearchText[index] = company.name;
    this.showCompanyDropdown[index] = false;
    item.serviceName = '';
    item.description = '';
    this.serviceSearchText[index] = '';
    this.showServiceDropdown[index] = false;

    // Always reload from API when the user actively picks a company — clears
    // any synthetic seed that was pre-populated from existing booking data.
    const existing = this.serviceOptionsByCompanyId[company.id];
    const isSyntheticOnly =
      existing?.length === 1 && existing[0]?.id === 0;
    if (company.id && (!existing || isSyntheticOnly)) {
      delete this.serviceOptionsByCompanyId[company.id];
      this.loadServicesForCompany(company.id, index);
    } else if (company.id) {
      this.filteredServices[index] = [
        ...(this.serviceOptionsByCompanyId[company.id] || []),
      ];
    }
  }

  onCompanySearchFocus(index: number): void {
    this.showCompanyDropdown[index] = true;
    if (!this.filteredCompanies[index]) {
      this.filteredCompanies[index] = [...this.companies];
    }
  }

  onCompanySearchBlur(index: number): void {
    setTimeout(() => {
      this.showCompanyDropdown[index] = false;
    }, 200);
  }

  getFilteredCompanies(index: number): Array<{ id: number; name: string }> {
    return this.filteredCompanies[index] || [];
  }

  getCompanySearchText(index: number): string {
    return this.companySearchText[index] || '';
  }

  onServiceSearchChange(index: number, searchText: string): void {
    this.serviceSearchText[index] = searchText;
    this.showServiceDropdown[index] = true;

    const companyId = Number(this.packageItems[index]?.companyId || 0);
    const allServices = this.serviceOptionsByCompanyId[companyId] || [];

    if (!searchText.trim()) {
      this.filteredServices[index] = [...allServices];
    } else {
      const lowerSearch = searchText.toLowerCase();
      this.filteredServices[index] = allServices.filter((s) =>
        s.name.toLowerCase().includes(lowerSearch),
      );
    }
  }

  selectService(index: number, service: { id: number; name: string }): void {
    const item = this.packageItems[index];
    if (!item) {
      return;
    }

    item.serviceName = service.name;
    item.description = service.name;
    this.serviceSearchText[index] = service.name;
    this.showServiceDropdown[index] = false;
  }

  onServiceSearchFocus(index: number): void {
    this.showServiceDropdown[index] = true;
    const companyId = Number(this.packageItems[index]?.companyId || 0);
    if (!this.filteredServices[index] && companyId) {
      this.filteredServices[index] = [
        ...(this.serviceOptionsByCompanyId[companyId] || []),
      ];
    }
  }

  onServiceSearchBlur(index: number): void {
    setTimeout(() => {
      this.showServiceDropdown[index] = false;
    }, 200);
  }

  getFilteredServices(index: number): Array<{ id: number; name: string }> {
    return this.filteredServices[index] || [];
  }

  getServiceSearchText(index: number): string {
    return this.serviceSearchText[index] || '';
  }

  onCompanyChange(index: number): void {
    const item = this.packageItems[index];
    if (!item) {
      return;
    }

    item.serviceName = '';
    item.description = '';
    this.serviceSearchText[index] = '';
    this.showServiceDropdown[index] = false;

    const companyId = Number(item.companyId || 0);
    if (companyId && !this.serviceOptionsByCompanyId[companyId]) {
      this.loadServicesForCompany(companyId, index);
    } else if (companyId) {
      this.filteredServices[index] = [
        ...(this.serviceOptionsByCompanyId[companyId] || []),
      ];
    }
  }

  onServiceChange(index: number): void {
    const item = this.packageItems[index];
    if (!item) {
      return;
    }

    item.description = item.serviceName || '';
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
      ? 'View Package Booking'
      : this.mode === 'edit'
        ? 'Edit Package Booking'
        : 'New Package Booking';
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
    this.emailError = '';

    if (!this.isViewMode) {
      if (!this.fullName.trim()) this.validationErrors.push('Full name is required.');
      if (!this.phone.trim()) this.validationErrors.push('Phone number is required.');
      if (!this.email.trim()) this.validationErrors.push('Email is required.');
      else if (!this.isValidEmail(this.email)) {
        this.emailError = 'Please enter a valid email address.';
        this.validationErrors.push('Please enter a valid email address.');
      }
      if (!this.bookingDate) this.validationErrors.push('Booking date is required.');
      if (!this.paxCount && !this.domesticPax && !this.internationalPax) this.validationErrors.push('Number of pax is required.');
      if (!this.operatorName.trim()) this.validationErrors.push('Operator name is required.');
      const validItems = this.packageItems.filter(item => item.companyId);
      if (validItems.length === 0) this.validationErrors.push('At least one package item with a company is required.');
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        if (!item.serviceName && !item.description) this.validationErrors.push(`Package item ${i + 1}: service/description is required.`);
        if (!item.price || Number(item.price) <= 0) this.validationErrors.push(`Package item ${i + 1}: price must be greater than 0.`);
      }
      if (this.validationErrors.length > 0) return;
    }

    this.bookingSubmit.emit({
      bookingType: 'package',
      customerType: this.customerType,
      nationality: this.selectedNationality,
      fullName: this.fullName,
      phone: this.phone,
      email: this.email,
      paxCount: this.paxCount,
      domesticPax: this.domesticPax,
      internationalPax: this.internationalPax,
      bookingDate: this.normalizeDateForInput(this.bookingDate),
      packageName: this.packageName,
      packagePrice: this.packagePrice,
      serviceName: this.serviceName,
      totalDeposit: this.totalDeposit,
      packageItems: this.packageItems.map((item) => ({
        companyId: item.companyId,
        serviceName: item.serviceName || item.description || '',
        description: item.serviceName || item.description || '',
        price: item.price,
      })),
      operatorName: this.operatorName,
    });
  }

  getServiceOptions(companyId?: number): Array<{ id: number; name: string }> {
    if (!companyId) {
      return [];
    }

    return this.serviceOptionsByCompanyId[companyId] || [];
  }

  private applyBooking(): void {
    if (!this.booking || this.mode === 'add') {
      return;
    }

    this.customerType = this.booking.customerType || 'tourist';
    this.selectedNationality = this.booking.nationality || 'domestic';
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
    this.bookingDate = this.normalizeDateForInput(
      this.booking.bookedDate || '',
    );
    this.packageName =
      this.booking.packageName || this.booking.serviceName || '';
    this.packagePrice = this.booking.packagePrice?.toString() || '';
    this.totalDeposit = this.booking.totalDeposit?.toString() || '';
    this.serviceName = this.booking.serviceName || '';
    this.operatorName = this.booking.operatorName || '';

    const rawPackageItems = Array.isArray((this.booking as any).packageItems)
      ? (this.booking as any).packageItems
      : Array.isArray((this.booking as any).package_companies)
        ? (this.booking as any).package_companies
        : [];

    // populate packageItems if booking contains them
    if (rawPackageItems.length > 0) {
      this.packageItems = rawPackageItems.map((it: any) => ({
        companyId:
          it.referee_id || it.company_id || it.referrer_id || undefined,
        serviceName: it.description || '',
        price: it.per_price?.toString() || it.price?.toString() || '',
        description: it.description || it.serviceName || '',
      }));

      for (let idx = 0; idx < this.packageItems.length; idx++) {
        const item = this.packageItems[idx] as any;
        const source = rawPackageItems[idx] as any;
        if (item.companyId) {
          this.companySearchText[idx] = String(
            source?.referee_company ||
              source?.referral_company ||
              source?.company_name ||
              source?.companyName ||
              '',
          ).trim();
          this.serviceSearchText[idx] = item.serviceName || '';

          // Seed the dropdown immediately with the saved description so the
          // current value shows before the API responds. Then fetch the full
          // product list in the background so the user can pick a different one.
          const companyId = Number(item.companyId);
          if (companyId) {
            if (!this.serviceOptionsByCompanyId[companyId]) {
              const syntheticService = item.serviceName
                ? [{ id: 0, name: item.serviceName }]
                : [];
              this.serviceOptionsByCompanyId = {
                ...this.serviceOptionsByCompanyId,
                [companyId]: syntheticService,
              };
              this.filteredServices[idx] = [...syntheticService];
            }
            if (this.mode === 'edit') {
              // Remove synthetic seed so loadServicesForCompany fetches real data
              delete this.serviceOptionsByCompanyId[companyId];
              this.loadServicesForCompany(companyId, idx);
            }
          }
        }
      }
    }
  }

  private loadCompanies(): void {
    const cacheKey = 'package_companies_cache';

    const applyCompanies = (data: any[]) => {
      this.companies = data
        .map((company: any) => ({
          id: Number(company.id),
          name: String(company.company_name || company.name || '').trim(),
        }))
        .filter(
          (company: { id: number; name: string }) =>
            Number.isInteger(company.id) && company.id > 0 && !!company.name,
        );
      for (let i = 0; i < this.packageItems.length; i++) {
        if (!this.filteredCompanies[i]) {
          this.filteredCompanies[i] = [...this.companies];
        }
      }
    };

    this.companyService.getPackageCompanies().subscribe({
      next: (response) => {
        const data = Array.isArray(response?.data) ? response.data : [];
        localStorage.setItem(cacheKey, JSON.stringify(data));
        applyCompanies(data);
      },
      error: () => {
        const cached = localStorage.getItem(cacheKey);
        applyCompanies(cached ? JSON.parse(cached) : []);
      },
    });
  }

  private loadServicesForCompany(companyId: number, itemIndex?: number): void {
    if (!companyId) {
      return;
    }

    if (this.serviceOptionsByCompanyId[companyId]) {
      if (itemIndex !== undefined) {
        this.filteredServices[itemIndex] = [
          ...(this.serviceOptionsByCompanyId[companyId] || []),
        ];
      }
      return;
    }

    const cacheKey = `products_cache_${companyId}`;

    const applyProducts = (data: any[]) => {
      const services = data
        .map((product: any) => ({
          id: Number(product.id),
          name: String(product.name || '').trim(),
        }))
        .filter(
          (service: { id: number; name: string }) =>
            Number.isInteger(service.id) &&
            service.id > 0 &&
            !!service.name,
        );

      this.serviceOptionsByCompanyId = {
        ...this.serviceOptionsByCompanyId,
        [companyId]: services,
      };

      if (itemIndex !== undefined) {
        this.filteredServices[itemIndex] = [...services];
      }
    };

    this.productService
      .getProductsByCompany(companyId, { page: 1, per_page: 1000 })
      .subscribe({
        next: (response) => {
          const data = Array.isArray(response?.data) ? response.data : [];
          localStorage.setItem(cacheKey, JSON.stringify(data));
          applyProducts(data);
        },
        error: () => {
          const cached = localStorage.getItem(cacheKey);
          const data = cached ? JSON.parse(cached) : [];
          applyProducts(data);
        },
      });
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
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

  onNumericInput(field: string, value: string): void {
    const digits = String(value || '').replace(/\D+/g, '');
    (this as any)[field] = digits;
  }

  onNumericInputForItem(index: number, field: string, value: string): void {
    const digits = String(value || '').replace(/\D+/g, '');
    const item = this.packageItems[index];
    if (item) {
      (item as any)[field] = digits;
    }
  }

  onNumericPasteForItem(
    index: number,
    field: string,
    event: ClipboardEvent,
  ): void {
    const pastedText = event.clipboardData?.getData('text') || '';
    if (/\D/.test(pastedText)) {
      event.preventDefault();
      const sanitized = pastedText.replace(/\D+/g, '');
      const item = this.packageItems[index];
      if (item) {
        (item as any)[field] = `${(item as any)[field] || ''}${sanitized}`;
      }
    }
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
}
