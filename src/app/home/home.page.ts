import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import { firstValueFrom, forkJoin } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { BookingService } from '../services/booking.service';
import { MenuItem, MenuService } from '../services/menu.service';
import {
  Notification,
  NotificationService,
} from '../services/notification.service';
import {
  DashboardSummary,
  ReceiptListItem,
  TodayDashboardData,
  TrendDashboardData,
  TrendChartItem
} from './dashboard/dashboard.models';
import { ReceiptPaginationMeta } from './dashboard/components/receipt-list-table/dashboard-receipt-list-table.component';
import { DashboardApiService } from './dashboard/services/dashboard-api.service';

export type DashboardMode = 'today' | 'trend';

interface ChartDisplaySeries {
  name: string;
  data: number[];
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  uid: string | null = null;
  user: any = null;
  menuItems: MenuItem[] = [];
  unreadCount: number = 0;
  notifications: Notification[] = [];
  pendingBookingsCount: number = 0;

  private static readonly DASHBOARD_MODE_KEY = 'dashboard.mode';
  private static readonly DASHBOARD_TREND_FROM_KEY = 'dashboard.trendFrom';
  private static readonly DASHBOARD_TREND_TO_KEY = 'dashboard.trendTo';

  mode: DashboardMode = 'today';

  todayData: TodayDashboardData | null = null;
  trendData: TrendDashboardData | null = null;

  trendFrom = '';
  trendTo = '';
  trendPickerTarget: 'from' | 'to' | null = null;
  trendPickerEvent: Event | null = null;

  activeSummary: DashboardSummary | null = null;
  activeReceipts: ReceiptListItem[] = [];
  receiptMeta: ReceiptPaginationMeta = {
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  };

  revenueCategories: string[] = [];
  revenueSeries: ChartDisplaySeries[] = [];
  revenueChartType: 'bar' | 'line' = 'bar';

  receiptsCategories: string[] = [];
  receiptsSeries: ChartDisplaySeries[] = [];
  receiptsChartType: 'bar' | 'line' = 'bar';

  touristsCategories: string[] = [];
  touristsSeries: ChartDisplaySeries[] = [];
  touristsChartType: 'bar' | 'line' = 'bar';

  readonly trendMinDate = '2024-01-01';

