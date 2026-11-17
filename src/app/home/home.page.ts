import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import { firstValueFrom, forkJoin } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { BookingService } from '../services/booking.service';
import { NativeDownloadService } from '../services/native-download.service';
import { activityDateKey } from '../utils/activity-date.util';
import { packageDays, packageItemWhen } from '../utils/package-item-dates.util';
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

/** One receipt in the Excel download (receipt list row + export fields). */
type ExcelReceiptRow = ReceiptListItem & {
  receiptNo: string;
  email: string;
  date: Date | null;
  visitDate: Date | null;
  visitText: string;
  amount: number;
  pax: number;
};

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

  activeSummary: DashboardSummary | null = null;
  activeReceipts: ReceiptListItem[] = [];
  isDownloadingReceipts = false;
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

  // Trend picker range: 2020 up to 5 years ahead. Years without data simply
  // show zero in the charts.
  readonly trendMinDate = '2020-01-01';

  get trendMaxDate(): string {
    const currentYear = new Date().getFullYear();
    return `${currentYear + 5}-12-31`;
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
    private nativeDownload: NativeDownloadService,
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

  openTrendPicker(target: 'from' | 'to'): void {
    this.trendPickerTarget = target;
  }

  closeTrendPicker(): void {
    this.trendPickerTarget = null;
  }

  onTrendMonthSelected(monthValue: string): void {
    if (this.trendPickerTarget === 'from') {
      this.trendFrom = monthValue;
    } else if (this.trendPickerTarget === 'to') {
      this.trendTo = monthValue;
    }
    this.trendPickerTarget = null;
  }

  /** "To" can't be before "From", and vice versa. */
  get trendPickerMin(): string {
    if (this.trendPickerTarget === 'to' && this.trendFrom) {
      return `${this.trendFrom}-01`;
    }
    return this.trendMinDate;
  }

  get trendPickerMax(): string {
    if (this.trendPickerTarget === 'from' && this.trendTo) {
      return this.getLastDayOfMonth(this.trendTo);
    }
    return this.trendMaxDate;
  }

  get trendFromLabel(): string {
    return this.formatTrendMonthLabel(this.trendFrom);
  }

  get trendToLabel(): string {
    return this.formatTrendMonthLabel(this.trendTo);
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

  /** Date range the receipt list (and its Excel download) covers. */
  private getReceiptDateRange(): { startDate: string; endDate: string } {
    if (this.mode === 'trend' && this.trendFrom && this.trendTo) {
      return {
        startDate: `${this.trendFrom}-01`,
        endDate: this.getLastDayOfMonth(this.trendTo),
      };
    }
    return this.getDashboardDateRange();
  }

  /**
   * Package referrals this company received (it is the referee), in the
   * given date range, shaped like booking rows.
   */
  private buildReferralRows(referrals: any, startDate: string, endDate: string): any[] {
    const myCompanyId = Number(this.authService.currentUser?.company_id ?? 0);
    return (Array.isArray(referrals?.data) ? referrals.data : [])
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
        phone_number: r.booking?.phone_number || '',
        email: r.booking?.email || '',
        no_of_pax_domestik: r.booking?.no_of_pax_domestik,
        no_of_pax_antarbangsa: r.booking?.no_of_pax_antarbangsa,
        // The referred item itself: its own type/dates/price (Excel visit
        // date + amount), not the package's booking date.
        package_companies: [r],
        product_name: r.description || 'Package',
        total_price: r.per_price,
        status: r.booking?.status || 'paid',
        created_at: r.booking?.created_at || r.created_at,
        receipt_created_at: r.booking?.receipt_created_at,
        _isReferral: true,
        _referralBy: r.referral_company || '',
      }));
  }

  private loadReceiptsFromBookingList(): void {
    const dateRange = this.getReceiptDateRange();
    const params: any = {
      status: 'paid,completed',
      start_date: dateRange.startDate,
      end_date: dateRange.endDate,
      page: this.receiptMeta.page,
      per_page: this.receiptMeta.per_page,
    };

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
        const referralRows = this.buildReferralRows(
          referrals,
          params.start_date,
          params.end_date,
        );

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

  /**
   * Download every receipt in the current date range (not just the visible
   * page) as an Excel file with the same columns as the table.
   */
  /**
   * The Excel holds customer contact details and spending, so it has its own
   * permission (customer:export — Roles & Permissions → Dashboard).
   */
  get canExportCustomers(): boolean {
    return this.authService.hasPermission('customer:export');
  }

  async downloadReceiptList(): Promise<void> {
    if (this.isDownloadingReceipts || !this.canExportCustomers) return;
    this.isDownloadingReceipts = true;

    try {
      const { startDate, endDate } = this.getReceiptDateRange();
      const baseParams = {
        status: 'paid,completed',
        start_date: startDate,
        end_date: endDate,
        per_page: 100, // backend maximum
      };

      const bookingRows: any[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const res: any = await firstValueFrom(
          this.bookingService.getBookings({ ...baseParams, page }),
        );
        bookingRows.push(...(Array.isArray(res?.data) ? res.data : []));
        totalPages = Number(res?.meta?.total_pages ?? 1);
        page++;
      } while (page <= totalPages);

      const referrals = await firstValueFrom(
        this.bookingService.getPackageBookings({ status: 'paid,completed', per_page: 1000 }),
      );
      const allRows = [
        ...bookingRows,
        ...this.buildReferralRows(referrals, startDate, endDate),
      ];

      if (allRows.length === 0) {
        await this.showToast('Tiada resit untuk dimuat turun / No receipts to download.', 'warning');
        return;
      }

      const myCompanyId = Number(this.authService.currentUser?.company_id ?? 0);
      const receipts: ExcelReceiptRow[] = allRows.map((item: any, index: number) => {
        const row = this.mapBookingToReceiptItem(item, index);
        // Our share, as on the dashboard/statement: packages count only the
        // items our company provides (in our packages and referred ones).
        const ownItems = (Array.isArray(item?.package_companies) ? item.package_companies : [])
          .filter((p: any) => !myCompanyId || Number(p?.referee_id) === myCompanyId);
        const isPackage = row.type === 'Package';
        const amount = isPackage
          ? ownItems.reduce((sum: number, p: any) => sum + Number(p?.per_price || 0), 0)
          : Number(item?.total_price || 0);
        const pax =
          Number(item?.no_of_pax_domestik || 0) + Number(item?.no_of_pax_antarbangsa || 0);
        // When the customer comes: activity date/time, stay dates, or (package)
        // each of our items' dates.
        const whenText = (w: { main: string; sub: string }) =>
          w.main === '-' ? '' : `${w.main}${w.sub ? ` (${w.sub.replace('malam/', '')})` : ''}`;
        const visitText = isPackage
          ? ownItems.map((p: any) => whenText(packageItemWhen(p))).filter(Boolean).join('; ')
          : row.type === 'Accommodation'
            ? whenText(packageItemWhen({ product_type: 'accommodation', check_in_date: item?.check_in_date, check_out_date: item?.check_out_date }))
            : whenText(packageItemWhen({ product_type: 'activity', activity_date: item?.activity_date }));
        const raw = item?.receipt_created_at || item?.created_at || item?.createdAt;
        const date = raw ? new Date(raw) : null;
        // Same receipt number as the printed receipt: the old system's PE…
        // number for migrated bookings, otherwise BA_ + booking id.
        const legacyNo = String(item?.legacy_receipt_id || '').trim();
        const bookingId = String(item?.id ?? '').trim();
        const receiptNo =
          legacyNo || (/^\d+$/.test(bookingId) ? `BA_${bookingId.padStart(3, '0')}` : row.receiptId);
        // Visit date = the "Booked Date" on the bookings page: activity date,
        // else check-in date (both are calendar dates as entered — read the
        // YYYY-MM-DD directly, no timezone conversion). Falls back to the
        // receipt date for bookings without one.
        const visitKey = isPackage
          ? packageDays(ownItems)[0] || ''
          : activityDateKey(item?.activity_date) || activityDateKey(item?.check_in_date);
        const visitDate = visitKey
          ? new Date(`${visitKey}T00:00:00.000Z`)
          : date && !isNaN(date.getTime())
            ? new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
            : null;
        return {
          ...row,
          receiptNo,
          visitDate,
          visitText: visitText || '-',
          amount,
          pax,
          email: String(item?.email || '').trim(),
          // Excel dates carry no timezone: shift so the cell shows local time.
          date:
            date && !isNaN(date.getTime())
              ? new Date(date.getTime() - date.getTimezoneOffset() * 60000)
              : null,
        };
      });

      // Loaded only when needed, so ExcelJS is not part of the app's start-up.
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const styleHeader = (sheet: any, lastColumn: string) => {
        const header = sheet.getRow(1);
        header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF04552F' } };
        sheet.views = [{ state: 'frozen', ySplit: 1 }];
        sheet.autoFilter = { from: 'A1', to: `${lastColumn}1` };
        // Every column vertically centred, so a row that grows (wrapped
        // names/services) keeps its cells lined up.
        sheet.columns.forEach((column: any) => {
          column.alignment = { ...(column.alignment || {}), vertical: 'middle' };
        });
      };

      // Sheet 1 — every receipt, same columns as the table.
      const sheet = workbook.addWorksheet('Receipts');
      sheet.columns = [
        { header: 'Receipt No.', key: 'receiptNo', width: 14 },
        { header: 'Tourist Name', key: 'bookedBy', width: 28 },
        { header: 'Phone No.', key: 'phoneNumber', width: 16 },
        { header: 'Service Name', key: 'serviceName', width: 45 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Visit Date', key: 'visitText', width: 30 },
        { header: 'Pax', key: 'pax', width: 8 },
        { header: 'Amount (RM)', key: 'amount', width: 15 },
        { header: 'Receipt Date', key: 'createdAt', width: 20 },
      ];
      receipts.forEach((r) => {
        sheet.addRow({
          ...r,
          createdAt: r.date ?? r.createdAt,
        });
      });
      styleHeader(sheet, 'I');
      sheet.getColumn('createdAt').numFmt = 'dd mmm yyyy, hh:mm';
      sheet.getColumn('amount').numFmt = '#,##0.00';
      sheet.getColumn('pax').alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getColumn('visitText').alignment = { wrapText: true, vertical: 'middle' };
      // Total row (outside the filter range, so filtering doesn't hide it).
      const receiptsTotal = sheet.addRow({
        type: 'TOTAL',
        pax: receipts.reduce((sum, r) => sum + r.pax, 0),
        amount: receipts.reduce((sum, r) => sum + r.amount, 0),
      });
      receiptsTotal.font = { bold: true };
      receiptsTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F2EA' } };
      sheet.getColumn('serviceName').alignment = { wrapText: true, vertical: 'middle' };

      // Sheet 2 — one row per customer (by phone, else email), most visits first.
      const customers = this.groupReceiptsByCustomer(receipts);
      const customerSheet = workbook.addWorksheet('Customers');
      customerSheet.columns = [
        { header: 'Tourist Name', key: 'name', width: 28 },
        { header: 'Names Used', key: 'namesUsed', width: 32 },
        { header: 'Phone No.', key: 'phone', width: 16 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'No. of Visits', key: 'visits', width: 13 },
        { header: 'Returning?', key: 'returning', width: 12 },
        { header: 'Total Spent (RM)', key: 'totalSpent', width: 16 },
        { header: 'First Visit', key: 'firstVisit', width: 20 },
        { header: 'Last Visit', key: 'lastVisit', width: 20 },
        { header: 'Services Booked', key: 'services', width: 45 },
      ];
      customers.forEach((c) => {
        const row = customerSheet.addRow({ ...c, returning: c.visits > 1 ? 'Yes' : 'No' });
        if (c.visits > 1) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F2EA' } };
        }
      });
      styleHeader(customerSheet, 'J');
      customerSheet.getColumn('totalSpent').numFmt = '#,##0.00';
      customerSheet.getColumn('firstVisit').numFmt = 'dd mmm yyyy';
      customerSheet.getColumn('lastVisit').numFmt = 'dd mmm yyyy';
      customerSheet.getColumn('visits').alignment = { horizontal: 'center', vertical: 'middle' };
      customerSheet.getColumn('returning').alignment = { horizontal: 'center', vertical: 'middle' };
      customerSheet.getColumn('services').alignment = { wrapText: true, vertical: 'middle' };
      customerSheet.getColumn('namesUsed').alignment = { wrapText: true, vertical: 'middle' };

      // Sheet 3 — month-by-month totals (receipt month), our share.
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Month', key: 'month', width: 16 },
        { header: 'Receipts', key: 'receipts', width: 11 },
        { header: 'Tourists', key: 'tourists', width: 11 },
        { header: 'Activity (RM)', key: 'activity', width: 15 },
        { header: 'Accommodation (RM)', key: 'accommodation', width: 20 },
        { header: 'Package (RM)', key: 'package', width: 15 },
        { header: 'Total (RM)', key: 'total', width: 15 },
      ];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const byMonth = new Map<string, any>();
      for (const r of receipts) {
        // r.date is already shifted to local time (read its UTC parts).
        const key = r.date ? `${r.date.getUTCFullYear()}-${String(r.date.getUTCMonth() + 1).padStart(2, '0')}` : 'unknown';
        if (!byMonth.has(key)) {
          byMonth.set(key, {
            month: r.date ? `${monthNames[r.date.getUTCMonth()]} ${r.date.getUTCFullYear()}` : '-',
            receipts: 0, tourists: 0, activity: 0, accommodation: 0, package: 0, total: 0,
          });
        }
        const m = byMonth.get(key);
        m.receipts += 1;
        m.tourists += r.pax;
        const typeKey = String(r.type).toLowerCase();
        if (typeKey in m) m[typeKey] += r.amount;
        m.total += r.amount;
      }
      const monthRows = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, m]) => m);
      monthRows.forEach((m) => summarySheet.addRow(m));
      styleHeader(summarySheet, 'G');
      const sum = (field: string) => monthRows.reduce((total, m) => total + m[field], 0);
      const summaryTotal = summarySheet.addRow({
        month: 'TOTAL',
        receipts: sum('receipts'),
        tourists: sum('tourists'),
        activity: sum('activity'),
        accommodation: sum('accommodation'),
        package: sum('package'),
        total: sum('total'),
      });
      summaryTotal.font = { bold: true };
      summaryTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F2EA' } };
      ['activity', 'accommodation', 'package', 'total'].forEach((key) => {
        summarySheet.getColumn(key).numFmt = '#,##0.00';
      });
      ['receipts', 'tourists'].forEach((key) => {
        summarySheet.getColumn(key).alignment = { horizontal: 'center', vertical: 'middle' };
      });


      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      await this.nativeDownload.downloadBlob(
        blob,
        `customer-list_${startDate}_to_${endDate}.xlsx`,
        'Open or save Excel file',
      );
    } catch (error) {
      console.error('Receipt list download failed', error);
      await this.showToast(
        'Gagal memuat turun senarai resit / Failed to download the receipt list.',
        'danger',
      );
    } finally {
      this.isDownloadingReceipts = false;
    }
  }

  /**
   * Group receipts into customers for the "Customers" sheet, most visits
   * first. The same person is matched by phone number (ignoring spaces,
   * dashes and the +60 / 60 prefix), else by email. A receipt with neither
   * gets its own row — names are never matched, since different people can
   * share a name.
   */
  private groupReceiptsByCustomer(
    receipts: ExcelReceiptRow[],
  ): Array<{
    name: string;
    namesUsed: string;
    phone: string;
    email: string;
    visits: number;
    totalSpent: number;
    firstVisit: Date | null;
    lastVisit: Date | null;
    services: string;
  }> {
    const normalizePhone = (value: string): string => {
      let digits = String(value || '').replace(/\D/g, '');
      if (digits.startsWith('60') && digits.length >= 10) digits = '0' + digits.slice(2);
      return digits.length >= 7 ? digits : '';
    };

    const groups = new Map<string, ExcelReceiptRow[]>();
    receipts.forEach((r, index) => {
      const phoneKey = normalizePhone(r.phoneNumber);
      const emailKey = r.email.toLowerCase();
      const key = phoneKey ? `p:${phoneKey}` : emailKey ? `e:${emailKey}` : `r:${index}`;
      groups.set(key, [...(groups.get(key) ?? []), r]);
    });

    const time = (d: Date | null) => (d ? d.getTime() : 0);
    return [...groups.values()]
      .map((visits) => {
        const sorted = [...visits].sort(
          (a, b) => time(a.visitDate) - time(b.visitDate) || time(a.date) - time(b.date),
        );
        const latest = sorted[sorted.length - 1];
        const pick = (field: 'phoneNumber' | 'email') =>
          [...sorted].reverse().map((v) => v[field]).find((v) => v && v !== '-') || '-';
        // Every name booked under this phone/email, latest first (one person
        // spelled differently, or a family/group sharing a contact).
        const namesUsed: string[] = [];
        for (const v of [...sorted].reverse()) {
          const name = String(v.bookedBy || '').trim().replace(/\s+/g, ' ');
          if (name && name !== '-' && !namesUsed.some((n) => n.toLowerCase() === name.toLowerCase())) {
            namesUsed.push(name);
          }
        }
        return {
          name: latest.bookedBy,
          namesUsed: namesUsed.join(', ') || '-',
          phone: pick('phoneNumber'),
          email: pick('email'),
          visits: sorted.length,
          totalSpent: sorted.reduce((total, v) => total + v.amount, 0),
          firstVisit: sorted[0].visitDate,
          lastVisit: latest.visitDate,
          services: [...new Set(sorted.map((v) => v.serviceName).filter((s) => s && s !== '-'))].join(', ') || '-',
        };
      })
      .sort((a, b) => b.visits - a.visits || time(b.lastVisit) - time(a.lastVisit));
  }

  private async showToast(message: string, color: 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color,
    });
    await toast.present();
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
    const phoneNumber =
      String(item?.phone_number || item?.phone || item?.contact_phone || '').trim() || '-';
    // A package has no single product: list the products picked for it —
    // only the ones our company provides (same as the account statement);
    // other companies' items in the package aren't our services.
    const myCompanyId = Number(this.authService.currentUser?.company_id ?? 0);
    const packageNames = (Array.isArray(item?.package_companies) ? item.package_companies : [])
      .filter((p: any) => !myCompanyId || Number(p?.referee_id) === myCompanyId)
      .map((p: any) => String(p?.description || p?.referee_company || '').trim())
      .filter((name: string) => name.length > 0);
    const serviceName =
      (type === 'Package' && packageNames.length > 0 ? packageNames.join(', ') : '') ||
      item?.product_name || item?.service_name || item?.title || item?.activity_name || '-';
    const createdAtRaw = item?.receipt_created_at || item?.created_at || item?.createdAt || '-';
    const createdAt = this.formatDateTime(createdAtRaw);

    return {
      bookingId: item?._isReferral ? undefined : bookingId,
      receiptId: String(receiptId),
      bookedBy: String(bookedBy),
      phoneNumber,
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
        phoneNumber: '-',
        serviceName: 'Hiking, Kiulu Riverside Chalet',
        type: 'Package',
        createdAt: '21-01-2026, 03:00 PM',
      },
      {
        receiptId: 'RES_002',
        bookedBy: 'Jonathan Lewis',
        phoneNumber: '-',
        serviceName: 'Kiulu Water Rafting',
        type: 'Activity',
        createdAt: '21-01-2026, 03:00 PM',
      },
      {
        receiptId: 'RES_003',
        bookedBy: 'Onana Joven',
        phoneNumber: '-',
        serviceName: 'Kiulu Chalet',
        type: 'Accommodation',
        createdAt: '21-01-2026, 03:00 PM',
      },
      {
        receiptId: 'RES_004',
        bookedBy: 'Lewis Hanson',
        phoneNumber: '-',
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
