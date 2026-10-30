import { Component, OnDestroy, OnInit } from '@angular/core';
import { MenuController, NavController } from '@ionic/angular';
import { Subject, Subscription, debounceTime, firstValueFrom } from 'rxjs';
import { toDisplayDate } from '../../booking-forms/components/booking-date-sheet/booking-date-sheet.component';
import { AuthService } from '../../services/auth.service';
import { MenuItem, MenuService } from '../../services/menu.service';
import { NativeDownloadService } from '../../services/native-download.service';
import { NetworkService } from '../../services/network.service';
import { QuotationService } from '../../services/quotation.service';
import { LoadingService } from '../../services/loading.service';
import { ToastService } from '../../services/toast.service';
import {
  Quotation,
  QuotationListFilter,
  QUOTATION_STATUS_LABELS,
} from '../quotation.models';

const MENU_ID = 'quotation-list-menu';

@Component({
  selector: 'app-quotation-list',
  templateUrl: './quotation-list.page.html',
  styleUrls: ['./quotation-list.page.scss'],
})
export class QuotationListPage implements OnInit, OnDestroy {
  readonly menuId = MENU_ID;
  user: any = null;
  menuItems: MenuItem[] = [];

  quotations: Quotation[] = [];
  readonly statusLabels = QUOTATION_STATUS_LABELS;
  readonly perPageOptions = [10, 25, 50];

  activeFilter: QuotationListFilter = 'all';
  search = '';
  // Created date range (YYYY-MM-DD, Malaysia days, both included).
  createdFrom = '';
  createdTo = '';
  dateSheet: { open: boolean; field: 'from' | 'to' } = { open: false, field: 'from' };
  readonly displayDate = toDisplayDate;
  page = 1;
  perPage = 10;
  total = 0;
  totalPages = 1;
  isLoading = false;
  loadError = '';
  isOffline = false;

  private search$ = new Subject<string>();
  private subscriptions = new Subscription();

  constructor(
    private menuCtrl: MenuController,
    private navCtrl: NavController,
    private menuService: MenuService,
    private authService: AuthService,
    private quotationService: QuotationService,
    private networkService: NetworkService,
    private nativeDownload: NativeDownloadService,
    private loadingService: LoadingService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.search$.pipe(debounceTime(350)).subscribe(() => {
        this.page = 1;
        this.load();
      }),
    );
  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, MENU_ID);
    this.loadUser();
    this.load();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get canCreate(): boolean {
    return this.authService.hasPermission('quotation:create');
  }

  async load(): Promise<void> {
    this.isOffline = !this.networkService.isOnline;
    if (this.isOffline) {
      this.quotations = [];
      return;
    }

    this.isLoading = true;
    this.loadError = '';
    try {
      const res = await firstValueFrom(
        this.quotationService.list({
          page: this.page,
          per_page: this.perPage,
          search: this.search.trim(),
          status: this.activeFilter,
          created_from: this.createdFrom,
          created_to: this.createdTo,
        }),
      );
      this.quotations = res.data || [];
      this.total = res.meta?.total ?? this.quotations.length;
      this.totalPages = Math.max(res.meta?.total_pages || 1, 1);
    } catch (error: any) {
      this.quotations = [];
      this.loadError =
        error?.error?.message || 'Gagal memuatkan sebut harga / Failed to load quotations.';
    } finally {
      this.isLoading = false;
    }
  }

  onSearchInput(value: string): void {
    this.search = value;
    this.search$.next(value);
  }

  openDateSheet(field: 'from' | 'to'): void {
    this.dateSheet = { open: true, field };
  }

  onDateSelected(iso: string): void {
    if (this.dateSheet.field === 'from') {
      this.createdFrom = iso;
      if (this.createdTo && this.createdTo < iso) this.createdTo = iso;
    } else {
      this.createdTo = iso;
      if (this.createdFrom && this.createdFrom > iso) this.createdFrom = iso;
    }
    this.dateSheet = { ...this.dateSheet, open: false };
    this.page = 1;
    this.load();
  }

  clearDates(): void {
    if (!this.createdFrom && !this.createdTo) return;
    this.createdFrom = '';
    this.createdTo = '';
    this.page = 1;
    this.load();
  }

  /** Status column header: tap to step through the statuses (like Booking). */
  cycleStatusFilter(): void {
    const order: QuotationListFilter[] = ['all', 'sent', 'accepted', 'expired', 'cancelled'];
    this.activeFilter = order[(order.indexOf(this.activeFilter) + 1) % order.length];
    this.page = 1;
    this.load();
  }

  get statusFilterLabel(): string {
    return this.activeFilter === 'all' ? 'Status ⇅' : `${this.statusLabels[this.activeFilter]} ▲`;
  }

  setPerPage(value: number): void {
    this.perPage = value;
    this.page = 1;
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    this.page = page;
    this.load();
  }

  get pageNumbers(): number[] {
    const start = Math.max(1, Math.min(this.page - 2, this.totalPages - 4));
    const end = Math.min(this.totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  get startEntry(): number {
    return this.total === 0 ? 0 : (this.page - 1) * this.perPage + 1;
  }

  get endEntry(): number {
    return Math.min(this.page * this.perPage, this.total);
  }

  add(): void {
    this.navCtrl.navigateForward('/quotation/add');
  }

  view(quotation: Quotation): void {
    this.navCtrl.navigateForward(`/quotation/${quotation.id}`);
  }

  edit(quotation: Quotation): void {
    if (!quotation.can_edit) return;
    this.navCtrl.navigateForward(`/quotation/edit/${quotation.id}`);
  }

  /** Opens / shares the PDF (share sheet on the app, download on the web). */
  async pdf(quotation: Quotation): Promise<void> {
    try {
      await this.loadingService.show('Menjana PDF / Generating PDF...');
      const blob = await firstValueFrom(this.quotationService.getPdf(quotation.id));
      await this.nativeDownload.downloadBlob(
        blob,
        `${quotation.quotation_no}.pdf`,
        'Kongsi sebut harga / Share quotation',
      );
    } catch {
      this.toastService.error('Gagal menjana PDF / Failed to generate the PDF.');
    } finally {
      await this.loadingService.hide();
    }
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '-';
    const [year, month, day] = String(value).slice(0, 10).split('-');
    return `${day}-${month}-${year}`;
  }

  /** When it was saved in the system, as the Malaysia date (DD-MM-YYYY). */
  formatCreatedDate(value: string | null | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kuala_Lumpur',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).formatToParts(date);
    const part = (type: string) => parts.find((p) => p.type === type)?.value || '';
    return `${part('day')}-${part('month')}-${part('year')}`;
  }

  formatMoney(value: string | number): string {
    return Number(value || 0).toLocaleString('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  daysLeftText(quotation: Quotation): string {
    if (quotation.status !== 'sent') return '';
    const days = quotation.days_left;
    if (days === null || days === undefined) return '';
    if (days === 0) return 'Tamat hari ini / Ends today';
    return `${days} hari lagi / ${days} day${days === 1 ? '' : 's'} left`;
  }

  trackById(_: number, quotation: Quotation): number {
    return quotation.id;
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
