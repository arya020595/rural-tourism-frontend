import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ModalController } from '@ionic/angular';
import { DateModalComponent } from 'src/app/date-modal/date-modal.component';

@Component({
  selector: 'app-tourist-transaction',
  templateUrl: './tourist-transaction.page.html',
  styleUrls: ['./tourist-transaction.page.scss'],
})
export class TouristTransactionPage implements OnInit {
  selectedDate?: string;

  filteredTransactions: any[] = [];

  selectedSegment: string = 'activity';

  get activityTransactions() {
    return this.filteredTransactions.filter(
      (t) =>
        !t.package &&
        (t.activity_id || t._bookingType === 'activity') &&
        (t.receipt_id || this.isCancelled(t.status)),
    );
  }

  get accomTransactions() {
    return this.filteredTransactions.filter(
      (t) =>
        !t.package &&
        (t.homest_id || t._bookingType === 'accommodation') &&
        (t.receipt_id || this.isCancelled(t.status)),
    );
  }

  get packageTransactions() {
    return this.filteredTransactions.filter((t) => t.package && t.receipt_id);
  }

  isCancelled(status: string): boolean {
    return ['cancelled', 'canceled'].includes((status || '').toLowerCase());
  }

  getTransactionStatusColor(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'void') return 'danger';
    if (s === 'cancelled' || s === 'canceled') return 'danger';
    return 'success';
  }

  normalizeCancelledBooking(b: any): any {
    if (b.type === 'activity') {
      return {
        _bookingType: 'activity',
        activity_id: b.operator_activity_id || b.id,
        activity_name: b.activityName || b.activity_name,
        date: b.date,
        pax: b.no_of_pax,
        total_rm: b.total_price,
        status: b.status,
        receipt_id: null,
        tourist: { full_name: b.contact_name },
      };
    } else {
      return {
        _bookingType: 'accommodation',
        homest_id: b.accommodation_id || b.id,
        homest_name: b.accommodation_name,
        date: b.check_in || b.date,
        pax: b.no_of_pax,
        total_rm: b.total_price,
        total_night: b.total_no_of_nights,
        status: b.status,
        receipt_id: null,
        tourist: { full_name: b.contact_name },
      };
    }
  }

  transactions: any[] = [];
  voidedReceipts: Set<number | string> = new Set();
  packageDescArray: string[] = [];
  totalRM: number = 0;
  private apiUrl = environment.apiUrl;

  constructor(
    private apiService: ApiService,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private router: Router,
    private alertController: AlertController,
    private http: HttpClient,
    private toastController: ToastController,
    private cdRef: ChangeDetectorRef,
  ) {
    this.filteredTransactions = [...this.transactions];
  }

  ngOnInit() {
    this.loadHistory();
  }

  async openDateModal() {
    const modal = await this.modalCtrl.create({
      component: DateModalComponent,
      componentProps: { selectedDate: this.selectedDate },
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      this.selectedDate = data;
      this.filterTransactions();
    }
  }

  backHome() {
    this.navCtrl.navigateBack('/tourist/home');
  }

  loadHistory() {
    const uid = localStorage.getItem('tourist_user_id') as string;

    this.apiService.getFormsByTourist(uid).subscribe(
      (data) => {
        const paid = Array.isArray(data?.data) ? data.data : [];

        this.apiService.getTouristAllBookings(uid).subscribe(
          (res: any) => {
            const allBookings = Array.isArray(res?.data) ? res.data : [];
            const cancelled = allBookings
              .filter((b: any) => this.isCancelled(b.status))
              .map((b: any) => this.normalizeCancelledBooking(b));

            this.transactions = [...paid, ...cancelled];

            this.transactions.sort((a, b) => {
              return (
                new Date(b.createdAt || b.date).getTime() -
                new Date(a.createdAt || a.date).getTime()
              );
            });

            this.transactions.forEach((transaction: any) => {
              if (transaction.package) {
                try {
                  const packageArray =
                    typeof transaction.package === 'string'
                      ? JSON.parse(transaction.package)
                      : transaction.package;

                  if (Array.isArray(packageArray)) {
                    transaction.packageDescArray = packageArray.map(
                      (item: any) => ({
                        desc: item.nameOfBusiness,
                        rm: item.total_rm,
                      }),
                    );
                    transaction.total = packageArray.reduce(
                      (sum: number, item: any) => sum + item.total_rm,
                      0,
                    );
                  }
                } catch (error) {
                  console.error('Error parsing package data', error);
                }
              }
            });

            this.filteredTransactions = [...this.transactions];

            if (this.selectedDate) {
              this.filterTransactions();
            }
          },
          (error) => console.error(error),
        );
      },
      (error) => {
        console.error(error);
      },
    );
  }

  filterTransactions() {
    if (!this.selectedDate) {
      return;
    }

    const selectedStr = this.selectedDate.substring(0, 10);

    this.filteredTransactions = this.transactions.filter((t) => {
      const bookingDate = t.date ? t.date.substring(0, 10) : null;
      return bookingDate === selectedStr;
    });
  }

  resetFilter() {
    this.selectedDate = undefined;
    this.filteredTransactions = [...this.transactions];
  }

  showReceipt(transaction: any) {
    this.navCtrl.navigateForward('/view-receipt/' + transaction.receipt_id, {
      state: { transaction },
    });
  }

  isVoided(status: string): boolean {
    return status === 'void';
  }
}
