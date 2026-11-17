import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, MenuController, NavController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LoadingService } from '../../services/loading.service';
import { MenuItem, MenuService } from '../../services/menu.service';
import { NativeDownloadService } from '../../services/native-download.service';
import { NetworkService } from '../../services/network.service';
import { QuotationService } from '../../services/quotation.service';
import { ToastService } from '../../services/toast.service';
import { activityDateKey, activityTime } from '../../utils/activity-date.util';
import { Quotation, QuotationItem, QUOTATION_STATUS_LABELS } from '../quotation.models';

const MENU_ID = 'quotation-detail-menu';

@Component({
  selector: 'app-quotation-detail',
  templateUrl: './quotation-detail.page.html',
  styleUrls: ['./quotation-detail.page.scss'],
})
export class QuotationDetailPage {
  readonly menuId = MENU_ID;
  readonly statusLabels = QUOTATION_STATUS_LABELS;
  user: any = null;
  menuItems: MenuItem[] = [];

  quotation: Quotation | null = null;
  isLoading = false;
  isBusy = false;
  loadError = '';

  constructor(
    private route: ActivatedRoute,
    private menuCtrl: MenuController,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private menuService: MenuService,
    private authService: AuthService,
    private quotationService: QuotationService,
    private networkService: NetworkService,
    private nativeDownload: NativeDownloadService,
    private loadingService: LoadingService,
    private toastService: ToastService,
  ) {}

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, MENU_ID);
    this.loadUser();
    this.load();
  }

  get id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  async load(): Promise<void> {
    if (!this.networkService.isOnline) {
      this.loadError = 'Sebut harga perlukan internet / Quotations need an internet connection.';
      return;
    }
    this.isLoading = true;
    this.loadError = '';
    try {
      this.quotation = await firstValueFrom(this.quotationService.get(this.id));
    } catch (error: any) {
      this.quotation = null;
      this.loadError =
        error?.error?.message || 'Gagal memuatkan sebut harga / Failed to load the quotation.';
    } finally {
      this.isLoading = false;
    }
  }

  /* ── Display helpers ─────────────────────────────────────────────── */

  formatDate(value: string | null | undefined): string {
    if (!value) return '-';
    const [year, month, day] = String(value).slice(0, 10).split('-');
    return `${day}-${month}-${year}`;
  }

  formatMoney(value: string | number | undefined): string {
    return Number(value || 0).toLocaleString('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  typeLabel(item: QuotationItem): string {
    return item.product_type === 'accommodation' ? 'Penginapan/Accommodation' : 'Aktiviti/Activity';
  }

  /** "16-11-2026, 07:00 AM" or "14-11-2026 – 16-11-2026" + nights. */
  when(item: QuotationItem): { main: string; sub: string } {
    if (item.product_type === 'accommodation') {
      const checkIn = activityDateKey(item.check_in_date);
      const checkOut = activityDateKey(item.check_out_date);
      if (!checkIn) return { main: '-', sub: '' };
      const nights = checkOut
        ? Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86400000)
        : 0;
      return {
        main: `${this.formatDate(checkIn)} – ${this.formatDate(checkOut)}`,
        sub: nights ? `${nights} malam/night${nights === 1 ? '' : 's'}` : '',
      };
    }
    const day = activityDateKey(item.activity_date);
    const time = activityTime(item.activity_date);
    if (!day) return { main: '-', sub: '' };
    const match = String(time || '').match(/^(\d{1,2}):(\d{2})/);
    const timeText = match
      ? `, ${String(Number(match[1]) % 12 || 12).padStart(2, '0')}:${match[2]} ${Number(match[1]) >= 12 ? 'PM' : 'AM'}`
      : '';
    return { main: `${this.formatDate(day)}${timeText}`, sub: '' };
  }

  get paxText(): string {
    const q = this.quotation;
    if (!q) return '';
    if (q.no_of_pax_domestik && q.no_of_pax_antarbangsa) {
      return `${q.total_pax} (${q.no_of_pax_domestik} domestik/domestic, ${q.no_of_pax_antarbangsa} antarabangsa/international)`;
    }
    return String(q.total_pax);
  }

  get daysLeftText(): string {
    const q = this.quotation;
    if (!q || q.status !== 'sent' || q.days_left === null) return '';
    if (q.days_left === 0) return 'tamat hari ini / ends today';
    return `${q.days_left} hari lagi / ${q.days_left} day${q.days_left === 1 ? '' : 's'} left`;
  }

  get notesLines(): string[] {
    return String(this.quotation?.notes || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  /** The booking type a conversion creates: 2+ items is a package. */
  get convertType(): 'activity' | 'accommodation' | 'package' {
    const items = this.quotation?.items || [];
    return items.length === 1 ? items[0].product_type : 'package';
  }

  /* ── Actions ─────────────────────────────────────────────────────── */

  async downloadPdf(): Promise<void> {
    if (!this.quotation) return;
    const quotation = this.quotation;
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

  edit(): void {
    this.navCtrl.navigateForward(`/quotation/edit/${this.id}`);
  }

  convertToBooking(): void {
    this.navCtrl.navigateForward('/booking-home/add', {
      queryParams: { quotation: this.id },
    });
  }

  convertToReceipt(): void {
    this.navCtrl.navigateForward(`/e-receipt/add/${this.convertType}`, {
      queryParams: { quotation: this.id },
    });
  }

  viewBooking(): void {
    if (this.quotation?.booking_id) {
      this.navCtrl.navigateForward(`/booking-home/detail/${this.quotation.booking_id}`);
    }
  }

  async confirmCancel(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Batalkan sebut harga? / Cancel quotation?',
      message: 'Ia tidak boleh diubah atau ditukar selepas ini. / It can no longer be edited or converted.',
      // The buttons stack on narrow alerts: "Yes, cancel" on top, "No" below.
      buttons: [
        {
          text: 'Ya, batalkan/Yes, cancel',
          role: 'destructive',
          handler: () =>
            this.run(
              () => firstValueFrom(this.quotationService.cancel(this.id)),
              'Sebut harga dibatalkan / Quotation cancelled',
            ),
        },
        { text: 'Tidak/No', role: 'cancel' },
      ],
    });
    await alert.present();
  }

  private async run(action: () => Promise<Quotation>, message: string): Promise<void> {
    if (this.isBusy) return;
    this.isBusy = true;
    try {
      this.quotation = await action();
      this.toastService.success(message);
    } catch (error: any) {
      this.toastService.error(error?.error?.message || 'Tindakan gagal / Action failed.');
    } finally {
      this.isBusy = false;
    }
  }

  goBack(): void {
    this.navCtrl.navigateBack('/quotation');
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
