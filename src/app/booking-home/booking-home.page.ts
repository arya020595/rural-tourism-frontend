import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, MenuController, NavController } from '@ionic/angular';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { BookingStateService } from '../services/booking-state.service';
import { BookingService } from '../services/booking.service';
import { MenuItem, MenuService } from '../services/menu.service';
import { NetworkService } from '../services/network.service';
import {
  OfflineQueueService,
  QueueStatus,
} from '../services/offline-queue.service';
import { SyncService } from '../services/sync.service';
import { BookingDetail, BookingRow } from './booking-home.models';

interface CalendarCell {
  key: string | null;
  dayNumber: number | null;
  inCurrentMonth: boolean;
  bookings: BookingRow[];
}

type BookingViewMode = 'table' | 'calendar';

@Component({
  selector: 'app-booking-home',
  templateUrl: './booking-home.page.html',
  styleUrls: ['./booking-home.page.scss'],
})
export class BookingHomePage implements OnInit {
  user: any = null;
  menuItems: MenuItem[] = [];

  viewMode: BookingViewMode = 'table';
  loadingBookings = false;
  loadingPage = false;
  isOffline = false;

  readonly pendingCount$ = new BehaviorSubject<number>(0);
  failedCount = 0;
  queueStatusMap: Record<string, QueueStatus> = {};

  readonly dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly perPageOptions = [10, 25, 50, 100];
  pageSize = 10;

  currentPage = 1;
  currentMonthDate = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  calendarCells: CalendarCell[] = [];
  selectedDateKey: string | null = null;

  bookings: BookingDetail[] = [];
  statusFilter: 'all' | 'pending' | 'paid' | 'cancelled' = 'all';

