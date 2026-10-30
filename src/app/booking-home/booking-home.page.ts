import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { ToastService } from '../services/toast.service';
import { BookingDetail, BookingRow } from './booking-home.models';
import { activityDateKey, activityTime } from '../utils/activity-date.util';
import { packageDays, packageItemDays } from '../utils/package-item-dates.util';

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

  referralBookings: BookingDetail[] = [];
  statusFilter: 'all' | 'pending' | 'paid' | 'cancelled' = 'all';
  typeFilter: 'all' | 'Activity' | 'Accommodation' | 'Package' = 'all';

  constructor(
    private menuCtrl: MenuController,
    private menuService: MenuService,
    private authService: AuthService,
    private bookingService: BookingService,
    private networkService: NetworkService,
    private offlineQueue: OfflineQueueService,
    private syncService: SyncService,
    private router: Router,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private bookingStateService: BookingStateService,
    private alertCtrl: AlertController,
    private toastService: ToastService,
  ) {}

  // Calendar month/year picker (same pop-up as the dashboard Trend filter).
  monthPickerOpen = false;
  monthPickerYearView = false;
  readonly monthPickerMin = '2020-01-01';

  get monthPickerMax(): string {
    return `${new Date().getFullYear() + 5}-12-31`;
  }

  /** Viewed month as YYYY-MM, for the picker. */
  get currentMonthValue(): string {
    const month = String(this.currentMonthDate.getMonth() + 1).padStart(2, '0');
    return `${this.currentMonthDate.getFullYear()}-${month}`;
  }

  get currentMonthName(): string {
    return this.currentMonthDate.toLocaleDateString('en-US', { month: 'long' });
  }

  get currentYear(): number {
    return this.currentMonthDate.getFullYear();
  }

  /** Tap the month name (month grid) or the year (year list first). */
  openMonthPicker(yearView: boolean): void {
    this.monthPickerYearView = yearView;
    this.monthPickerOpen = true;
  }

  onCalendarMonthSelected(value: string): void {
    this.monthPickerOpen = false;
    const [year, month] = value.split('-').map(Number);
    if (!year || !month) return;
    this.currentMonthDate = new Date(year, month - 1, 1);
    this.buildCalendar();
  }

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
    this.applyCalendarQuery();
    void this.loadBookings();
  }

  /**
   * ?view=calendar&date=YYYY-MM-DD (e.g. back from a receipt made from a
   * quotation): open the calendar on that month with the day selected.
   */
  private applyCalendarQuery(): void {
    const query = this.route.snapshot.queryParamMap;
    if (query.get('view') !== 'calendar') return;
    this.viewMode = 'calendar';
    const date = query.get('date') || '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month] = date.split('-').map(Number);
      this.currentMonthDate = new Date(year, month - 1, 1);
      this.selectedDateKey = date;
      this.buildCalendar();
    }
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
    return this.bookings.filter((b) => {
      const statusMatch = this.statusFilter === 'all' || b.status === this.statusFilter;
      const typeMatch = this.typeFilter === 'all' || b.type === this.typeFilter;
      return statusMatch && typeMatch;
    });
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
      'all', 'pending', 'paid', 'cancelled',
    ];
    const next = (order.indexOf(this.statusFilter) + 1) % order.length;
    this.statusFilter = order[next];
    this.currentPage = 1;
  }

  cycleTypeFilter(): void {
    const order: Array<'all' | 'Activity' | 'Accommodation' | 'Package'> = [
      'all', 'Activity', 'Accommodation', 'Package',
    ];
    const next = (order.indexOf(this.typeFilter) + 1) % order.length;
    this.typeFilter = order[next];
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
    // A referral from another company is view only: the chip shows who is
    // coming and when; the rest of their booking isn't ours to open.
    if (booking.isReferral) return;
    this.bookingStateService.set(booking);
    this.router.navigate(['/booking-home/detail', booking.id], {
      state: { booking },
    });
  }

  get canCancelBooking(): boolean {
    return this.authService.hasPermission('booking:cancel');
  }

  editBooking(booking: BookingDetail): void {
    if (booking.status !== 'pending' || booking.isLegacy) {
      return;
    }

    this.router.navigate(['/booking-home/edit', booking.id], {
      state: { booking },
    });
  }

  async cancelBooking(booking: BookingDetail): Promise<void> {
    if (booking.status !== 'pending' || !booking.id || booking.isLegacy) {
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
              next: async () => {
                await this.toastService.success('Booking cancelled successfully');
                await this.loadBookings();
              },
              error: async (err) => {
                console.error('[CancelBooking] error:', err);
                await this.toastService.error(
                  err?.error?.message || 'Failed to cancel booking',
                );
              },
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

  get selectedDateBookings(): BookingDetail[] {
    if (!this.selectedDateKey) {
      return [];
    }

    return this.calendarBookings
      .filter((booking) => {
        if (booking.status === 'cancelled') return false;

        // Packages with item dates (incl. referrals): any of those days.
        if (booking.calendarDays?.length) {
          return booking.calendarDays.includes(this.selectedDateKey!);
        }

        // For accommodation, match any night of the stay: check-in inclusive,
        // check-out exclusive (same range the calendar colours). e.g. check-in
        // 10 Aug / check-out 12 Aug shows the booking on the 10th and 11th, but
        // not the 12th (the checkout day itself isn't a booked night).
        if (booking.type === 'Accommodation' && booking.checkInDate) {
          if (booking.checkOutDate) {
            return (
              this.selectedDateKey! >= booking.checkInDate &&
              this.selectedDateKey! < booking.checkOutDate
            );
          }
          return this.selectedDateKey! === booking.checkInDate;
        }

        // For activity/package, match the single booked date
        return booking.bookedDate === this.selectedDateKey;
      })
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
      this.menuService.getVisibleMenuItemsForCurrentUser();
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
        })
      );

      const rows = Array.isArray(response?.data) ? response.data : [];
      this.bookings = rows
        .map((row: any) => this.mapBookingRow(row))
        .filter((booking: BookingDetail | null): booking is BookingDetail => {
          return !!booking && !!booking.bookedDate && !!booking.id;
        })
        .sort((a: BookingDetail, b: BookingDetail) =>
          this.compareBookings(a, b)
        );
      this.currentPage = 1;
      this.isOffline = false;

      await this.offlineQueue.cacheBookings(rows);
      await this.loadReferralBookings();
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
        .sort((a: BookingDetail, b: BookingDetail) =>
          this.compareBookings(a, b)
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

  /** Own bookings plus package items other companies referred to us. */
  get calendarBookings(): BookingDetail[] {
    return [...this.bookings, ...this.referralBookings];
  }

  /**
   * Package items other companies booked with us (we are the referee), so
   * our calendar shows when those package customers come. Only items that
   * have their own dates; each shows on its own days. Online only.
   */
  private async loadReferralBookings(): Promise<void> {
    const myCompanyId = Number(this.authService.currentUser?.company_id ?? 0);
    if (!myCompanyId) {
      this.referralBookings = [];
      return;
    }

    try {
      const items: any[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const res: any = await firstValueFrom(
          this.bookingService.getPackageBookings({ page, per_page: 100 }),
        );
        items.push(...(Array.isArray(res?.data) ? res.data : []));
        totalPages = Number(res?.meta?.total_pages ?? 1);
        page++;
      } while (page <= totalPages && page <= 20);

      this.referralBookings = items
        .filter(
          (item) =>
            Number(item?.referee_id) === myCompanyId &&
            Number(item?.referrer_id) !== myCompanyId &&
            item?.booking?.id,
        )
        .map((item): BookingDetail | null => {
          const days = packageItemDays(item);
          if (!days.length) return null;
          const booking = item.booking;
          const status = this.normalizeStatus(String(booking?.status || 'booked'));
          const type = String(item?.product_type || '').toLowerCase();
          const ddmmyyyy = (key: string) => key.split('-').reverse().join('/');
          const time = activityTime(item?.activity_date);
          const checkIn = activityDateKey(item?.check_in_date);
          const checkOut = activityDateKey(item?.check_out_date);
          let when = '';
          if (type === 'accommodation' && checkIn) {
            when = checkOut ? `${ddmmyyyy(checkIn)} – ${ddmmyyyy(checkOut)}` : ddmmyyyy(checkIn);
          } else if (time) {
            const [h, m] = time.split(':').map(Number);
            when = `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
          }
          return {
            id: String(booking.id),
            numericId: Number(booking.id) || undefined,
            bookedDate: days[0],
            phone: String(booking?.phone_number || ''),
            referralPax:
              Number(booking?.total_pax) ||
              Number(booking?.no_of_pax_domestik || 0) + Number(booking?.no_of_pax_antarbangsa || 0),
            referralWhen: when || undefined,
            referralWhenLabel: type === 'accommodation' && checkIn ? 'Stay' : 'Time',
            serviceName: `${String(item?.description || 'Package')} — ${String(
              item?.referral_company || 'referral',
            )}`,
            type: 'Package',
            status,
            fullName: String(booking?.tourist_full_name || ''),
            calendarDays: days,
            isReferral: true,
          };
        })
        .filter((b): b is BookingDetail => !!b);
    } catch (error) {
      console.error('[booking-home] failed to load package referrals', error);
      this.referralBookings = [];
    }
  }

  private buildCalendar(): void {
    const year = this.currentMonthDate.getFullYear();
    const month = this.currentMonthDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const bookingsByDate = new Map<string, BookingRow[]>();
    this.calendarBookings.forEach((booking) => {
      // Skip cancelled bookings on calendar display
      if (booking.status === 'cancelled') {
        return;
      }

      // Packages with item dates (incl. referrals): mark each of those days.
      if (booking.calendarDays?.length) {
        booking.calendarDays.forEach((key) => {
          const day = this.parseDateKey(key);
          if (day.getFullYear() === year && day.getMonth() === month) {
            const current = bookingsByDate.get(key) || [];
            if (!current.includes(booking)) current.push(booking);
            bookingsByDate.set(key, current);
          }
        });
        return;
      }

      // For accommodation, colour every NIGHT of the stay: from check-in up to
      // (but not including) the check-out date. e.g. check-in 7th, check-out 9th
      // colours the 7th and 8th. The detail panel (selectedDateBookings) still
      // only surfaces the booking on the check-in date.
      if (
        booking.type === 'Accommodation' &&
        booking.checkInDate &&
        booking.checkOutDate
      ) {
        // Parse locally (avoids the UTC shift new Date('YYYY-MM-DD') causes).
        const night = this.parseDateKey(booking.checkInDate);
        const checkOut = this.parseDateKey(booking.checkOutDate);
        // Iterate nights: check-in inclusive, check-out exclusive.
        while (night < checkOut) {
          if (night.getFullYear() === year && night.getMonth() === month) {
            const key = this.toDateKey(night);
            const current = bookingsByDate.get(key) || [];
            if (!current.includes(booking)) current.push(booking);
            bookingsByDate.set(key, current);
          }
          night.setDate(night.getDate() + 1);
        }
        return;
      }

      // Accommodation with a check-in but no check-out: colour the single night.
      if (booking.type === 'Accommodation' && booking.checkInDate) {
        const checkIn = this.parseDateKey(booking.checkInDate);
        if (checkIn.getFullYear() === year && checkIn.getMonth() === month) {
          const current = bookingsByDate.get(booking.checkInDate) || [];
          if (!current.includes(booking)) current.push(booking);
          bookingsByDate.set(booking.checkInDate, current);
        }
        return;
      }

      // For activity/package, mark the single booked date
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

  /**
   * Order bookings newest-first. Offline-created bookings have a UUID id (not
   * numeric) and are always the most recent, so they sort ahead of any
   * server booking. Among server bookings, higher numeric id wins.
   * Using Number(id) alone would yield NaN for UUIDs and drop offline
   * bookings out of the table's first page (they only showed in the calendar).
   */
  private compareBookings(a: BookingDetail, b: BookingDetail): number {
    const aNum = Number(a.id);
    const bNum = Number(b.id);
    const aIsNumeric = Number.isFinite(aNum);
    const bIsNumeric = Number.isFinite(bNum);

    if (aIsNumeric && bIsNumeric) return bNum - aNum;
    if (aIsNumeric) return 1; // b is offline (UUID) → b first
    if (bIsNumeric) return -1; // a is offline (UUID) → a first
    return 0; // both offline → keep insertion order
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
      displayId: String(
        record?.display_receipt_id ?? record?.legacy_receipt_id ?? record?.id ?? '',
      ),
      isLegacy: Boolean(record?.legacy_receipt_id),
      bookedDate,
      serviceName,
      type,
      status: this.normalizeStatus(status),
      time: activityTime(
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
      totalDeposit: this.toNumber(record?.total_deposit),
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
      calendarDays:
        type === 'Package' && packageDays(record?.package_companies).length
          ? packageDays(record?.package_companies)
          : undefined,
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
    // activity_date is "as typed" — take its date directly (converting it to
    // Malaysia time moved evening bookings to the next day).
    const activityDay = activityDateKey(record?.activity_date);
    if (activityDay) {
      return activityDay;
    }
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
