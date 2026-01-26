import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';
import { AlertController, ToastController  } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { environment } from '../../environments/environment';
import { ModalController } from '@ionic/angular';
import { DateModalComponent } from 'src/app/date-modal/date-modal.component';
import { IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList } from '@ionic/angular/standalone';


@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.page.html',
  styleUrls: ['./transaction.page.scss'],
  // standalone: true,
  // imports: [IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList]
})
export class TransactionPage implements OnInit {

  selectedDate?: string;  // bound to ion-datetime

  filteredTransactions: any[] = []; // filtered view

  constructor(
    private apiService: ApiService,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private router: Router,
    private alertController: AlertController,
    private http: HttpClient,
    private toastController: ToastController,
    private cdRef: ChangeDetectorRef
  ) { this.filteredTransactions = [...this.transactions];}

  ngOnInit() {
    // this.loadTransactions();
    this.loadHistory();
  }

  async openDateModal() {
    const modal = await this.modalCtrl.create({
      component: DateModalComponent,
      componentProps: {
        selectedDate: this.selectedDate // optionally pass the current date
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      this.selectedDate = data; // get selected date from modal
      this.filterTransactions(); // apply filtering immediately
    }
  }

  async showToast(message: string, duration: number = 2000) {
    const toast = await this.toastController.create({
      message: message,
      duration: duration,  // Duration in milliseconds
      position: 'bottom',  // Position of the toast (can be 'top', 'bottom', or 'middle')
    });
    toast.present();
  }

  // Load the transactions from API
  loadTransactions() {
    // Fetch the transactions
    this.apiService.getFormsByUser('user-id').subscribe((data: any) => {
      this.transactions = data;
    });
  }

  onTransactionClick(transaction: any) {
    // If the transaction is already voided, do nothing
    // if (this.isVoided(transaction.receipt_id)) {
    //   return;
    // }

    // Show confirmation dialog
    this.showVoidConfirmation(transaction);
    console.log(this.isVoided);
    console.log(transaction.receipt_id);
  }

  // Show confirmation dialog to void the transaction
  async showVoidConfirmation(transaction: any) {
    const alert = await this.alertController.create({
      header: 'Confirm Void',
      message: `Are you sure you want to void the transaction for receipt ID: ${transaction.receipt_id}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            // this.navCtrl.navigateForward('/view-receipt/' + transaction.receipt_id);
          }
        }, {
          text: 'Yes, Void',
          handler: () => {
            this.voidReceipt(transaction.receipt_id);
          }
        }
      ]
    });

    await alert.present();
  }

  // Show receipt
showReceipt(transaction: any){
  this.navCtrl.navigateForward('/view-receipt/' + transaction.receipt_id, {
    state: { transaction }  // pass the whole transaction object
  });
}


  // transactions: any[] = [{
  //   receipt_id: '',
  //   user_id: localStorage.getItem('uid'),
  //   citizenship: '',
  //   pax: '',
  //   activity_name: '',
  //   homest_name: '',
  //   location: '',//get location based on input
  //   activity_id: '',
  //   homest_id: '',
  //   total_rm: '',
  //   package: '',
  //   issuer:'',
  //   status:''
  // }];
  transactions: any[] = [];

  voidedReceipts: Set<number | string> = new Set();
  // apiUrl: string = 'http://localhost:3000/transaction';

  packageDescArray: string[] = [];
  totalRM: number = 0;

  backHome(){
    this.navCtrl.navigateForward('/home', {
      animated: true,        // Enable animation
      animationDirection: 'back'  // Can be 'forward' or 'back' for custom direction
    });
  }

loadHistory() {
  const uid = localStorage.getItem('uid') as string;

  this.apiService.getFormsByUser(uid).subscribe(
    (data) => {
      this.transactions = Array.isArray(data?.data) ? data.data : [];

      // Sort transactions by createdAt descending
      this.transactions.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      // Process package data
      this.transactions.forEach((transaction: any) => {
        if (transaction.package) {
          try {
            const packageArray = typeof transaction.package === 'string'
              ? JSON.parse(transaction.package)
              : transaction.package;

            if (Array.isArray(packageArray)) {
              transaction.packageDescArray = packageArray.map((item: any) => ({
                desc: item.nameOfBusiness,
                rm: item.total_rm
              }));
              transaction.total = packageArray.reduce((sum: number, item: any) => sum + item.total_rm, 0);
            }
          } catch (error) {
            console.error('Error parsing package data', error);
          }
        }
      });

      // ✅ Initialize filteredTransactions to show all by default
      this.filteredTransactions = [...this.transactions];

      // Optional: Apply date filter automatically if selectedDate is set
      if (this.selectedDate) {
        this.filterTransactions();
      }

    },
    (error) => {
      console.error(error);
    }
  );
}


  filterTransactions() {
    if (!this.selectedDate) {
      // this.filteredTransactions = [...this.transactions];
      return;
    }

    const selected = new Date(this.selectedDate);
    // Normalize selected date (remove time part)
    selected.setHours(0, 0, 0, 0);

    this.filteredTransactions = this.transactions.filter(t => {
      const created = new Date(t.createdAt);
      created.setHours(0, 0, 0, 0);
      return created.getTime() === selected.getTime();
    });
  }

  resetFilter() {
    this.selectedDate = undefined;
    this.filteredTransactions = [...this.transactions];
  }

  async confirmVoidReceipt(receiptId: string | number) {
    console.log('Clicked receipt ID:', receiptId);
    const alert = await this.alertController.create({
      header: 'Void Receipt',
      message: 'Are you sure you want to void this receipt?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Yes',
          handler: () => {
            this.voidReceipt(receiptId);
          },
        },
      ],
    });

    await alert.present();
  }

  async onHistoryClick(receiptId: string | number) {
    console.log('Clicked receipt ID:', receiptId);

    const alert = await this.alertController.create({
      header: 'Confirm',
      message: 'Are you sure you want to void the receipt?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Void canceled');
          },
        },
        {
          text: 'Yes',
          handler: () => {
            console.log(`Receipt ${receiptId} voided`);
            this.voidReceipt(receiptId);
          },
        },
      ],
    });

    await alert.present();
  }

  // Void the transaction by calling the API
  // isVoided: Boolean = false;
  private apiUrl = environment.apiUrl;
  voidReceipt(receiptId: string | number): void {
    this.http.post(`${this.apiUrl}/receipts/void-receipt`, { receipt_id: receiptId })
      .subscribe(
        response => {
          console.log('Receipt voided successfully', response);
          // this.isVoided = true;
          console.log(this.isVoided);
          // transaction.status = 'void'; 
          this.cdRef.detectChanges();
          window.location.reload();
        },
        error => {
          console.error('Failed to void receipt', error);
        }
      );
  }

  fetchTransactions(): void {
    this.http.get('http://localhost:3000/api/receipt')  // Update with your actual endpoint
      .subscribe(
        (response: any) => {
          // Assuming 'response' contains the list of transactions
          this.transactions = response.data; // Update the transactions array
          console.log('Transactions fetched successfully', this.transactions);
        },
        (error) => {
          console.error('Failed to fetch transactions', error);
        }
      );
  }

  isVoided(status: string): boolean {
    return status === 'void'; // Check if the status is 'void'
  }
}