  get trendMaxDate(): string {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-12-31`;
  }

  constructor(
    private bookingService: BookingService,
    private dashboardApiService: DashboardApiService,
    private menuCtrl: MenuController,
    private router: Router,
    private toastController: ToastController,
    private notificationService: NotificationService,
    private menuService: MenuService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.setDefaultTrendRange();
    this.loadUserData();
    this.loadDashboardData();

    // Subscribe to reactive unread count
    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
    });
  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, 'home-menu');
    this.loadUserData();
    this.resetDashboardState();

    // Restore the last dashboard view (e.g. after viewing a receipt and coming
    // back) so returning to TREND doesn't snap back to TODAY.
    const savedMode = this.readSavedMode();
    if (savedMode === 'trend') {
      this.restoreSavedTrendRange();
      this.switchMode('trend');
      return;
    }

    this.loadDashboardData();
  }

  private readSavedMode(): DashboardMode | null {
    try {
      const saved = sessionStorage.getItem(HomePage.DASHBOARD_MODE_KEY);
      return saved === 'trend' || saved === 'today' ? saved : null;
    } catch {
      return null;
    }
  }

  private saveMode(mode: DashboardMode): void {
    try {
      sessionStorage.setItem(HomePage.DASHBOARD_MODE_KEY, mode);
      if (mode === 'trend') {
        sessionStorage.setItem(HomePage.DASHBOARD_TREND_FROM_KEY, this.trendFrom);
        sessionStorage.setItem(HomePage.DASHBOARD_TREND_TO_KEY, this.trendTo);
      }
    } catch {
      // Ignore storage failures (private mode / quota) — view just won't persist.
    }
  }

  private restoreSavedTrendRange(): void {
    try {
      const from = sessionStorage.getItem(HomePage.DASHBOARD_TREND_FROM_KEY);
      const to = sessionStorage.getItem(HomePage.DASHBOARD_TREND_TO_KEY);
      if (from) this.trendFrom = from;
      if (to) this.trendTo = to;
    } catch {
      // Fall back to the default range set in resetDashboardState/ngOnInit.
    }
  }

  private resetDashboardState(): void {
    this.mode = 'today';
    this.todayData = null;
    this.trendData = null;
    this.activeSummary = null;
    this.activeReceipts = [];
    this.revenueSeries = [];
    this.receiptsSeries = [];
    this.touristsSeries = [];
    this.receiptMeta = {
      total: 0,
      page: 1,
      per_page: 10,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    };
  }

  switchMode(mode: DashboardMode): void {
    this.mode = mode;
    this.receiptMeta = { ...this.receiptMeta, page: 1 };
    this.saveMode(mode);

    if (mode === 'trend') {
      this.applyTrendFilter();
      return;
    }

    this.loadTodayDashboard();
    this.loadReceiptsFromBookingList();
  }

  applyTrendFilter(): void {
    if (this.trendFrom && this.trendTo && this.trendFrom > this.trendTo) {
      this.errorToast('From month must be earlier than or equal to To month');
      return;
    }

    if (!this.trendFrom || !this.trendTo) {
      this.setDefaultTrendRange();
      this.fetchTrendDashboard();
      return;
    }

    this.fetchTrendDashboard();
  }

  resetTrendFilter(): void {
    this.setDefaultTrendRange();
    this.receiptMeta = { ...this.receiptMeta, page: 1 };
    this.fetchTrendDashboard();
  }

  openTrendPicker(target: 'from' | 'to', event: Event): void {
    this.trendPickerTarget = target;
    this.trendPickerEvent = event;
  }

  closeTrendPicker(): void {
    this.trendPickerTarget = null;
    this.trendPickerEvent = null;
  }

  onTrendMonthChange(event: CustomEvent): void {
    const rawValue = event.detail?.value;

    if (!rawValue || !this.trendPickerTarget) {
      return;
    }

    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    const monthValue = String(value).slice(0, 7);

    if (this.trendPickerTarget === 'from') {
      this.trendFrom = monthValue;
      return;
    }

    this.trendTo = monthValue;
  }

  get trendFromLabel(): string {
    return this.formatTrendMonthLabel(this.trendFrom);
  }

  get trendToLabel(): string {
    return this.formatTrendMonthLabel(this.trendTo);
  }

  getTrendPickerValue(): string | null {
    if (this.trendPickerTarget === 'from' && this.trendFrom) {
      return `${this.trendFrom}-01`;
    }

    if (this.trendPickerTarget === 'to' && this.trendTo) {
      return `${this.trendTo}-01`;
    }

    return null;
  }

  private formatTrendMonthLabel(monthValue: string): string {
    if (!monthValue) {
      return '-- ----';
    }

    const [year, month] = monthValue.split('-');
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const monthIndex = Number(month) - 1;

    if (!year || monthIndex < 0 || monthIndex > 11) {
      return '-- ----';
    }

    return `${monthNames[monthIndex]} ${year}`;
  }

  get todayAsOfText(): string {
    return this.todayData?.asOfDate || '';
  }

  private loadDashboardData(): void {
    this.loadTodayDashboard();
    this.loadReceiptsFromBookingList();
  }

  private loadTodayDashboard(): void {
    this.dashboardApiService.getTodayDashboard().subscribe({
      next: (response) => {
        this.todayData = response?.data || null;
        this.bindTodayData();
      },
      error: () => {
        this.todayData = null;
        this.activeSummary = null;
      },
    });
  }

  private fetchTrendDashboard(): void {
    if (!this.trendFrom || !this.trendTo) {
      return;
    }

    // Persist the current trend range so returning to the dashboard (e.g. after
    // viewing a receipt) restores TREND with the same range.
    this.saveMode('trend');

    this.dashboardApiService.getTrendDashboard(this.trendFrom, this.trendTo).subscribe({
      next: (response) => {
        this.receiptMeta = { ...this.receiptMeta, page: 1 };
        this.trendData = response?.data || null;
        this.bindTrendData();
        this.loadReceiptsFromBookingList();
      },
      error: () => {
        this.trendData = null;
        if (this.mode === 'trend') {
          this.activeSummary = null;
          this.revenueSeries = [];
          this.receiptsSeries = [];
          this.touristsSeries = [];
        }
      },
    });
  }

  private bindTodayData(): void {
    if (!this.todayData) {
      return;
    }

    this.activeSummary = this.todayData.summary;

    const types = ['Activity', 'Accommodation', 'Package'];

    this.revenueChartType = 'bar';
    this.revenueCategories = types;
    this.revenueSeries = [
      {
        name: 'Revenue',
        data: [
          this.todayData.charts.revenue.activity,
          this.todayData.charts.revenue.accommodation,
          this.todayData.charts.revenue.package,
        ],
      },
    ];

    this.receiptsChartType = 'bar';
    this.receiptsCategories = types;
    this.receiptsSeries = [
      {
        name: 'Receipts',
        data: [
          this.todayData.charts.receipts.activity,
          this.todayData.charts.receipts.accommodation,
          this.todayData.charts.receipts.package,
        ],
      },
    ];

    this.touristsChartType = 'bar';
    this.touristsCategories = types;
    this.touristsSeries = [
      {
        name: 'Tourists',
        data: [
          this.todayData.charts.tourists.activity,
          this.todayData.charts.tourists.accommodation,
          this.todayData.charts.tourists.package,
        ],
      },
    ];
  }

  private bindTrendData(): void {
    if (!this.trendData) {
      return;
    }

    this.activeSummary = this.trendData.summary;

    this.revenueChartType = 'line';
    this.revenueCategories = this.trendData.revenueTrend.map((item) => item.month);
    this.revenueSeries = this.toMultiSeries(this.trendData.revenueTrend);

    this.receiptsChartType = 'bar';
    this.receiptsCategories = this.trendData.receiptsTrend.map((item) => item.month);
    this.receiptsSeries = this.toMultiSeries(this.trendData.receiptsTrend);

    this.touristsChartType = 'line';
    this.touristsCategories = this.trendData.touristsTrend.map((item) => item.month);
    this.touristsSeries = this.toMultiSeries(this.trendData.touristsTrend);
  }

  private toMultiSeries(items: TrendChartItem[]): ChartDisplaySeries[] {
    return [
      {
        name: 'Activity',
        data: items.map((item) => item.activity),
      },
      {
        name: 'Accommodation',
        data: items.map((item) => item.accommodation),
      },
      {
        name: 'Packages',
        data: items.map((item) => item.package),
      },
    ];
  }

  private loadReceiptsFromBookingList(): void {
    const dateRange = this.getDashboardDateRange();
    const params: any = {
      status: 'paid,completed',
      start_date: dateRange.startDate,
      end_date: dateRange.endDate,
      page: this.receiptMeta.page,
      per_page: this.receiptMeta.per_page,
    };

    if (this.mode === 'trend' && this.trendFrom && this.trendTo) {
      params.start_date = `${this.trendFrom}-01`;
      params.end_date = this.getLastDayOfMonth(this.trendTo);
    }

    forkJoin({
      bookings: this.bookingService.getBookings(params),
      referrals: this.bookingService.getPackageBookings({ status: 'paid,completed', per_page: 1000 }),
    }).subscribe({
      next: ({ bookings, referrals }: any) => {
        const meta = bookings?.meta || {};
        this.receiptMeta = {
          total: Number(meta.total ?? 0),
          page: Number(meta.page ?? 1),
          per_page: Number(meta.per_page ?? this.receiptMeta.per_page),
          total_pages: Number(meta.total_pages ?? 1),
          has_next: Boolean(meta.has_next),
          has_prev: Boolean(meta.has_prev),
        };

        const bookingRows: any[] = Array.isArray(bookings?.data) ? bookings.data : [];

        // Get referral rows where this company is the referee (received referrals)
        // and filter by the same date range used for bookings
        const myCompanyId = Number(this.authService.currentUser?.company_id ?? 0);
        const startDate = params.start_date;
        const endDate = params.end_date;
        const referralRows: any[] = (Array.isArray(referrals?.data) ? referrals.data : [])
          .filter((r: any) => {
            if (Number(r.referee_id) !== myCompanyId || Number(r.referrer_id) === myCompanyId) return false;
            const dateRaw = r.booking?.receipt_created_at || r.booking?.created_at || r.created_at || '';
            if (!dateRaw) return false;
            const date = dateRaw.slice(0, 10);
            return date >= startDate && date <= endDate;
          })
          .map((r: any) => ({
            id: r.booking?.id || r.id,
            booking_type: 'package',
            tourist_full_name: r.booking?.tourist_full_name || r.booking?.company_name || '-',
            product_name: r.description || 'Package',
            total_price: r.per_price,
            status: r.booking?.status || 'paid',
            created_at: r.booking?.created_at || r.created_at,
            receipt_created_at: r.booking?.receipt_created_at,
            _isReferral: true,
            _referralBy: r.referral_company || '',
          }));

        const allRows = [...bookingRows, ...referralRows];
        this.activeReceipts = allRows.length > 0
          ? allRows.map((item: any, index: number) => this.mapBookingToReceiptItem(item, index))
          : [];
      },
      error: () => {
        this.activeReceipts = [];
      },
    });
  }

  onReceiptPageChange(page: number): void {
    this.receiptMeta = { ...this.receiptMeta, page };
    this.loadReceiptsFromBookingList();
  }

  onReceiptPageSizeChange(perPage: number): void {
    this.receiptMeta = { ...this.receiptMeta, per_page: perPage, page: 1 };
    this.loadReceiptsFromBookingList();
  }

  private getDashboardDateRange(): { startDate: string; endDate: string } {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const isoDay = `${year}-${month}-${day}`;
    return { startDate: isoDay, endDate: isoDay };
  }

  private setDefaultTrendRange(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    this.trendFrom = `${year}-01`;
    this.trendTo = `${year}-${month}`;
  }

  private getLastDayOfMonth(monthValue: string): string {
    const [yearText, monthText] = monthValue.split('-');
    const year = Number(yearText);
    const month = Number(monthText);

    if (!year || !month) {
      return `${monthValue}-31`;
    }

    const lastDate = new Date(year, month, 0);
    const day = String(lastDate.getDate()).padStart(2, '0');
    return `${yearText}-${monthText}-${day}`;
  }

  private mapBookingToReceiptItem(item: any, index: number): ReceiptListItem {
    const rawType = String(item?.booking_type || item?.type || '').toLowerCase();
    const typeMap: Record<string, 'Activity' | 'Accommodation' | 'Package'> = {
      activity: 'Activity',
      accommodation: 'Accommodation',
      package: 'Package',
    };
    const type = typeMap[rawType] || 'Activity';
    const bookingIdRaw = item?.id || item?.booking_id || item?.bookingId;
    const bookingId =
      bookingIdRaw !== undefined && bookingIdRaw !== null
        ? String(bookingIdRaw)
        : '';
    const receiptId = item?.receipt_id || item?.receiptId || item?.id || `RES_${index + 1}`;
    const bookedBy =
      item?.tourist_full_name ||
      item?.user_fullname ||
      item?.booked_by ||
      item?.tourist_name ||
      item?.full_name ||
      item?.name ||
      item?.user_name ||
      '-';
    const serviceName =
      item?.product_name || item?.service_name || item?.title || item?.activity_name || '-';
    const createdAtRaw = item?.receipt_created_at || item?.created_at || item?.createdAt || '-';
    const createdAt = this.formatDateTime(createdAtRaw);

    return {
      bookingId: item?._isReferral ? undefined : bookingId,
      receiptId: String(receiptId),
      bookedBy: String(bookedBy),
      serviceName: String(serviceName),
      type,
      createdAt,
      isReferral: Boolean(item?._isReferral),
    };
  }

  private formatDateTime(raw: string): string {
    if (!raw || raw === '-') return '-';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${months[d.getMonth()]} ${year}, ${h}:${m}`;
  }

