import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { forkJoin } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { BookingService } from '../services/booking.service';
import { MenuItem, MenuService } from '../services/menu.service';
import { Transaction, TransactionTab } from './my-transaction.models';

@Component({
  selector: 'app-my-transaction',
  templateUrl: './my-transaction.page.html',
  styleUrls: ['./my-transaction.page.scss'],
})
export class MyTransactionPage implements OnInit {
  user: any = null;
  menuItems: MenuItem[] = [];

  selectedTab: TransactionTab = 'activity';
  selectedDateIso: string = this.toIsoDate(new Date());
  isDateModalOpen = false;
  isLoading = false;

  readonly pageSize = 6;
  currentPage = 1;

  private allTransactions: Transaction[] = [];

  constructor(
    private menuCtrl: MenuController,
    private menuService: MenuService,
    private authService: AuthService,
    private bookingService: BookingService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.loadTransactions();
  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, 'my-transaction-menu');
    this.loadUser();
    this.loadTransactions();
  }

  onMenuItemTap(_item: MenuItem): void {
    this.menuCtrl.close('my-transaction-menu');
  }

  logOut(): void {
    this.authService.logout('/login');
    this.user = null;
    this.menuCtrl.enable(false, 'my-transaction-menu');
    this.menuCtrl.close('my-transaction-menu');
  }

  selectTab(tab: TransactionTab): void {
    this.selectedTab = tab;
    this.currentPage = 1;
  }

  openDatePicker(): void {
    this.isDateModalOpen = true;
  }

  closeDatePicker(): void {
    this.isDateModalOpen = false;
  }

  applyDateSelection(): void {
    this.isDateModalOpen = false;
    this.currentPage = 1;
  }

  onResetDate(): void {
    this.selectedDateIso = this.toIsoDate(new Date());
    this.currentPage = 1;
  }

  get selectedDateLabel(): string {
    if (this.selectedDateIso === this.toIsoDate(new Date())) {
      return 'Select Date';
    }
    return this.formatDateLabel(this.selectedDateIso);
  }

  get filteredTransactions(): Transaction[] {
    let list = this.allTransactions.filter(
      (t) => t.bookingType === this.selectedTab,
    );

    if (this.selectedDateIso !== this.toIsoDate(new Date())) {
      list = list.filter((t) => t.date.slice(0, 10) === this.selectedDateIso);
    }

    return list;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTransactions.length / this.pageSize));
  }

  get visibleTransactions(): Transaction[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTransactions.slice(start, start + this.pageSize);
  }

  get startEntry(): number {
    if (this.filteredTransactions.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endEntry(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredTransactions.length);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get activeTabLabel(): string {
    switch (this.selectedTab) {
      case 'activity': return 'Activity';
      case 'accommodation': return 'Accommodation';
      default: return 'Package';
    }
  }

  changePage(page: number): void {
    const next = Math.min(Math.max(1, page), this.totalPages);
    if (next !== this.currentPage) {
      this.currentPage = next;
    }
  }

  viewReceipt(transaction: Transaction): void {
    const id = transaction.numericId ?? Number(transaction.id);
    const route = this.getReceiptRoute(transaction.bookingType);
    this.router.navigate([route, id], { state: { booking: transaction._raw ?? transaction } });
  }

  private getReceiptRoute(type: TransactionTab): string {
    switch (type) {
      case 'accommodation': return '/receipt';
      case 'package': return '/receipt-package';
      default: return '/receipt-activity';
    }
  }

  private loadTransactions(): void {
    this.isLoading = true;

    forkJoin({
      bookings: this.bookingService.getBookings({ status: 'paid', per_page: 1000 }),
      packageReferrals: this.bookingService.getPackageBookings({ status: 'paid', per_page: 1000 }),
    }).subscribe({
      next: ({ bookings, packageReferrals }) => {
        const rawBookings: any[] = Array.isArray(bookings?.data) ? bookings.data : [];
        const rawReferrals: any[] = Array.isArray(packageReferrals?.data) ? packageReferrals.data : [];

        // Get the current company's ID to distinguish Company A vs Company B
        const myCompanyId = Number(this.user?.company_id ?? 0);

        // Company A: bookings where this company is the creator (companyId matches)
        // These come from the standard bookings endpoint with booking_type=package
        const creatorBookings = rawBookings
          .filter((b) => String(b.booking_type).toLowerCase() === 'package')
          .map((b) => this.mapCreatorPackage(b));

        // Company B: referral rows where this company is the referee (received referral)
        // Exclude any referral where this company is also the referrer (already shown as creator)
        const referralBookings = rawReferrals
          .filter((r) => Number(r.referee_id) === myCompanyId && Number(r.referrer_id) !== myCompanyId)
          .map((r) => this.mapReferralPackage(r));

        // Non-package bookings (activity + accommodation) come from the standard endpoint
        const otherBookings = rawBookings
          .filter((b) => String(b.booking_type).toLowerCase() !== 'package')
          .map((b) => this.mapToTransaction(b));

        this.allTransactions = [...otherBookings, ...creatorBookings, ...referralBookings];
        this.currentPage = 1;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[MyTransaction] API error:', err);
        this.allTransactions = [];
        this.isLoading = false;
      },
    });
  }

  // Company A view: one card per booking, with package_companies list
  private mapCreatorPackage(b: any): Transaction {
    const date = (
      b.activity_date || b.receipt_created_at || b.created_at || ''
    ).slice(0, 10);

    const pax = Number(b.no_of_pax_domestik || 0) + Number(b.no_of_pax_antarbangsa || 0);
    const customerName = b.customer_type === 'company'
      ? (b.company_name || b.tourist_full_name || '')
      : (b.tourist_full_name || b.company_name || '');

    return {
      id: b.id,
      title: 'Package',
      name: customerName,
      date,
      pax,
      totalPrice: Number(b.total_price || 0),
      status: b.status || 'paid',
      bookingType: 'package',
      numericId: Number(b.id),
      packageCompanies: Array.isArray(b.package_companies) ? b.package_companies : [],
      isReferral: false,
      _raw: b,
    };
  }

  // Company B view: one card per referral row
  private mapReferralPackage(r: any): Transaction {
    const booking = r.booking ?? {};
    const date = (
      booking.activity_date || booking.receipt_created_at || booking.created_at || r.created_at || ''
    ).slice(0, 10);

    const customerName = booking.customer_type === 'company'
      ? (booking.company_name || booking.tourist_full_name || '')
      : (booking.tourist_full_name || booking.company_name || '');

    return {
      id: r.id,
      title: 'Package (Referral from ' + (r.referral_company || 'Unknown') + ')',
      name: customerName,
      date,
      pax: Number(booking.total_pax || 0),
      totalPrice: Number(r.per_price || 0),
      status: booking.status || 'paid',
      bookingType: 'package',
      numericId: Number(booking.id),
      packageName: r.description || '',
      referralBy: r.referral_company || '',
      perPrice: Number(r.per_price || 0),
      isReferral: true,
      _raw: r.booking ?? r,
    };
  }

  private mapToTransaction(b: any): Transaction {
    const bookingType = String(b.booking_type || '').toLowerCase() as TransactionTab;
    const validType: TransactionTab =
      bookingType === 'accommodation' ? 'accommodation'
      : bookingType === 'package' ? 'package'
      : 'activity';

    const date = (
      b.activity_date ||
      b.check_in_date ||
      b.receipt_created_at ||
      b.created_at ||
      ''
    ).slice(0, 10);

    const pax = Number(b.no_of_pax_domestik || 0) + Number(b.no_of_pax_antarbangsa || 0);

    return {
      id: b.id,
      title: b.product_name || 'Booking',
      name: b.tourist_full_name || '',
      date,
      time: b.activity_date ? this.extractTime(b.activity_date) : undefined,
      pax,
      totalPrice: Number(b.total_price || 0),
      status: 'Paid',
      bookingType: validType,
      numericId: Number(b.id),
      checkInDate: validType === 'accommodation' ? (b.check_in_date || '').slice(0, 10) : undefined,
      checkOutDate: validType === 'accommodation' ? (b.check_out_date || '').slice(0, 10) : undefined,
      _raw: b,
    };
  }

  private extractTime(dateStr: string): string | undefined {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return undefined;
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
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

  private formatDateLabel(isoDate: string): string {
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return isoDate;
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
