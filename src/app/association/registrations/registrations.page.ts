import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, MenuController } from '@ionic/angular';
import { Subject, Subscription, debounceTime, firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { FileUrlService } from '../../services/file-url.service';
import { LoadingService } from '../../services/loading.service';
import { MenuItem, MenuService } from '../../services/menu.service';
import { NetworkService } from '../../services/network.service';
import {
  REGISTRATION_STATUS_LABELS,
  Registration,
  RegistrationCounts,
  RegistrationService,
  RegistrationStatus,
} from '../../services/registration.service';
import { ToastService } from '../../services/toast.service';

const MENU_ID = 'registrations-menu';

/**
 * Kelulusan Pendaftaran / Registration Approvals — association users approve
 * or reject their association's new operator registrations; superadmin all.
 * ✎ on a row opens the review pop-up (details + documents + Approve / Reject).
 */
@Component({
  selector: 'app-registrations',
  templateUrl: './registrations.page.html',
  styleUrls: ['./registrations.page.scss'],
})
export class RegistrationsPage implements OnInit, OnDestroy {
  readonly menuId = MENU_ID;
  readonly statusLabels = REGISTRATION_STATUS_LABELS;
  readonly tabs: RegistrationStatus[] = ['pending', 'approved', 'rejected'];
  readonly tabIcons: Record<RegistrationStatus, string> = {
    pending: 'person-add',
    approved: 'people',
    rejected: 'person-remove',
  };
  readonly documentLabels: Array<{ key: keyof NonNullable<Registration['documents']>; label: string }> = [
    { key: 'operator_logo_image', label: 'Logo Pengendali / Operator Logo' },
    { key: 'motac_license_file', label: 'Lesen MOTAC / MOTAC License' },
    { key: 'trading_operation_license', label: 'Lesen Perdagangan & Operasi / Trading & Operation License' },
    { key: 'homestay_certificate', label: 'Sijil Penginapan / Homestay Certificate' },
  ];

  user: any = null;
  menuItems: MenuItem[] = [];
  isSuperadmin = false;

  status: RegistrationStatus = 'pending';
  search = '';
  page = 1;
  readonly perPage = 10;
  total = 0;
  totalPages = 1;
  rows: Registration[] = [];
  counts: RegistrationCounts = { all: 0, pending: 0, approved: 0, rejected: 0 };
  isLoading = false;
  loadError = '';
  isOffline = false;

  // Review pop-up
  reviewOpen = false;
  reviewLoading = false;
  review: Registration | null = null;
  isDeciding = false;

  private search$ = new Subject<void>();
  private subscriptions = new Subscription();

  constructor(
    private menuCtrl: MenuController,
    private alertCtrl: AlertController,
    private menuService: MenuService,
    private authService: AuthService,
    private registrationService: RegistrationService,
    private fileUrl: FileUrlService,
    private networkService: NetworkService,
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

  /* ── List ─────────────────────────────────────────────────────────── */

  async load(): Promise<void> {
    this.isOffline = !this.networkService.isOnline;
    if (this.isOffline) {
      this.rows = [];
      return;
    }
    this.isLoading = true;
    this.loadError = '';
    try {
      const res = await firstValueFrom(
        this.registrationService.list({ status: this.status, search: this.search.trim(), page: this.page, per_page: this.perPage }),
      );
      this.rows = res.data || [];
      this.counts = res.counts || this.counts;
      this.total = res.meta?.total ?? this.rows.length;
      this.totalPages = Math.max(res.meta?.total_pages || 1, 1);
    } catch (error: any) {
      this.rows = [];
      this.loadError = error?.error?.message || 'Gagal memuatkan pendaftaran / Failed to load registrations.';
    } finally {
      this.isLoading = false;
    }
  }

  setStatus(status: RegistrationStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.page = 1;
    this.load();
  }

  onSearchInput(value: string): void {
    this.search = value;
    this.search$.next();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    this.page = page;
    this.load();
  }

  /* ── Review pop-up ────────────────────────────────────────────────── */

  async openReview(row: Registration): Promise<void> {
    this.review = row;
    this.reviewOpen = true;
    this.reviewLoading = true;
    try {
      this.review = await firstValueFrom(this.registrationService.get(row.company_id));
    } catch (error: any) {
      this.toastService.error(error?.error?.message || 'Gagal memuatkan / Failed to load.');
      this.reviewOpen = false;
    } finally {
      this.reviewLoading = false;
    }
  }

  closeReview(): void {
    this.reviewOpen = false;
  }

  /** Opens an uploaded document in a new tab / the system viewer. */
  openDocument(value: string | null | undefined): void {
    if (!value) return;
    const isPdf = /\.pdf($|\?)/i.test(value) || value.startsWith('JVBER');
    const url = this.fileUrl.resolve(value, { base64MimeType: isPdf ? 'application/pdf' : 'image/png' });
    if (url) window.open(url, '_blank');
  }

  get emptyText(): string {
    if (this.status === 'pending') return 'Tiada pendaftaran menunggu / No pending registrations';
    if (this.status === 'approved') return 'Tiada ahli aktif / No active members';
    return 'Tiada ahli tidak aktif / No inactive members';
  }

  /** Pending → Approve, or Inactive → Activate (same API). */
  async confirmApprove(): Promise<void> {
    const registration = this.review;
    if (!registration || this.isDeciding) return;
    const activate = registration.status === 'rejected';
    const alert = await this.alertCtrl.create({
      header: activate ? 'Aktifkan syarikat? / Activate company?' : 'Luluskan pendaftaran? / Approve registration?',
      message: `${registration.company_name} boleh log masuk selepas ini dan akan menerima emel. / ${registration.company_name} can log in after this and will get an email.`,
      // Same layout as the reason pop-up: Cancel left, the action right.
      cssClass: 'alert-side-by-side',
      buttons: [
        { text: 'Batal/Cancel', role: 'cancel' },
        {
          text: activate ? 'Aktifkan/Activate' : 'Luluskan/Approve',
          cssClass: 'alert-btn-confirm',
          handler: () => { void this.decide('approve'); },
        },
      ],
    });
    await alert.present();
  }

  /**
   * Pending → Reject, or Active → Deactivate (same API). The reason is
   * required (Submit keeps the pop-up open while empty).
   */
  async openRejectReason(): Promise<void> {
    const registration = this.review;
    if (!registration || this.isDeciding) return;
    const deactivate = registration.status === 'approved';
    const alert = await this.alertCtrl.create({
      header: deactivate ? 'Nyahaktif syarikat? / Deactivate company?' : 'Tolak pendaftaran? / Reject registration?',
      message: deactivate
        ? 'Pengendali tidak boleh log masuk dan akan menerima emel dengan sebab ini. / The operator will no longer be able to log in and will get an email with this reason.'
        : 'Pengendali akan menerima emel dengan sebab ini dan diminta menghubungi persatuan. / The operator will get an email with this reason and be asked to contact the association.',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Sebab / Reason *',
          attributes: { maxlength: 1000, rows: 4 },
        },
      ],
      buttons: [
        { text: 'Batal/Cancel', role: 'cancel' },
        {
          text: 'Hantar/Submit',
          cssClass: 'alert-btn-danger',
          handler: (data: { reason?: string }) => {
            const reason = String(data?.reason || '').trim();
            if (!reason) {
              this.toastService.warning('Sila nyatakan sebab / Please give a reason.');
              return false;
            }
            void this.decide('reject', reason);
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  private async decide(action: 'approve' | 'reject', reason = ''): Promise<void> {
    const registration = this.review;
    if (!registration) return;
    const wasStatus = registration.status;
    this.isDeciding = true;
    try {
      await this.loadingService.show('Menyimpan / Saving...');
      const updated = await firstValueFrom(
        action === 'approve'
          ? this.registrationService.approve(registration.company_id)
          : this.registrationService.reject(registration.company_id, reason),
      );
      this.review = { ...updated, documents: registration.documents };
      this.reviewOpen = false;
      const done =
        action === 'approve'
          ? wasStatus === 'rejected' ? 'diaktifkan / activated' : 'diluluskan / approved'
          : wasStatus === 'approved' ? 'dinyahaktifkan / deactivated' : 'ditolak / rejected';
      this.toastService.success(`${updated.company_name} ${done}`);
      await this.load();
    } catch (error: any) {
      this.toastService.error(error?.error?.message || 'Tindakan gagal / Action failed.');
    } finally {
      await this.loadingService.hide();
      this.isDeciding = false;
    }
  }

  /* ── Display helpers ──────────────────────────────────────────────── */

  formatDate(value: string | null | undefined): string {
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

  /** Columns in the table for the open tab (for the empty row's colspan). */
  get columnCount(): number {
    return 5 + (this.isSuperadmin ? 1 : 0) + (this.status !== 'pending' ? 1 : 0) + (this.status === 'rejected' ? 1 : 0);
  }

  addressText(registration: Registration): string {
    const c = registration.company;
    const area = [c.postcode, c.location].filter(Boolean).join(' ');
    return [c.address, area].filter(Boolean).join(', ') || '-';
  }

  staffText(registration: Registration): string {
    const full = registration.company.total_fulltime_staff ?? 0;
    const part = registration.company.total_partime_staff ?? 0;
    return `${full} sepenuh masa/full-time · ${part} sambilan/part-time`;
  }

  documentKind(value: string | null | undefined): string {
    if (!value) return '—';
    return /\.pdf($|\?)/i.test(value) || value.startsWith('JVBER') ? 'PDF' : 'IMG';
  }

  get pageNumbers(): number[] {
    const start = Math.max(1, Math.min(this.page - 2, this.totalPages - 4));
    const end = Math.min(this.totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  trackById(_: number, row: Registration): number {
    return row.company_id;
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
    this.isSuperadmin = this.authService.getCurrentRole() === 'superadmin';
    this.menuItems = this.menuService.getVisibleMenuItemsForCurrentUser();
  }
}