  private getReceiptFallback(): ReceiptListItem[] {
    return [
      {
        receiptId: 'RES_001',
        bookedBy: 'Hanani Rasyiqah',
        serviceName: 'Hiking, Kiulu Riverside Chalet',
        type: 'Package',
        createdAt: '21-01-2026, 03:00 PM',
      },
      {
        receiptId: 'RES_002',
        bookedBy: 'Jonathan Lewis',
        serviceName: 'Kiulu Water Rafting',
        type: 'Activity',
        createdAt: '21-01-2026, 03:00 PM',
      },
      {
        receiptId: 'RES_003',
        bookedBy: 'Onana Joven',
        serviceName: 'Kiulu Chalet',
        type: 'Accommodation',
        createdAt: '21-01-2026, 03:00 PM',
      },
      {
        receiptId: 'RES_004',
        bookedBy: 'Lewis Hanson',
        serviceName: 'Kiulu Chalet',
        type: 'Accommodation',
        createdAt: '21-01-2026, 03:00 PM',
      },
    ];
  }

  private loadUserData(): void {
    this.uid = this.authService.getUserId();
    this.user = this.authService.currentUser;
    this.refreshMenuItems();

    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadCurrentSessionUser();
  }

  private refreshMenuItems(): void {
    this.menuItems =
      this.menuService.getVisibleMenuItemsForCurrentUser();
  }