  constructor(
    private menuCtrl: MenuController,
    private menuService: MenuService,
    private authService: AuthService,
    private bookingService: BookingService,
    private networkService: NetworkService,
    private offlineQueue: OfflineQueueService,
    private syncService: SyncService,
    private router: Router,
    private navCtrl: NavController,
    private bookingStateService: BookingStateService,
    private alertCtrl: AlertController
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.syncService.pendingCount$.subscribe((count) => {
      this.pendingCount$.next(count);
      void this.refreshFailedCount();
      void this.refreshQueueStatusMap();
    });
    void this.loadBookings();
  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, 'booking-menu');
    this.loadUser();
    void this.loadBookings();
  }

  onMenuItemTap(_item: MenuItem): void {
    this.menuCtrl.close('booking-menu');
  }

  logOut(): void {
    this.authService.logout('/login');
    this.user = null;
    this.menuCtrl.enable(false, 'booking-menu');
    this.menuCtrl.close('booking-menu');
  }

  setView(mode: BookingViewMode): void {
    this.viewMode = mode;
  }

  get filteredBookings(): BookingDetail[] {
    if (this.statusFilter === 'all') return this.bookings;
    return this.bookings.filter((b) => b.status === this.statusFilter);
  }

  get totalBookingPages(): number {
    return Math.max(1, Math.ceil(this.filteredBookings.length / this.pageSize));
  }

  get pagedBookings(): BookingDetail[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredBookings.slice(startIndex, startIndex + this.pageSize);
  }

  cycleStatusFilter(): void {
    const order: Array<'all' | 'pending' | 'paid' | 'cancelled'> = [
      'all',
      'pending',
      'paid',
      'cancelled',
    ];
    const next = (order.indexOf(this.statusFilter) + 1) % order.length;
    this.statusFilter = order[next];
    this.currentPage = 1;
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size);
    this.currentPage = 1;
  }

  changeBookingPage(page: number): void {
    const nextPage = Math.min(Math.max(1, page), this.totalBookingPages);
    if (nextPage === this.currentPage) {
      return;
    }

    this.loadingPage = true;
    setTimeout(() => {
      this.currentPage = nextPage;
      this.loadingPage = false;
    }, 300);
  }

  viewBookingDetails(booking: BookingDetail): void {
    this.bookingStateService.set(booking);
    this.router.navigate(['/booking-home/detail', booking.id], {
      state: { booking },
    });
  }

  get canCancelBooking(): boolean {
    return this.authService.hasPermission('booking:cancel');
  }

  editBooking(booking: BookingDetail): void {
    if (booking.status !== 'pending') {
      return;
    }

    this.router.navigate(['/booking-home/edit', booking.id], {
      state: { booking },
    });
  }

  async cancelBooking(booking: BookingDetail): Promise<void> {
    if (booking.status !== 'pending' || !booking.id) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Cancel Booking',
      message: `Are you sure you want to cancel booking #${booking.id}? This action cannot be undone.`,
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Yes, Cancel',
          role: 'confirm',
          cssClass: 'alert-btn-danger',
          handler: () => {
            this.bookingService.cancelBooking(booking.id!).subscribe({
              next: () => this.loadBookings(),
              error: (err) => console.error('[CancelBooking] error:', err),
            });
          },
        },
      ],
    });

    await alert.present();
  }

  goToPreviousMonth(): void {
    this.currentMonthDate = new Date(
      this.currentMonthDate.getFullYear(),
      this.currentMonthDate.getMonth() - 1,
      1
    );

    this.buildCalendar();
  }

  goToNextMonth(): void {
    this.currentMonthDate = new Date(
      this.currentMonthDate.getFullYear(),
      this.currentMonthDate.getMonth() + 1,
      1
    );

    this.buildCalendar();
  }

  selectDate(cell: CalendarCell): void {
    if (!cell.key) {
      return;
    }

    this.selectedDateKey = cell.key;
  }

  get currentMonthLabel(): string {
    return this.currentMonthDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  get selectedDateLabel(): string {
    if (!this.selectedDateKey) {
      return this.currentMonthLabel;
    }

    const date = this.parseDateKey(this.selectedDateKey);

    return `${this.getOrdinal(date.getDate())} ${date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
      }
    )}`;
  }

  get selectedDateBookings(): BookingRow[] {
    if (!this.selectedDateKey) {
      return [];
    }

    return this.bookings
      .filter((booking) => booking.bookedDate === this.selectedDateKey)
      .filter((booking) => booking.status !== 'cancelled')
      .sort((a, b) => a.serviceName.localeCompare(b.serviceName));
  }

  trackByCell(index: number): number {
    return index;
  }

  isSelectedDay(cell: CalendarCell): boolean {
    return !!cell.key && cell.key === this.selectedDateKey;
  }

  hasBookings(cell: CalendarCell): boolean {
    return cell.bookings.length > 0;
  }

  getDayStatusClass(cell: CalendarCell): string {
    if (!cell.inCurrentMonth || !cell.key) {
      return '';
    }

    if (this.isSelectedDay(cell)) {
      return 'selected';
    }

    if (!cell.bookings.length) {
      return '';
    }

    return cell.bookings.some((booking) => booking.status === 'paid')
      ? 'paid'
      : 'pending';
  }

  getBookingStatusClass(booking: BookingRow): string {
    return booking.status === 'paid' ? 'paid' : 'pending';
  }

  getBookingStatusText(booking: BookingRow): string {
    return booking.status === 'paid' ? 'Paid' : 'Pending';
  }

  getSelectedDateStatusClass(): string {
    if (!this.selectedDateBookings || this.selectedDateBookings.length === 0) {
      return '';
    }
    return this.selectedDateBookings.some((b) => b.status === 'paid')
      ? 'paid'
      : 'pending';
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

  private async loadBookings(): Promise<void> {
    const operatorId = this.user?.id || this.authService.currentUser?.id;
    if (!operatorId) {
      this.bookings = [];
      this.buildCalendar();
      return;
    }

    if (!this.networkService.isOnline) {
      await this.loadBookingsFromCache();
      return;
    }

    this.loadingBookings = true;

    try {
      const response = await firstValueFrom(
        this.bookingService.getBookings({
          page: 1,
          per_page: 1000,
          user_id: String(operatorId),
        })
      );

      const rows = Array.isArray(response?.data) ? response.data : [];
      this.bookings = rows
        .map((row: any) => this.mapBookingRow(row))
        .filter((booking: BookingDetail | null): booking is BookingDetail => {
          return !!booking && !!booking.bookedDate && !!booking.id;
        })
        .sort(
          (a: BookingDetail, b: BookingDetail) => Number(b.id) - Number(a.id)
        );
      this.currentPage = 1;
      this.isOffline = false;

      await this.offlineQueue.cacheBookings(rows);
    } catch (error) {
      console.error('[booking-home] failed to load bookings', error);
      await this.loadBookingsFromCache();
    } finally {
      this.loadingBookings = false;
      this.buildCalendar();
      void this.refreshQueueStatusMap();
    }
  }

  private async loadBookingsFromCache(): Promise<void> {
    this.loadingBookings = true;
    try {
      const cached = await this.offlineQueue.getCachedBookings();
      this.bookings = cached
        .map((row: any) => this.mapBookingRow(row))
        .filter((booking: BookingDetail | null): booking is BookingDetail => {
          return !!booking && !!booking.bookedDate && !!booking.id;
        })
        .sort(
          (a: BookingDetail, b: BookingDetail) => Number(b.id) - Number(a.id)
        );
      this.currentPage = 1;
      this.isOffline = !this.networkService.isOnline;
    } finally {
      this.loadingBookings = false;
      this.buildCalendar();
    }
  }

  async openConflictResolve(): Promise<void> {
    const failed = await this.offlineQueue.getFailedItems();
    if (!failed.length) return;

    this.router.navigate(['/booking-home/conflict-resolve'], {
      state: { queueItem: failed[0] },
    });
  }

  private async refreshFailedCount(): Promise<void> {
    const failed = await this.offlineQueue.getFailedItems();
    this.failedCount = failed.length;
  }

  private async refreshQueueStatusMap(): Promise<void> {
    const allItems = await this.offlineQueue.getAllQueueItems();
    const map: Record<string, QueueStatus> = {};
    for (const item of allItems) {
      // local_booking_id is the booking's server ID (as string) for EDITs,
      // or a UUID for CREATEs — only map items that have a server ID
      if (item.server_booking_id) {
        map[String(item.server_booking_id)] = item.status;
      }
    }
    this.queueStatusMap = map;
  }

  private buildCalendar(): void {
    const year = this.currentMonthDate.getFullYear();
    const month = this.currentMonthDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const bookingsByDate = new Map<string, BookingRow[]>();
    this.bookings.forEach((booking) => {
      // Skip cancelled bookings on calendar display
      if (booking.status === 'cancelled') {
        return;
      }

      const bookingDate = new Date(booking.bookedDate);
      if (
        bookingDate.getFullYear() === year &&
        bookingDate.getMonth() === month
      ) {
        const key = this.toDateKey(bookingDate);
        const current = bookingsByDate.get(key) || [];
        current.push(booking);
        bookingsByDate.set(key, current);
      }
    });

    const cells: CalendarCell[] = [];

    for (let i = 0; i < firstDayIndex; i += 1) {
      cells.push({
        key: null,
        dayNumber: null,
        inCurrentMonth: false,
        bookings: [],
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const key = this.toDateKey(date);

      cells.push({
        key,
        dayNumber: day,
        inCurrentMonth: true,
        bookings: bookingsByDate.get(key) || [],
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push({
        key: null,
        dayNumber: null,
        inCurrentMonth: false,
        bookings: [],
      });
    }

    this.calendarCells = cells;

    const currentMonthKeys = new Set(
      cells.filter((cell) => !!cell.key).map((cell) => cell.key as string)
    );

    if (this.selectedDateKey && currentMonthKeys.has(this.selectedDateKey)) {
      return;
    }

    const firstBookedDate = cells.find(
      (cell) => !!cell.key && cell.bookings.length > 0
    );

    this.selectedDateKey = firstBookedDate?.key || null;
  }

  private mapBookingRow(record: any): BookingDetail | null {
    const bookingType = String(record?.booking_type || '').toLowerCase();
    const bookedDate = this.resolveBookedDate(record);
    const type = this.normalizeBookingType(bookingType);

    if (!type || !bookedDate) {
      return null;
    }

    const serviceName = this.resolveServiceName(record, type);
    const status = String(record?.status || 'booked').toLowerCase();

    return {
      id: String(record?.id || ''),
      bookedDate,
      serviceName,
      type,
      status: this.normalizeStatus(status),
      time: this.formatTime(
        record?.activity_time || record?.time || record?.activity_date
      ),
      fullName: String(record?.tourist_full_name || ''),
      phone: String(
        record?.phone_number || record?.phone || record?.contact_phone || ''
      ),
      email: String(record?.email || record?.contact_email || ''),
      nationality: this.normalizeNationality(record?.citizenship),
      domesticPax: this.toNumber(record?.no_of_pax_domestik),
      internationalPax: this.toNumber(record?.no_of_pax_antarbangsa),
      totalAmount: this.toNumber(record?.total_price),
      operatorName: String(record?.operator_name || ''),
      activityName:
        type === 'Activity' ? String(record?.product_name || '') : undefined,
      checkInDate:
        type === 'Accommodation'
          ? this.formatDateForInput(record?.check_in_date)
          : undefined,
      checkOutDate:
        type === 'Accommodation'
          ? this.formatDateForInput(record?.check_out_date)
          : undefined,
      nights:
        type === 'Accommodation'
          ? this.toNumber(record?.total_of_night)
          : undefined,
      homestay:
        type === 'Accommodation'
          ? String(record?.product_name || '')
          : undefined,
      packageName:
        type === 'Package'
          ? String(record?.product_name || 'Package')
          : undefined,
      packagePrice:
        type === 'Package' ? this.toNumber(record?.total_price) : undefined,
      customerType:
        String(record?.customer_type || record?.customerType || '')
          .toLowerCase()
          .trim() === 'company'
          ? 'company'
          : 'tourist',
      createdAt: record?.created_at || record?.createdAt,
      updatedAt: record?.updated_at || record?.updatedAt,
    };
  }

  private resolveBookedDate(record: any): string {
    return this.formatDateForInput(
      record?.activity_date ||
        record?.check_in_date ||
        record?.receipt_created_at ||
        record?.created_at ||
        record?.updated_at ||
        ''
    );
  }

  private normalizeBookingType(value: string): BookingDetail['type'] | null {
    switch (value) {
      case 'activity':
        return 'Activity';
      case 'accommodation':
        return 'Accommodation';
      case 'package':
        return 'Package';
      default:
        return null;
    }
  }

  private resolveServiceName(record: any, type: BookingDetail['type']): string {
    if (type === 'Activity') {
      return String(
        record?.product_name || record?.activity_name || 'Activity'
      );
    }

    if (type === 'Accommodation') {
      return String(
        record?.product_name || record?.check_in_name || 'Accommodation'
      );
    }

    const packageCompanies = Array.isArray(record?.package_companies)
      ? record.package_companies
      : [];
    const packageNames = packageCompanies
      .map((item: any) =>
        String(item?.description || item?.referee_company || '').trim()
      )
      .filter((name: string) => name.length > 0);

    if (packageNames.length > 0) {
      return packageNames.join(', ');
    }

    return String(record?.product_name || 'Package');
  }

  private normalizeStatus(value: string): BookingDetail['status'] {
    const normalized = String(value || '')
      .trim()
      .toLowerCase();
    if (normalized === 'booked') {
      return 'pending';
    }

    if (normalized === 'canceled') {
      return 'cancelled';
    }

    if (
      [
        'paid',
        'pending',
        'cancelled',
        'confirmed',
        'completed',
        'rejected',
      ].includes(normalized)
    ) {
      return normalized as BookingDetail['status'];
    }

    return 'pending';
  }

  private normalizeNationality(
    value: any
  ): 'domestic' | 'international' | 'both' {
    const normalized = String(value || '')
      .trim()
      .toLowerCase();
    if (normalized === 'international') return 'international';
    if (normalized === 'both') return 'both';
    return 'domestic';
  }

  private toNumber(value: any): number {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  private formatTime(value: any): string | undefined {
    const raw = String(value || '').trim();
    if (!raw) {
      return undefined;
    }

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return raw || undefined;
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private formatDateForInput(value: any): string {
    const raw = String(value || '').trim();
    if (!raw) {
      return '';
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return raw;
    }

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return raw;
    }

    return this.toDateKey(date);
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private parseDateKey(key: string): Date {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
  }

  private getOrdinal(day: number): string {
    if (day > 3 && day < 21) return `${day}th`;

    switch (day % 10) {
      case 1:
        return `${day}st`;
      case 2:
        return `${day}nd`;
      case 3:
        return `${day}rd`;
      default:
        return `${day}th`;
    }
  }
}
