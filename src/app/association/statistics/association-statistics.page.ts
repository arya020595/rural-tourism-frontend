import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import { AuthService, User } from '../../services/auth.service';
import { FileUrlService } from '../../services/file-url.service';
import { MenuItem, MenuService } from '../../services/menu.service';
import { toDisplayDate } from '../../booking-forms/components/booking-date-sheet/booking-date-sheet.component';
import {
  AssociationMember,
  AssociationMemberProfile,
  AssociationStatsData,
  DashboardApiService,
} from '../../home/dashboard/services/dashboard-api.service';

const EMPTY_TOTALS: AssociationStatsData['totals'] = {
  totalBookings: 0,
  totalReceipts: 0,
  totalTourists: 0,
  totalCancelled: 0,
  totalPending: 0,
  totalDeposit: 0,
  totalDepositPending: 0,
  totalDepositCancelled: 0,
  totalRevenue: 0,
  totalFulltimeStaff: 0,
  totalParttimeStaff: 0,
  totalStaff: 0,
};

type DocumentKey = keyof AssociationMemberProfile['documents'];

/**
 * Statistik Persatuan / Association Statistics — the superadmin association
 * stats (bookings, visitors & finance, workers) for the user's own
 * association, then its member companies. "i" on a row opens the company
 * profile (read-only).
 */
@Component({
  selector: 'app-association-statistics',
  templateUrl: './association-statistics.page.html',
  styleUrls: ['./association-statistics.page.scss'],
})
export class AssociationStatisticsPage implements OnInit, OnDestroy {
  readonly documentLabels: Array<{ key: DocumentKey; label: string }> = [
    { key: 'operator_logo_image', label: 'Logo Pengendali / Operator Logo' },
    { key: 'motac_license_file', label: 'Lesen MOTAC / MOTAC License' },
    { key: 'trading_operation_license', label: 'Lesen Perdagangan & Operasi / Trading & Operation License' },
    { key: 'homestay_certificate', label: 'Sijil Penginapan / Homestay Certificate' },
  ];

  user: User | null = null;
  menuItems: MenuItem[] = [];

  associationName = '';
  totals: AssociationStatsData['totals'] = { ...EMPTY_TOTALS };
  members: AssociationMember[] = [];
  isLoading = false;
  loadError = '';

  // Date-range filter (day granularity, "" = all-time).
  dateFrom = '';
  dateTo = '';
  readonly todayIsoDate = new Date().toISOString().slice(0, 10);
  readonly displayDate = toDisplayDate;
  dateSheet: { open: boolean; field: 'from' | 'to' } = { open: false, field: 'from' };

  // The range the figures on screen were loaded for ("" = all time).
  appliedFrom = '';
  appliedTo = '';

  // Members table
  search = '';

  // Company profile pop-up
  profileOpen = false;
  profileLoading = false;
  profile: AssociationMemberProfile | null = null;
  profileRow: AssociationMember | null = null;

