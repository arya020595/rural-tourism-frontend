import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, MenuController, NavController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { toDisplayDate } from '../../booking-forms/components/booking-date-sheet/booking-date-sheet.component';
import {
  blockNonMoneyKey,
  formatMoney,
  sanitizeMoney,
} from '../../booking-forms/money-input.util';
import { AuthService } from '../../services/auth.service';
import { CompanyService } from '../../services/company.service';
import { LoadingService } from '../../services/loading.service';
import { MenuItem, MenuService } from '../../services/menu.service';
import { NetworkService } from '../../services/network.service';
import { ProductService } from '../../services/product.service';
import { QuotationService } from '../../services/quotation.service';
import { ToastService } from '../../services/toast.service';
import { activityDateKey, activityTime } from '../../utils/activity-date.util';
import { packageItemDays } from '../../utils/package-item-dates.util';
import {
  DEFAULT_QUOTATION_NOTES,
  Quotation,
  QuotationPayload,
  QuotationProductType,
} from '../quotation.models';

const MENU_ID = 'quotation-form-menu';
const VALIDITY_DAYS = 7;

interface Option {
  id: number;
  name: string;
  productType?: QuotationProductType;
}

/** One item card. Search text / dropdown state lives on the row itself. */
interface ItemRow {
  companyId?: number;
  companyText: string;
  showCompanies: boolean;
  productType?: QuotationProductType;
  productId?: number;
  serviceText: string;
  showServices: boolean;
  price: string;
  activityDate: string;
  activityTime: string;
  checkInDate: string;
  checkOutDate: string;
}

type ItemDateField = 'activityDate' | 'checkInDate' | 'checkOutDate';

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function addDaysIso(iso: string, days: number): string {
  const date = new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86400000);
  return date.toISOString().slice(0, 10);
}

function emptyRow(): ItemRow {
  return {
    companyText: '',
    showCompanies: false,
    serviceText: '',
    showServices: false,
    price: '',
    activityDate: '',
    activityTime: '',
    checkInDate: '',
    checkOutDate: '',
  };
}

@Component({
  selector: 'app-quotation-form',
  templateUrl: './quotation-form.page.html',
  styleUrls: ['./quotation-form.page.scss'],
})
export class QuotationFormPage {
  readonly menuId = MENU_ID;
  readonly displayDate = toDisplayDate;
  user: any = null;
  menuItems: MenuItem[] = [];

  quotationId: number | null = null;
  quotationNo = '';
  isLoading = false;
  isSaving = false;
  loadError = '';

  // 1. Customer
  fullName = '';
  phone = '';
  email = '';
  nationality: 'domestic' | 'international' | 'both' = 'domestic';
  paxCount = '';
  domesticPax = '';
  internationalPax = '';

  // 2. Quotation details
  quotationDate = todayIso();
  validUntil = addDaysIso(todayIso(), VALIDITY_DAYS);
  /** Valid-until follows the quotation date (+7) until changed by hand. */
  private validUntilTouched = false;
  preparedBy = '';

  // 3. Items
  items: ItemRow[] = [emptyRow()];
  companies: Option[] = [];
  servicesByCompany: Record<number, Option[]> = {};

  // 4. Notes — starts as the company's saved default (else the standard text).
  notes = DEFAULT_QUOTATION_NOTES;
  companyTerms: string | null = null;
  isSavingTerms = false;

  validationErrors: string[] = [];
  phoneError = '';
  emailError = '';

  // Date pop-ups / time picker
  headerDateSheet: { open: boolean; field: 'quotationDate' | 'validUntil' } = {
    open: false,
    field: 'quotationDate',
  };
  itemDateSheet: { open: boolean; index: number; field: ItemDateField } = {
    open: false,
    index: -1,
    field: 'activityDate',
  };
  itemDateSheetExtraDates: string[] = [];
  itemTimePicker = { open: false, index: -1 };
  pendingItemTime = '';