  private loadCurrentSessionUser(): void {
    this.authService.refreshSession().subscribe({
      next: () => {
        this.user = this.authService.currentUser;
        this.uid = this.authService.getUserId();
        this.refreshMenuItems();
        this.loadNotifications();
        this.updatePendingBookingsCount();
      },
      error: (err: any) => console.error('Error loading session user:', err),
    });
  }

  /** Load notifications via service (reactive) */
  private loadNotifications(): void {
    if (!this.uid) return;

    this.notificationService.getNotifications(this.uid).subscribe({
      next: (notifications: Notification[]) => {
        this.notifications = notifications;
      },
      error: (err: any) => console.error('Error fetching notifications:', err),
    });
  }

  // Call this whenever you load operator bookings
  updatePendingBookingsCount() {
    this.bookingService
      .getBookings({
        page: 1,
        per_page: 1,
        status: 'booked',
      })
      .subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          // Count only bookings that are not yet Paid or Cancelled
          this.pendingBookingsCount = res.data.filter(
            (b: any) => b.status?.toLowerCase() === 'booked',
          ).length;
        } else {
          this.pendingBookingsCount = 0;
        }
      },
      error: (err: any) => {
        console.error('Error fetching bookings:', err);
        this.pendingBookingsCount = 0;
      },
    });
  }

  /** Mark a single notification as read */
  markNotificationAsRead(notification: Notification): void {
    if (notification.read) return;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true; // update locally for UI
      },
      error: (err) => console.error('Error marking notification as read:', err),
    });
  }

  /** Go to notifications page and mark all as read */
  goToNotifications(): void {
    if (!this.uid) return;

    this.router.navigate(['/notifications']);
    this.notificationService.markAllAsRead(this.uid).subscribe({
      next: () => {
        // notifications marked read, badge auto-updates via BehaviorSubject
        this.notifications.forEach((n) => (n.read = true)); // optional local update
      },
      error: (err) =>
        console.error('Error marking all notifications as read:', err),
    });
  }

  /** Send a test notification */
  async sendTestNotification(): Promise<void> {
    if (!this.uid) return;

    const notificationData = {
      operator_id: this.uid,
      tourist_user_id: '123',
      booking_id: 456,
      message: 'Test notification',
      read_status: 0,
    };

    try {
      await firstValueFrom(
        this.notificationService.createOperatorNotification(notificationData),
      );
      console.log('Notification sent successfully');
      this.loadNotifications();
    } catch (err: any) {
      console.error('Error sending notification:', err);
    }
  }

  onMenuItemTap(item: MenuItem): void {
    this.closeMenu();
    if (item.action === 'feature-unavailable') {
      this.showFeatureUnavailableToast();
    }
  }

  trackMenuItem(_index: number, item: MenuItem): string {
    return item.id;
  }

  closeMenu(): void {
    this.menuCtrl.close();
  }

  async logoutToast(): Promise<void> {
    const toast = await this.toastController.create({
      message: 'User Logged Out',
      duration: 1500,
      position: 'bottom',
      cssClass: 'error-toast',
      icon: 'alert-circle',
    });
    await toast.present();
  }

  async showFeatureUnavailableToast() {
    const toast = await this.toastController.create({
      message: 'This feature is not available yet.',
      duration: 2000,
      position: 'bottom',
      icon: 'alert-circle-outline',
      color: 'warning',
    });
    await toast.present();
  }

  async errorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 1800,
      position: 'bottom',
      color: 'danger',
    });
    await toast.present();
  }

  logOut(): void {
    this.authService.logout('/login');
    this.uid = null;
    this.user = null;
    this.menuCtrl.enable(false, 'home-menu');
    this.menuCtrl.close();
    this.logoutToast();
  }
}