  // Document preview pop-up (opens over the profile). PDFs in an iframe
  // (needs a trusted resource URL), images in an <img>.
  docOpen = false;
  docTitle = '';
  docIsPdf = false;
  docFrameUrl: SafeResourceUrl | null = null;
  docImageUrl: string | null = null;
  private docObjectUrl: string | null = null;

  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private toastController: ToastController,
    private menuService: MenuService,
    private authService: AuthService,
    private dashboardApi: DashboardApiService,
    private fileUrl: FileUrlService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    this.loadUser();
  }

  ngOnDestroy() {
    this.releaseDocUrl();
  }

  ionViewWillEnter() {
    this.loadUser();
    this.loadStats();
  }

  private loadUser() {
    this.user = this.authService.currentUser;
    this.menuItems = this.menuService.getVisibleMenuItemsForCurrentUser();
    if (!this.user) {
      this.router.navigate(['/login']);
    }
  }

  private loadStats() {
    this.isLoading = true;
    this.loadError = '';
    this.appliedFrom = this.dateFrom;
    this.appliedTo = this.dateTo;
    this.dashboardApi.getMyAssociationStats(this.dateFrom, this.dateTo).subscribe({
      next: (res) => {
        this.associationName = res?.data?.association?.name || '';
        this.totals = { ...EMPTY_TOTALS, ...(res?.data?.totals ?? {}) };
        this.members = res?.data?.members ?? [];
        this.isLoading = false;
      },
      error: (error) => {
        this.loadError =
          error?.error?.message ||
          'Gagal memuatkan statistik / Unable to load association statistics.';
        this.isLoading = false;
      },
    });
  }

  applyDateFilter(): void {
    if (this.dateFrom && this.dateTo && this.dateFrom > this.dateTo) {
      this.errorToast('From date must be earlier than or equal to To date');
      return;
    }
    if (!!this.dateFrom !== !!this.dateTo) {
      this.errorToast('Please choose both From and To dates');
      return;
    }
    this.loadStats();
  }

  openDateSheet(field: 'from' | 'to'): void {
    this.dateSheet = { open: true, field };
  }

  /** Keeps From ≤ To; the Filter button applies the range. */
  onDateSelected(iso: string): void {
    if (this.dateSheet.field === 'from') {
      this.dateFrom = iso;
      if (this.dateTo && this.dateTo < iso) this.dateTo = iso;
    } else {
      this.dateTo = iso;
      if (this.dateFrom && this.dateFrom > iso) this.dateFrom = iso;
    }
    this.dateSheet = { ...this.dateSheet, open: false };
  }

  resetDateFilter(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.loadStats();
  }

  /* ── Headline helpers ─────────────────────────────────────────────── */

  get periodText(): string {
    if (!this.appliedFrom || !this.appliedTo) return 'Semua masa / All time';
    return `${this.displayDate(this.appliedFrom)} – ${this.displayDate(this.appliedTo)}`;
  }

  /* ── Members table ────────────────────────────────────────────────── */

  get filteredMembers(): AssociationMember[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.members;
    return this.members.filter((m) =>
      [m.companyName, m.ownerName, m.location, m.contactNo, m.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }

  trackMember(_index: number, row: AssociationMember): number {
    return row.companyId;
  }

  /* ── Company profile pop-up ───────────────────────────────────────── */

  openProfile(row: AssociationMember): void {
    this.profileRow = row;
    this.profile = null;
    this.profileOpen = true;
    this.profileLoading = true;
    this.dashboardApi.getAssociationMember(row.companyId).subscribe({
      next: (res) => {
        this.profile = res?.data ?? null;
        this.profileLoading = false;
      },
      error: (error) => {
        this.profileLoading = false;
        this.profileOpen = false;
        this.errorToast(error?.error?.message || 'Gagal memuatkan profil / Failed to load the profile.');
      },
    });
  }

  closeProfile(): void {
    this.profileOpen = false;
  }

  get logoUrl(): string | null {
    const logo = this.profile?.documents?.operator_logo_image;
    if (!logo) return null;
    return this.fileUrl.resolve(logo, { base64MimeType: 'image/png' }) || null;
  }

  /** Shows a document in the preview pop-up instead of a new tab. */
  openDocument(value: string | null | undefined, title: string): void {
    if (!value) return;
    const isPdf = this.isPdf(value);
    let url = this.fileUrl.resolve(value, {
      base64MimeType: isPdf ? 'application/pdf' : 'image/png',
    });
    if (!url) return;

    // Base64 documents come back as data: URLs, which browsers won't show
    // in an iframe; a blob: URL works for both PDFs and images.
    this.releaseDocUrl();
    if (url.startsWith('data:')) {
      const blobUrl = this.dataUrlToBlobUrl(url);
      if (blobUrl) {
        this.docObjectUrl = blobUrl;
        url = blobUrl;
      }
    }

    this.docTitle = title;
    this.docIsPdf = isPdf;
    this.docFrameUrl = isPdf ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
    this.docImageUrl = isPdf ? null : url;
    this.docOpen = true;
  }

  closeDocument(): void {
    this.docOpen = false;
  }

  onDocumentDismissed(): void {
    this.docOpen = false;
    this.docFrameUrl = null;
    this.docImageUrl = null;
    this.releaseDocUrl();
  }

  private releaseDocUrl(): void {
    if (this.docObjectUrl) {
      URL.revokeObjectURL(this.docObjectUrl);
      this.docObjectUrl = null;
    }
  }

  private dataUrlToBlobUrl(dataUrl: string): string | null {
    const match = dataUrl.match(/^data:([^;,]+);base64,(.*)$/s);
    if (!match) return null;
    try {
      const bytes = Uint8Array.from(atob(match[2].replace(/\s/g, '')), (c) => c.charCodeAt(0));
      return URL.createObjectURL(new Blob([bytes], { type: match[1] }));
    } catch {
      return null;
    }
  }

  addressText(p: AssociationMemberProfile): string {
    const area = [p.postcode, p.location].filter(Boolean).join(' ');
    return [p.address, area].filter(Boolean).join(', ') || '-';
  }

  documentKind(value: string | null | undefined): string {
    if (!value) return '—';
    return this.isPdf(value) ? 'PDF' : 'IMG';
  }

  private isPdf(value: string): boolean {
    return /\.pdf($|\?)/i.test(value) || value.startsWith('JVBER');
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kuala_Lumpur',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  /* ── Chrome ───────────────────────────────────────────────────────── */

  onMenuItemTap(item: MenuItem): void {
    if (item.action === 'feature-unavailable') {
      this.errorToast('This feature is not available yet.', 'warning');
    }
  }

  private async errorToast(message: string, color = 'danger'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 1800,
      position: 'bottom',
      color,
    });
    await toast.present();
  }

  closeMenu() {
    this.menuCtrl.close();
  }

  async logOut() {
    this.authService.logout('/login');
    this.user = null;
    this.menuCtrl.close();
    const toast = await this.toastController.create({
      message: 'Logged out successfully',
      duration: 1500,
      position: 'bottom',
      color: 'danger',
    });
    await toast.present();
  }
}