  constructor(
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private menuCtrl: MenuController,
    private navCtrl: NavController,
    private menuService: MenuService,
    private authService: AuthService,
    private companyService: CompanyService,
    private productService: ProductService,
    private quotationService: QuotationService,
    private networkService: NetworkService,
    private loadingService: LoadingService,
    private toastService: ToastService,
  ) {}

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, MENU_ID);
    this.loadUser();
    this.loadCompanies();

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.quotationId = Number.isInteger(id) && id > 0 ? id : null;
    if (this.quotationId) {
      this.loadQuotation(this.quotationId);
    }
    this.loadCompanyTerms(!this.quotationId);
  }

  get isEdit(): boolean {
    return this.quotationId !== null;
  }

  get myCompanyId(): number {
    return Number(this.authService.currentUser?.company_id ?? this.user?.company_id ?? 0);
  }

  get totalText(): string {
    const total = this.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    return total.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* ── Loading ─────────────────────────────────────────────────────── */

  private async loadQuotation(id: number): Promise<void> {
    if (!this.networkService.isOnline) {
      this.loadError = 'Sebut harga perlukan internet / Quotations need an internet connection.';
      return;
    }
    this.isLoading = true;
    try {
      const quotation = await firstValueFrom(this.quotationService.get(id));
      if (!quotation.can_edit) {
        this.toastService.warning('Sebut harga ini tidak boleh diubah / This quotation can no longer be edited.');
        this.navCtrl.navigateBack(`/quotation/${id}`, { replaceUrl: true });
        return;
      }
      this.applyQuotation(quotation);
    } catch (error: any) {
      this.loadError = error?.error?.message || 'Gagal memuatkan sebut harga / Failed to load the quotation.';
    } finally {
      this.isLoading = false;
    }
  }

  private applyQuotation(quotation: Quotation): void {
    this.quotationNo = quotation.quotation_no;
    this.fullName = quotation.customer_name;
    this.phone = quotation.phone_number;
    this.email = quotation.email || '';
    this.nationality = quotation.citizenship;
    this.domesticPax = String(quotation.no_of_pax_domestik || '');
    this.internationalPax = String(quotation.no_of_pax_antarbangsa || '');
    this.paxCount = String(
      (quotation.no_of_pax_domestik || 0) + (quotation.no_of_pax_antarbangsa || 0) || '',
    );
    this.quotationDate = quotation.quotation_date;
    this.validUntil = quotation.valid_until;
    this.validUntilTouched = true;
    this.preparedBy = quotation.prepared_by_name || '';
    this.notes = quotation.notes || '';
    this.items = (quotation.items || []).map((item) => ({
      ...emptyRow(),
      companyId: item.company_id,
      companyText: item.company_name || '',
      productType: item.product_type,
      productId: item.product_id ?? undefined,
      serviceText: item.description || '',
      price: formatMoney(item.amount),
      activityDate: activityDateKey(item.activity_date),
      activityTime: activityTime(item.activity_date) || '',
      checkInDate: activityDateKey(item.check_in_date),
      checkOutDate: activityDateKey(item.check_out_date),
    }));
    if (this.items.length === 0) this.items = [emptyRow()];
    new Set(this.items.map((item) => item.companyId).filter(Boolean)).forEach((companyId) =>
      this.loadServices(Number(companyId)),
    );
  }

  /** New quotation: start from the company's saved notes & terms. */
  private loadCompanyTerms(applyToForm: boolean): void {
    this.quotationService.getCompanyTerms().subscribe({
      next: (terms) => {
        this.companyTerms = terms;
        if (applyToForm && terms) this.notes = terms;
      },
      error: () => {
        this.companyTerms = null;
      },
    });
  }

  /** Save the box's text as the company's default for future quotations. */
  async saveNotesAsDefault(): Promise<void> {
    if (this.isSavingTerms) return;
    if (!this.notes.trim()) {
      this.toastService.warning('Nota kosong / Notes are empty.');
      return;
    }
    if (!this.networkService.isOnline) {
      this.toastService.warning('Perlu internet / Needs an internet connection.');
      return;
    }
    this.isSavingTerms = true;
    try {
      this.companyTerms = await firstValueFrom(this.quotationService.saveCompanyTerms(this.notes));
      await this.showResult(
        'Default Saved',
        'New quotations will start with these notes & terms.',
        [{ text: 'OK', role: 'cancel' }],
      );
    } catch (error: any) {
      this.toastService.error(error?.error?.message || 'Gagal menyimpan / Failed to save.');
    } finally {
      this.isSavingTerms = false;
    }
  }

  /** Put the app's standard notes & terms back in the box. */
  useStandardNotes(): void {
    this.notes = DEFAULT_QUOTATION_NOTES;
  }

  /** The box already holds the saved default. */
  get notesAreDefault(): boolean {
    return !!this.companyTerms && this.notes.trim() === this.companyTerms.trim();
  }

  private loadCompanies(): void {
    this.companyService.getPackageCompanies().subscribe({
      next: (response) => {
        const data = Array.isArray(response?.data) ? response.data : [];
        this.companies = data
          .map((company: any) => ({
            id: Number(company.id),
            name: String(company.company_name || company.name || '').trim(),
          }))
          .filter((company: Option) => Number.isInteger(company.id) && company.id > 0 && !!company.name)
          // Our own company first — at least one item must be ours.
          .sort((a: Option, b: Option) => Number(b.id === this.myCompanyId) - Number(a.id === this.myCompanyId));
      },
      error: () => {
        this.companies = [];
      },
    });
  }

  private loadServices(companyId: number): void {
    if (!companyId || this.servicesByCompany[companyId]) return;
    this.servicesByCompany[companyId] = [];
    this.productService.getProductsByCompany(companyId, { page: 1, per_page: 1000 }).subscribe({
      next: (response) => {
        const data = Array.isArray(response?.data) ? response.data : [];
        this.servicesByCompany = {
          ...this.servicesByCompany,
          [companyId]: data
            .filter((product: any) => product.is_active !== false && product.is_active !== 0)
            .map((product: any) => ({
              id: Number(product.id),
              name: String(product.name || '').trim(),
              productType: String(product.product_type || '').toLowerCase() as QuotationProductType,
            }))
            .filter((service: Option) => service.id > 0 && !!service.name),
        };
      },
      error: () => {
        delete this.servicesByCompany[companyId];
      },
    });
  }

  /* ── Items ───────────────────────────────────────────────────────── */

  addItem(): void {
    this.items.push(emptyRow());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) this.items.splice(index, 1);
  }

  isOwn(item: ItemRow): boolean {
    return !!item.companyId && item.companyId === this.myCompanyId;
  }

  filteredCompanies(item: ItemRow): Option[] {
    const search = item.companyText.trim().toLowerCase();
    // Typing the selected company's own name shows the full list again.
    const selected = this.companies.find((company) => company.id === item.companyId);
    if (!search || selected?.name.toLowerCase() === search) return this.companies;
    return this.companies.filter((company) => company.name.toLowerCase().includes(search));
  }

  onCompanyInput(item: ItemRow, value: string): void {
    item.companyText = value;
    item.showCompanies = true;
  }

  selectCompany(item: ItemRow, company: Option): void {
    const changed = item.companyId !== company.id;
    item.companyId = company.id;
    item.companyText = company.name;
    item.showCompanies = false;
    if (changed) {
      item.productType = undefined;
      this.clearService(item);
      this.clearDates(item);
    }
    this.loadServices(company.id);
  }

  onProductTypeChange(item: ItemRow): void {
    this.clearService(item);
    this.clearDates(item);
  }

  /** The company's services of the row's type, minus ones used in other rows. */
  filteredServices(item: ItemRow): Option[] {
    const all = (this.servicesByCompany[Number(item.companyId || 0)] || []).filter(
      (service) => !item.productType || service.productType === item.productType,
    );
    const taken = new Set(
      this.items
        .filter((other) => other !== item && other.companyId === item.companyId && other.productId)
        .map((other) => other.productId),
    );
    const search = item.serviceText.trim().toLowerCase();
    return all.filter(
      (service) =>
        !taken.has(service.id) &&
        (!search || service.id === item.productId || service.name.toLowerCase().includes(search)),
    );
  }

  onServiceInput(item: ItemRow, value: string): void {
    item.serviceText = value;
    item.productId = undefined;
    item.showServices = true;
  }

  selectService(item: ItemRow, service: Option): void {
    item.productId = service.id;
    item.serviceText = service.name;
    item.showServices = false;
  }

  hideDropdownLater(item: ItemRow, which: 'showCompanies' | 'showServices'): void {
    setTimeout(() => (item[which] = false), 200);
  }

  private clearService(item: ItemRow): void {
    item.productId = undefined;
    item.serviceText = '';
    item.showServices = false;
  }

  private clearDates(item: ItemRow): void {
    item.activityDate = '';
    item.activityTime = '';
    item.checkInDate = '';
    item.checkOutDate = '';
  }

  /**
   * Keeps the box in step with the cleaned value. Setting the field alone is
   * not enough: when the cleaned value doesn't change (e.g. "3" → "3x" → "3")
   * Angular has nothing new to render and the stray character stays visible.
   */
  private cleanInput(event: Event, clean: (value: string) => string): string {
    const input = event.target as HTMLInputElement;
    const value = clean(input.value);
    if (input.value !== value) input.value = value;
    return value;
  }

  onMoneyInput(item: ItemRow, event: Event): void {
    item.price = this.cleanInput(event, sanitizeMoney);
  }

  onMoneyBlur(item: ItemRow): void {
    item.price = formatMoney(item.price);
  }

  onMoneyKeydown(event: KeyboardEvent): void {
    blockNonMoneyKey(event);
  }

  /** Phone: digits plus the usual +, - and spaces. */
  onPhoneInput(event: Event): void {
    this.phone = this.cleanInput(event, (value) => value.replace(/[^\d+\- ]/g, ''));
  }

  onDigitsInput(field: 'paxCount' | 'domesticPax' | 'internationalPax', event: Event): void {
    this[field] = this.cleanInput(event, (value) => value.replace(/\D+/g, ''));
  }

  /* ── Date pop-ups ────────────────────────────────────────────────── */

  openHeaderDate(field: 'quotationDate' | 'validUntil'): void {
    this.headerDateSheet = { open: true, field };
  }

  onHeaderDateSelected(iso: string): void {
    if (this.headerDateSheet.field === 'quotationDate') {
      this.quotationDate = iso;
      if (!this.validUntilTouched || this.validUntil < iso) {
        this.validUntil = addDaysIso(iso, VALIDITY_DAYS);
      }
    } else {
      this.validUntil = iso;
      this.validUntilTouched = true;
    }
    this.headerDateSheet = { ...this.headerDateSheet, open: false };
  }

  get headerDateSheetMin(): string {
    return this.headerDateSheet.field === 'validUntil' ? this.quotationDate : '';
  }

  openItemDate(index: number, field: ItemDateField): void {
    this.itemDateSheetExtraDates = this.ownItemDaysExcept(index);
    this.itemDateSheet = { open: true, index, field };
  }

  /** Days taken by this quotation's other items with our own company. */
  private ownItemDaysExcept(index: number): string[] {
    const days = new Set<string>();
    this.items.forEach((item, i) => {
      if (i === index || !this.isOwn(item)) return;
      packageItemDays({
        product_type: item.productType,
        activity_date: item.activityDate,
        check_in_date: item.checkInDate,
        check_out_date: item.checkOutDate,
      }).forEach((day) => days.add(day));
    });
    return [...days];
  }

  closeItemDate(): void {
    this.itemDateSheet = { ...this.itemDateSheet, open: false };
  }

  onItemDateSelected(iso: string): void {
    const item = this.items[this.itemDateSheet.index];
    if (item) {
      item[this.itemDateSheet.field] = iso;
      // A stay is at least one night.
      if (this.itemDateSheet.field === 'checkInDate' && item.checkOutDate && item.checkOutDate <= iso) {
        item.checkOutDate = '';
      }
    }
    this.closeItemDate();
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
    const item = this.items[this.itemDateSheet.index];
    return item ? item[this.itemDateSheet.field] : '';
  }

  get itemDateSheetMin(): string {
    const item = this.items[this.itemDateSheet.index];
    if (this.itemDateSheet.field !== 'checkOutDate' || !item?.checkInDate) return '';
    return addDaysIso(item.checkInDate, 1);
  }

  /** Our booked dates only on our own items; other companies' stay private. */
  get itemDateSheetShowsBooked(): boolean {
    const item = this.items[this.itemDateSheet.index];
    return !!item && this.isOwn(item);
  }

  openItemTime(index: number): void {
    const item = this.items[index];
    const now = new Date();
    this.pendingItemTime =
      item?.activityTime ||
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.itemTimePicker = { open: true, index };
  }

  closeItemTime(): void {
    this.itemTimePicker = { ...this.itemTimePicker, open: false };
  }

  onPendingItemTimeChange(event: CustomEvent): void {
    const raw = event.detail?.value;
    const value = Array.isArray(raw) ? raw[0] : raw;
    const match = String(value || '').match(/(\d{2}):(\d{2})/);
    if (match) this.pendingItemTime = `${match[1]}:${match[2]}`;
  }

  applyItemTime(): void {
    const item = this.items[this.itemTimePicker.index];
    if (item) item.activityTime = this.pendingItemTime;
    this.closeItemTime();
  }

  clearItemTime(): void {
    const item = this.items[this.itemTimePicker.index];
    if (item) item.activityTime = '';
    this.closeItemTime();
  }

  timeDisplay(value?: string): string {
    const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);
    if (!match) return '';
    const hours = Number(match[1]);
    return `${String(hours % 12 || 12).padStart(2, '0')}:${match[2]} ${hours >= 12 ? 'PM' : 'AM'}`;
  }

  /* ── Save ────────────────────────────────────────────────────────── */

  private validate(): boolean {
    const errors: string[] = [];
    this.phoneError = '';
    this.emailError = '';

    if (!this.fullName.trim()) errors.push('Nama pelanggan diperlukan / Customer name is required.');
    const phoneDigits = this.phone.replace(/\D/g, '');
    if (!phoneDigits) {
      this.phoneError = 'Sila masukkan no. telefon / Telephone number is required.';
      errors.push('Telephone number is required.');
    } else if (phoneDigits.length < 8) {
      this.phoneError = 'No. telefon tidak sah / Please enter a valid telephone number.';
      errors.push('Please enter a valid telephone number.');
    }
    if (this.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      this.emailError = 'Please enter a valid email address.';
      errors.push('Please enter a valid email address.');
    }
    const pax = (value: string) => Number(value || 0);
    if (this.nationality === 'both') {
      if (pax(this.domesticPax) < 1 || pax(this.internationalPax) < 1) {
        errors.push('Domestic and international pax must each be at least 1.');
      }
    } else if (pax(this.paxCount) < 1) {
      errors.push('Number of pax must be at least 1.');
    }
    if (!this.quotationDate) errors.push('Tarikh sebut harga diperlukan / Quotation date is required.');
    if (!this.validUntil) errors.push('Tarikh sah diperlukan / Valid-until date is required.');
    else if (this.validUntil < this.quotationDate) {
      errors.push('Tarikh sah mesti selepas tarikh sebut harga / Valid-until must be on or after the quotation date.');
    }

    this.items.forEach((item, i) => {
      const label = `Item ${i + 1}`;
      if (!item.companyId) errors.push(`${label}: company is required.`);
      if (!item.productType) errors.push(`${label}: product type is required.`);
      if (!item.productId) errors.push(`${label}: pick a service from the list.`);
      if (!(Number(item.price) > 0)) errors.push(`${label}: price must be greater than 0.`);
      if (item.productType === 'activity' && !item.activityDate) {
        errors.push(`${label}: activity date is required.`);
      }
      if (item.productType === 'accommodation') {
        if (!item.checkInDate || !item.checkOutDate) errors.push(`${label}: start and end date are required.`);
        else if (item.checkOutDate <= item.checkInDate) errors.push(`${label}: end date must be after the start date.`);
      }
    });
    if (!this.items.some((item) => this.isOwn(item))) {
      errors.push(
        "Sekurang-kurangnya satu item mesti produk syarikat anda / At least one item must be your company's product.",
      );
    }

    this.validationErrors = errors;
    return errors.length === 0;
  }

  private buildPayload(): QuotationPayload {
    const pax = (value: string) => Number(value || 0);
    return {
      customer_name: this.fullName.trim(),
      phone_number: this.phone.trim(),
      email: this.email.trim(),
      citizenship: this.nationality,
      no_of_pax_domestik:
        this.nationality === 'both' ? pax(this.domesticPax) : this.nationality === 'domestic' ? pax(this.paxCount) : 0,
      no_of_pax_antarbangsa:
        this.nationality === 'both' ? pax(this.internationalPax) : this.nationality === 'international' ? pax(this.paxCount) : 0,
      quotation_date: this.quotationDate,
      valid_until: this.validUntil,
      notes: this.notes,
      prepared_by_name: this.preparedBy.trim(),
      items: this.items.map((item) => ({
        product_type: item.productType as QuotationProductType,
        company_id: Number(item.companyId),
        product_id: Number(item.productId),
        amount: Number(item.price),
        // Sent "as typed" (no timezone), like the booking forms.
        activity_date:
          item.productType === 'activity' && item.activityDate
            ? `${item.activityDate}T${item.activityTime || '00:00'}:00`
            : null,
        check_in_date: item.productType === 'accommodation' ? item.checkInDate : null,
        check_out_date: item.productType === 'accommodation' ? item.checkOutDate : null,
      })),
    };
  }

  async save(): Promise<void> {
    if (this.isSaving) return;
    if (!this.validate()) {
      await this.showResult(
        'Sila semak borang / Please check the form',
        `${this.validationErrors.length} perkara perlu dibetulkan — lihat kotak merah di bawah borang. / ${this.validationErrors.length} thing(s) need fixing — see the red box at the bottom of the form.`,
        [{ text: 'OK', role: 'cancel' }],
      );
      return;
    }
    if (!this.networkService.isOnline) {
      await this.showResult(
        'Tiada internet / No internet',
        'Sebut harga perlukan internet. Cuba lagi bila dalam talian. / Quotations need an internet connection. Try again when online.',
        [{ text: 'OK', role: 'cancel' }],
      );
      return;
    }

    this.isSaving = true;
    let saved: Quotation;
    try {
      await this.loadingService.show('Menyimpan sebut harga / Saving quotation...');
      const payload = this.buildPayload();
      saved = this.isEdit
        ? await firstValueFrom(this.quotationService.update(this.quotationId as number, payload))
        : await firstValueFrom(this.quotationService.create(payload));
    } catch (error: any) {
      const message = error?.error?.message || 'Gagal menyimpan sebut harga. Sila cuba lagi. / Failed to save the quotation. Please try again.';
      this.validationErrors = [message];
      await this.loadingService.hide();
      this.isSaving = false;
      await this.showResult('Gagal Disimpan / Not Saved', message, [{ text: 'OK', role: 'cancel' }]);
      return;
    }
    await this.loadingService.hide();
    this.isSaving = false;

    // Same as Add Booking: confirm, and only leave the page when the user taps.
    const goToDetail = () => {
      this.navCtrl.navigateRoot(`/quotation/${saved.id}`, { replaceUrl: true });
    };
    await this.showResult(
      this.isEdit ? 'Quotation Updated' : 'Quotation Created',
      '',
      [{ text: 'OK', handler: goToDetail }],
      false,
    );
  }

  /** Result pop-up (success or failure), like the Add Booking page's alert. */
  private async showResult(
    header: string,
    message: string,
    buttons: any[],
    dismissible = true,
  ): Promise<void> {
    const alert = await this.alertCtrl.create({
      header,
      message: message || undefined,
      buttons,
      backdropDismiss: dismissible,
    });
    await alert.present();
  }


  cancel(): void {
    if (this.isEdit) {
      this.navCtrl.navigateBack(`/quotation/${this.quotationId}`);
    } else {
      this.navCtrl.navigateBack('/quotation');
    }
  }

  onMenuItemTap(_item: MenuItem): void {
    this.menuCtrl.close(MENU_ID);
  }

  logOut(): void {
    this.authService.logout('/login');
    this.user = null;
    this.menuCtrl.enable(false, MENU_ID);
    this.menuCtrl.close(MENU_ID);
  }

  private loadUser(): void {
    this.user = this.authService.currentUser;
    if (!this.user) {
      try {
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
      } catch {
        this.user = null;
      }
    }
    this.menuItems = this.menuService.getVisibleMenuItemsForCurrentUser();
  }
}
