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
import { activityDateKey, activityTime } from '../../../utils/activity-date.util';
import { packageItemDays } from '../../../utils/package-item-dates.util';
import { AuthService } from '../../../services/auth.service';
import { OfflineQueueService } from '../../../services/offline-queue.service';
import {
  BookingDateSheetComponent,
  toDisplayDate,
} from '../booking-date-sheet/booking-date-sheet.component';
import {
  blockNonMoneyKey,
  formatMoney,
  sanitizeMoney,
} from '../../money-input.util';

type PackageProductType = 'activity' | 'accommodation';

@Component({
  selector: 'app-package-booking-form',
  templateUrl: './package-booking-form.component.html',
  styleUrls: ['./package-booking-form.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, BookingDateSheetComponent],
})
export class PackageBookingFormComponent implements OnInit, OnChanges {
  @Input() booking: BookingDetail | null = null;
  // Add mode only: values to start from, e.g. a quotation being converted
  // (Convert to Booking / Receipt). Edit and view load `booking` instead.
  @Input() prefill: BookingDetail | null = null;
  @Input() mode: 'add' | 'edit' | 'view' = 'add';
  @Input() hideCancel = false;
  // Shifts the displayed field numbers. booking-add renders a "1. Select Type"
  // field before this form, so its numbered fields start at 3 (offset 0). The
  // e-receipt page has no preceding field, so it passes -1; the customer-type
  // selector then becomes "1." and the rest start at 2.
  @Input() numberOffset = 0;
  // Hides the Deposit field (e.g. on the e-receipt walk-in flow, which has no
  // pending/deposit concept). Field numbers after the deposit shift up by one.
  @Input() hideDeposit = false;
  @Output() bookingCancel = new EventEmitter<void>();
  @Output() bookingSubmit = new EventEmitter<Record<string, unknown>>();

  /** Deposit field base number; fields after it shift when deposit is hidden. */
  private readonly depositFieldNumber = 10;

  customerType = 'tourist';
  selectedNationality = 'domestic';
  fullName = '';
  phone = '';
  email = '';
  emailError = '';
  phoneError = '';
  validationErrors: string[] = [];
  paxCount = '';
  domesticPax = '';
  internationalPax = '';
  bookingDate = '';
  isDateSheetOpen = false;
  readonly displayDate = toDisplayDate;
  packageName = '';
  packagePrice = '';
  totalDeposit = '';
  serviceName = '';
  operatorName = '';
  // Dynamic package items (company selection + price + description)
  companies: Array<{ id: number; name: string }> = [];
  serviceOptionsByCompanyId: Record<
    number,
    Array<{ id: number; name: string; productType?: PackageProductType }>
  > = {};
  companySearchText: Record<number, string> = {};
  filteredCompanies: Record<number, Array<{ id: number; name: string }>> = {};
  showCompanyDropdown: Record<number, boolean> = {};
  serviceSearchText: Record<number, string> = {};
  filteredServices: Record<number, Array<{ id: number; name: string }>> = {};
  showServiceDropdown: Record<number, boolean> = {};
  packageItems: Array<{
    companyId?: number;
    // Picked in the form to narrow the service list; not saved — worked out
    // again from the service when an existing booking is opened.
    productType?: PackageProductType;
    serviceName?: string;
    price?: string;
    description?: string;
    // When the customer comes: activity → date (+ optional HH:mm time);
    // accommodation → start/end date. All YYYY-MM-DD.
    activityDate?: string;
    activityTime?: string;
    checkInDate?: string;
    checkOutDate?: string;
  }> = [{ companyId: undefined, price: '', description: '' }];

  // Shared date pop-up / time picker for the package items.
  itemDateSheet: {
    open: boolean;
    index: number;
    field: 'activityDate' | 'checkInDate' | 'checkOutDate';
  } = { open: false, index: -1, field: 'activityDate' };
  itemTimePicker = { open: false, index: -1 };
  // Days already picked in this package's other own-company items, marked in
  // the item date pop-up before the package is saved. Set when it opens.
  itemDateSheetExtraDates: string[] = [];
  pendingItemTime = '';

  constructor(
    private companyService: CompanyService,
    private productService: ProductService,
    private offlineQueue: OfflineQueueService,
    private authService: AuthService,
  ) {}

  /** Displayed field number for a given base number, shifted by numberOffset.
   *  When the deposit is hidden, fields numbered after it shift up by one. */
  n(base: number): number {
    const depositShift =
      this.hideDeposit && base > this.depositFieldNumber ? -1 : 0;
    return base + this.numberOffset + depositShift;
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
    // "Tarikh Tempahan Dibuat" — the day the package is being booked; start
    // a new package on today (the operator can still change it).
    if (this.mode === 'add' && !this.bookingDate) {
      const now = new Date();
      this.bookingDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
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
    // The search boxes' text/dropdown state is kept per row index — move the
    // rows below the deleted one up, or they would show the wrong row's text.
    const shift = <T>(record: Record<number, T>): Record<number, T> => {
      const next: Record<number, T> = {};
      Object.keys(record).forEach((key) => {
        const i = Number(key);
        if (i < index) next[i] = record[i];
        else if (i > index) next[i - 1] = record[i];
      });
      return next;
    };
    this.companySearchText = shift(this.companySearchText);
    this.filteredCompanies = shift(this.filteredCompanies);
    this.showCompanyDropdown = shift(this.showCompanyDropdown);
    this.serviceSearchText = shift(this.serviceSearchText);
    this.filteredServices = shift(this.filteredServices);
    this.showServiceDropdown = shift(this.showServiceDropdown);
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
    item.productType = undefined;
    this.clearItemDates(item);
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

    const allServices = this.getServicesForItem(index);

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
    const item = this.packageItems[index];
    if (item?.companyId && item.productType) {
      const search = (this.serviceSearchText[index] || '').trim().toLowerCase();
      this.filteredServices[index] = this.getServicesForItem(index).filter(
        (s) => !search || s.name.toLowerCase().includes(search),
      );
    }
  }

  /** Changing the product type clears the service picked for the old type. */
  onProductTypeChange(index: number): void {
    const item = this.packageItems[index];
    if (!item) {
      return;
    }
    item.serviceName = '';
    item.description = '';
    this.clearItemDates(item);
    this.serviceSearchText[index] = '';
    this.showServiceDropdown[index] = false;
    this.filteredServices[index] = this.getServicesForItem(index);
  }

  private clearItemDates(item: { activityDate?: string; activityTime?: string; checkInDate?: string; checkOutDate?: string }): void {
    item.activityDate = '';
    item.activityTime = '';
    item.checkInDate = '';
    item.checkOutDate = '';
  }

  // ---- Package item dates ----

  openItemDateSheet(index: number, field: 'activityDate' | 'checkInDate' | 'checkOutDate'): void {
    if (this.isViewMode) return;
    this.itemDateSheetExtraDates = this.ownItemDaysExcept(index);
    this.itemDateSheet = { open: true, index, field };
  }

  /** Days taken by this package's other items with our own company. */
  private ownItemDaysExcept(index: number): string[] {
    const myCompanyId = Number(this.authService.currentUser?.company_id ?? 0);
    if (!myCompanyId) return [];
    const days = new Set<string>();
    this.packageItems.forEach((item, i) => {
      if (i === index || Number(item.companyId || 0) !== myCompanyId) return;
      packageItemDays({
        product_type: item.productType,
        activity_date: item.activityDate,
        check_in_date: item.checkInDate,
        check_out_date: item.checkOutDate,
      }).forEach((day) => days.add(day));
    });
    return [...days];
  }

  closeItemDateSheet(): void {
    this.itemDateSheet = { ...this.itemDateSheet, open: false };
  }

  onItemDateSelected(iso: string): void {
    const item = this.packageItems[this.itemDateSheet.index];
    if (item) {
      item[this.itemDateSheet.field] = iso;
      // A stay is at least one night: a start date on/after the end date
      // clears the end date (same as the accommodation booking form).
      if (this.itemDateSheet.field === 'checkInDate' && item.checkOutDate && item.checkOutDate <= iso) {
        item.checkOutDate = '';
      }
    }
    this.closeItemDateSheet();
  }

  get itemDateSheetTitle(): string {
    switch (this.itemDateSheet.field) {
      case 'checkInDate':
        return 'Tarikh Mula/Start Date';
      case 'checkOutDate':
        return 'Tarikh Tamat/End Date';
      default:
        return 'Tarikh Aktiviti/Activity Date';
    }
  }

  get itemDateSheetValue(): string {
    const item = this.packageItems[this.itemDateSheet.index];
    return (item?.[this.itemDateSheet.field] as string) || '';
  }

  /** End date: earliest is the day after the start date (at least 1 night). */
  get itemDateSheetMin(): string {
    const item = this.packageItems[this.itemDateSheet.index];
    if (this.itemDateSheet.field !== 'checkOutDate' || !item?.checkInDate) return '';
    const next = new Date(Date.parse(`${item.checkInDate}T00:00:00Z`) + 24 * 60 * 60 * 1000);
    return next.toISOString().slice(0, 10);
  }

  /**
   * Mark our own booked dates only when the item is with our own company;
   * another company's calendar stays private (plain pop-up).
   */
  get itemDateSheetShowsBooked(): boolean {
    const item = this.packageItems[this.itemDateSheet.index];
    const myCompanyId = Number(this.authService.currentUser?.company_id ?? 0);
    return !!myCompanyId && Number(item?.companyId || 0) === myCompanyId;
  }

  openItemTimePicker(index: number): void {
    if (this.isViewMode) return;
    const item = this.packageItems[index];
    const now = new Date();
    this.pendingItemTime =
      item?.activityTime ||
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.itemTimePicker = { open: true, index };
  }

  closeItemTimePicker(): void {
    this.itemTimePicker = { ...this.itemTimePicker, open: false };
  }

  onPendingItemTimeChange(event: CustomEvent): void {
    const raw = event.detail?.value;
    const value = Array.isArray(raw) ? raw[0] : raw;
    // ion-datetime may emit a full ISO string; the first HH:mm is the time.
    const match = String(value || '').match(/(\d{2}):(\d{2})/);
    if (match) {
      this.pendingItemTime = `${match[1]}:${match[2]}`;
    }
  }

  applyItemTime(): void {
    const item = this.packageItems[this.itemTimePicker.index];
    if (item) item.activityTime = this.pendingItemTime;
    this.closeItemTimePicker();
  }

  /** Time is optional — let the operator remove it again. */
  clearItemTime(): void {
    const item = this.packageItems[this.itemTimePicker.index];
    if (item) item.activityTime = '';
    this.closeItemTimePicker();
  }

  /** "HH:mm" (24h) shown as "07:30 PM". */
  itemTimeDisplay(value?: string): string {
    const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);
    if (!match) return '';
    const hours24 = Number(match[1]);
    const period = hours24 >= 12 ? 'PM' : 'AM';
    return `${String(hours24 % 12 || 12).padStart(2, '0')}:${match[2]} ${period}`;
  }

  /** The company's services of the row's product type (all if no type yet). */
  private getServicesForItem(
    index: number,
  ): Array<{ id: number; name: string; productType?: PackageProductType }> {
    const item = this.packageItems[index];
    const all = this.serviceOptionsByCompanyId[Number(item?.companyId || 0)] || [];
    return item?.productType
      ? all.filter((s) => s.productType === item.productType)
      : all;
  }

  /**
   * Existing bookings don't store the product type — work it out from the
   * row's saved service once the company's services are loaded.
   */
  private inferProductTypes(companyId: number): void {
    const services = this.serviceOptionsByCompanyId[companyId] || [];
    this.packageItems.forEach((item) => {
      if (Number(item.companyId || 0) !== companyId || item.productType || !item.serviceName) {
        return;
      }
      const name = item.serviceName.trim().toLowerCase();
      const match = services.find((s) => s.name.toLowerCase() === name);
      if (match?.productType) {
        item.productType = match.productType;
      }
    });
  }

  onServiceSearchBlur(index: number): void {
    setTimeout(() => {
      this.showServiceDropdown[index] = false;
    }, 200);
  }

  getFilteredServices(index: number): Array<{ id: number; name: string }> {
    const services = this.filteredServices[index] || [];

    // Exclude services already picked in other rows of the SAME company, so the
    // same activity/accommodation can't be added twice for one company.
    const takenNames = this.getServiceNamesTakenByOtherRows(index);
    if (takenNames.size === 0) {
      return services;
    }

    return services.filter((s) => !takenNames.has(s.name));
  }

  /**
   * Service names already selected in other package rows that share the same
   * company as the row at `index`. Used to hide duplicates from the dropdown.
   */
  private getServiceNamesTakenByOtherRows(index: number): Set<string> {
    const currentCompanyId = Number(this.packageItems[index]?.companyId || 0);
    const taken = new Set<string>();
    if (!currentCompanyId) {
      return taken;
    }

    this.packageItems.forEach((item, i) => {
      if (i === index) {
        return;
      }
      const sameCompany = Number(item.companyId || 0) === currentCompanyId;
      if (sameCompany && item.serviceName) {
        taken.add(item.serviceName);
      }
    });

    return taken;
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
    if (changes['booking'] || changes['mode'] || changes['prefill']) {
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
    this.phoneError = '';

    if (!this.isViewMode) {
      if (!this.fullName.trim()) this.validationErrors.push('Full name is required.');
      // Phone is how returning customers are recognised (dashboard Excel export).
      const phoneDigits = String(this.phone || '').replace(/\D/g, '');
      if (!phoneDigits) {
        this.phoneError = 'Sila masukkan no. telefon / Telephone number is required.';
        this.validationErrors.push('Telephone number is required.');
      } else if (phoneDigits.length < 8) {
        this.phoneError = 'No. telefon tidak sah / Please enter a valid telephone number.';
        this.validationErrors.push('Please enter a valid telephone number.');
      }
      if (this.email.trim() && !this.isValidEmail(this.email)) {
        this.emailError = 'Please enter a valid email address.';
        this.validationErrors.push('Please enter a valid email address.');
      }
      if (!this.bookingDate) this.validationErrors.push('Booking date is required.');
      // Pax must be at least 1 ("0" is not empty, so check the number).
      const paxNumber = (value: unknown) => Number(String(value ?? '').trim() || 0);
      if (this.isMixedNationality) {
        if (paxNumber(this.domesticPax) < 1 || paxNumber(this.internationalPax) < 1) {
          this.validationErrors.push('Domestic and international pax must each be at least 1.');
        }
      } else if (paxNumber(this.paxCount) < 1) {
        this.validationErrors.push('Number of pax must be at least 1.');
      }
      const validItems = this.packageItems.filter(item => item.companyId);
      if (validItems.length === 0) this.validationErrors.push('At least one package item with a company is required.');
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        if (!item.serviceName && !item.description) this.validationErrors.push(`Package item ${i + 1}: service/description is required.`);
        if (!item.price || Number(item.price) <= 0) this.validationErrors.push(`Package item ${i + 1}: price must be greater than 0.`);
        if (!item.productType) {
          this.validationErrors.push(`Package item ${i + 1}: product type is required.`);
        } else if (item.productType === 'activity' && !item.activityDate) {
          this.validationErrors.push(`Package item ${i + 1}: activity date is required.`);
        } else if (item.productType === 'accommodation') {
          if (!item.checkInDate || !item.checkOutDate) {
            this.validationErrors.push(`Package item ${i + 1}: start and end date are required.`);
          } else if (item.checkOutDate <= item.checkInDate) {
            this.validationErrors.push(`Package item ${i + 1}: end date must be after the start date.`);
          }
        }
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
        productType: item.productType,
        activityDate: item.productType === 'activity' ? item.activityDate || '' : '',
        activityTime: item.productType === 'activity' ? item.activityTime || '' : '',
        checkInDate: item.productType === 'accommodation' ? item.checkInDate || '' : '',
        checkOutDate: item.productType === 'accommodation' ? item.checkOutDate || '' : '',
      })),
      operatorName: this.operatorName,
    });
  }

  /** Package total = sum of the item prices (what is saved as total_price). */
  get packageTotalText(): string {
    const total = this.packageItems.reduce(
      (sum, item) => sum + (Number(String(item.price ?? '').replace(/,/g, '')) || 0),
      0,
    );
    return total.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getServiceOptions(companyId?: number): Array<{ id: number; name: string }> {
    if (!companyId) {
      return [];
    }

    return this.serviceOptionsByCompanyId[companyId] || [];
  }

  private applyBooking(): void {
    const loaded = this.mode === 'add' ? this.prefill : this.booking;
    if (!loaded) {
      return;
    }

    this.customerType = loaded.customerType || 'tourist';
    this.selectedNationality = loaded.nationality || 'domestic';
    this.fullName = loaded.fullName || '';
    this.phone = loaded.phone || '';
    this.email = loaded.email || '';
    this.domesticPax = loaded.domesticPax?.toString() || '';
    this.internationalPax = loaded.internationalPax?.toString() || '';
    // For a single-nationality booking the pax sits in either domestic or
    // international. Use whichever is non-zero (a plain `||` would treat a
    // domestic value of 0 as truthy via "0" and hide an international count).
    const domesticPaxNum = Number(loaded.domesticPax || 0);
    const internationalPaxNum = Number(loaded.internationalPax || 0);
    const singlePax = domesticPaxNum || internationalPaxNum;
    this.paxCount = singlePax ? String(singlePax) : '';
    this.bookingDate = this.normalizeDateForInput(
      loaded.bookedDate || '',
    );
    this.packageName =
      loaded.packageName || loaded.serviceName || '';
    this.packagePrice = loaded.packagePrice?.toString() || '';
    this.totalDeposit = formatMoney(loaded.totalDeposit);
    this.serviceName = loaded.serviceName || '';
    this.operatorName = loaded.operatorName || '';

    const rawPackageItems = Array.isArray((loaded as any).packageItems)
      ? (loaded as any).packageItems
      : Array.isArray((loaded as any).package_companies)
        ? (loaded as any).package_companies
        : [];

    // populate packageItems if booking contains them
    if (rawPackageItems.length > 0) {
      this.packageItems = rawPackageItems.map((it: any) => {
        const type = String(it.product_type ?? it.productType ?? '').toLowerCase();
        return {
          companyId:
            it.referee_id || it.company_id || it.referrer_id || undefined,
          productType:
            type === 'activity' || type === 'accommodation'
              ? (type as PackageProductType)
              : undefined,
          serviceName: it.description || '',
          price: formatMoney(it.per_price ?? it.price),
          description: it.description || it.serviceName || '',
          // activity_date is stored "as typed" — read its parts directly.
          activityDate: activityDateKey(it.activity_date ?? it.activityDate),
          activityTime: activityTime(it.activity_date ?? it.activityDate) || it.activityTime || '',
          checkInDate: activityDateKey(it.check_in_date ?? it.checkInDate),
          checkOutDate: activityDateKey(it.check_out_date ?? it.checkOutDate),
        };
      });

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
            if (this.mode !== 'view') {
              // Edit or prefilled add: drop the synthetic seed and fetch the real list
              delete this.serviceOptionsByCompanyId[companyId];
              this.loadServicesForCompany(companyId, idx);
            }
          }
        }
      }
    }
  }

  private loadCompanies(): void {
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
        // Apply first, then cache to IndexedDB (best-effort). IndexedDB replaces
        // localStorage here — the company/product lists overflowed the ~5MB
        // localStorage quota, which crashed this dropdown in production.
        applyCompanies(data);
        void this.offlineQueue.cachePackageCompanies(data).catch(() => {});
      },
      error: () => {
        // Offline / request failed — fall back to the IndexedDB cache.
        this.offlineQueue
          .getCachedPackageCompanies()
          .then((cached) => applyCompanies(cached))
          .catch(() => applyCompanies([]));
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

    const applyProducts = (data: any[]) => {
      const services = data
        .map((product: any) => {
          const type = String(product.product_type || product.productType || '').toLowerCase();
          return {
            id: Number(product.id),
            name: String(product.name || '').trim(),
            productType:
              type === 'activity' || type === 'accommodation'
                ? (type as PackageProductType)
                : undefined,
          };
        })
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
      this.inferProductTypes(companyId);

      if (itemIndex !== undefined) {
        this.filteredServices[itemIndex] = this.getServicesForItem(itemIndex);
      }
    };

    this.productService
      .getProductsByCompany(companyId, { page: 1, per_page: 1000 })
      .subscribe({
        next: (response) => {
          const data = Array.isArray(response?.data) ? response.data : [];
          // Apply first, then cache to IndexedDB (best-effort).
          applyProducts(data);
          void this.offlineQueue.cacheProducts(companyId, data).catch(() => {});
        },
        error: () => {
          // Offline / request failed — fall back to the IndexedDB cache.
          this.offlineQueue
            .getCachedProducts(companyId)
            .then((cached) => applyProducts(cached))
            .catch(() => applyProducts([]));
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

  openDateSheet(): void {
    if (this.isViewMode) return;
    this.isDateSheetOpen = true;
  }

  onDateSelected(iso: string): void {
    this.bookingDate = iso;
    this.isDateSheetOpen = false;
  }

  onMoneyInput(field: string, value: string): void {
    (this as any)[field] = sanitizeMoney(value);
  }

  onMoneyBlur(field: string): void {
    (this as any)[field] = formatMoney((this as any)[field]);
  }

  onMoneyBlurForItem(index: number, field: string): void {
    const item = this.packageItems[index];
    if (item) {
      (item as any)[field] = formatMoney((item as any)[field]);
    }
  }

  onMoneyKeydown(event: KeyboardEvent): void {
    blockNonMoneyKey(event);
  }

  onMoneyInputForItem(index: number, field: string, value: string): void {
    const item = this.packageItems[index];
    if (item) {
      (item as any)[field] = sanitizeMoney(value);
    }
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
}
