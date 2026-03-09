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
      (t) => t.activity_id && !t.package && t.receipt_id,
    );
  }

  get accomTransactions() {
    return this.filteredTransactions.filter(
      (t) => t.homest_id && !t.package && t.receipt_id,
    );
  }

  get packageTransactions() {
    return this.filteredTransactions.filter((t) => t.package && t.receipt_id);
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
        this.transactions = Array.isArray(data?.data) ? data.data : [];

        this.transactions.sort((a, b) => {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
