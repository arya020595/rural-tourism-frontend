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
  //  this.loadTransactions();
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

   //show receipt
  showReceipt(transaction: any){
    this.navCtrl.navigateForward('/view-receipt/' + transaction.receipt_id);
  }


  //loadTransactions() {
    //this.http.get<any[]>(this.apiUrl).subscribe({
      //next: (data) => {
       // this.transactions = data;
       // console.log('Transactions loaded:', this.transactions);
     // },
     // error: (err) => {
      //  console.error('Error loading transactions:', err);
      //},
   // });
 // }

  transactions: any[] = [{
    receipt_id: '',
    user_id: localStorage.getItem('uid'),
    citizenship: '',
    pax: '',
    activity_name: '',
    homest_name: '',
    location: '',//get location based on input
    activity_id: '',
    homest_id: '',
    total_rm: '',
    package: '',
    issuer:'',
    status:''
  }];

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
        this.transactions = data;
  
        // Sort transactions by createdAt in descending order
        this.transactions.sort((a, b) => {
          const dateA = new Date(a.createdAt); // Convert to Date object
          const dateB = new Date(b.createdAt); // Convert to Date object
          return dateB.getTime() - dateA.getTime(); // Sort in descending order
        });
  
        // Loop through all transactions and check the package field
        this.transactions.forEach((transaction: any, index: number) => {
          // console.log(`Transaction ${index + 1}:`, transaction);  // Debugging: Print each transaction
  
          // Check if the package field is not null or empty
          if (transaction.package) {
            // Check if the package is a string and if it's not empty
            if (typeof transaction.package === 'string' && transaction.package.trim() !== '') {
              // console.log('Found package data for transaction:', transaction.package); // Debugging: Print package data
  
              try {
                // Try to parse the package field as JSON (string)
                const packageArray = JSON.parse(transaction.package);
                // console.log('Parsed package array:', packageArray);
  
                if (Array.isArray(packageArray)) {
                  // Process the package data if it's an array
                  transaction.packageDescArray = packageArray.map((item: { nameOfBusiness: any, total_rm: number; }) => ({
                    desc: item.nameOfBusiness,
                    rm: item.total_rm
                  }));
  
                  transaction.total = packageArray.reduce((sum: any, item: { total_rm: any; }) => sum + item.total_rm, 0);
                  transaction.totalRM = packageArray.map((item: { total_rm: number }) => item.total_rm);
                  // console.log('Total RM for transaction:', transaction.totalRM);  // Debugging: Print total RM for this transaction
                } else {
                  console.log('Package data is not in the expected array format');
                }
              } catch (error) {
                console.log('Error parsing package data for transaction:', error);  // Error handling
              }
            } else if (Array.isArray(transaction.package)) {
              // If it's already an array, use it directly without parsing
              const packageArray = transaction.package;
              transaction.packageDescArray = packageArray.map((item: { nameOfBusiness: any, total_rm: number; }) => ({
                desc: item.nameOfBusiness,
                rm: item.total_rm
              }));
  
              transaction.total = packageArray.reduce((sum: any, item: { total_rm: any; }) => sum + item.total_rm, 0);
              transaction.totalRM = packageArray.map((item: { total_rm: number }) => item.total_rm);
              console.log('Total RM for transaction:', transaction.totalRM);  // Debugging: Print total RM for this transaction
            } else {
              console.log('Package data is neither a string nor an array');
            }
          } else {
            // console.log('No valid package data found for this transaction');
          }
        });
        this.filteredTransactions = [...this.transactions];
      },
      (error) => {
        console.log(error);
      }
    );
  }

   filterTransactions() {
    if (!this.selectedDate) {
      this.filteredTransactions = [...this.transactions];
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
  
    // Example: Navigate to a detailed page or trigger additional logic
    // this.router.navigate(['/transaction-detail', receiptId]);
  
    // Or, fetch additional data related to the receipt
    // this.transactionService.getTransactionDetails(receiptId).subscribe(details => {
    //   console.log('Transaction details:', details);
    // });
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
  
 // voidReceipt(receiptId: string | number) {
  //  this.http.put(`${this.apiUrl}/${receiptId}`, { status: 'void' }).subscribe({
   //   next: () => {
    //    console.log(`Receipt ${receiptId} voided successfully.`);
     //   this.loadTransactions(); // Reload transactions to reflect changes
     // },
     // error: (err) => {
     //   console.error('Error voiding receipt:', err);
     // },
  //  });
 // }

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
 

 //voidReceipt(receiptId: string | number) {
  // Mark the receipt as voided
 // this.voidedReceipts.add(receiptId);

  // Optionally perform additional actions like updating the database
 // console.log('Updated voided receipts:', Array.from(this.voidedReceipts));
//}

  
  

  // loadHistory(){
  //   const uid = localStorage.getItem('uid') as string;

  //   this.apiService.getFormsByUser(uid).subscribe(
  //     (data) => {
  //       this.transactions = data;
  //       // console.log(this.transactions);

        
  //       this.transactions.sort((a, b) => {
  //         const dateA = new Date(a.createdAt); // Convert to Date object
  //         const dateB = new Date(b.createdAt); // Convert to Date object

  //         return dateB.getTime() - dateA.getTime(); // Sort in descending order
  //       });


      
  //      // Loop through all transactions and check the package field
  //     this.transactions.forEach((transaction: any, index: number) => {
  //       // console.log(`Transaction ${index + 1}:`, transaction);  // Debugging: Print each transaction

  //       // Check if the package field is not null or empty
  //       if (transaction.package && transaction.package.trim() !== '') {
  //         // console.log('Found package data for transaction:', transaction.package); // Debugging: Print package data

  //         try {
  //           // Try to parse the package field as JSON
  //           const packageArray = JSON.parse(transaction.package);
  //           // console.log('Parsed package array:', packageArray);

  //           if (Array.isArray(packageArray)) {
  //             // Process the package data (assuming package is an array of objects)
  //             transaction.packageDescArray = packageArray.map((item: { nameOfBusiness: any, total_rm: number; }) => 
  //               ({
  //                 desc: item.nameOfBusiness,
  //                 rm: item.total_rm            
  //               }));


  //             transaction.total = packageArray.reduce((sum: any, item: { total_rm: any; }) => sum + item.total_rm, 0);
  //             transaction.totalRM =  packageArray.map((item: { total_rm: number }) => item.total_rm);
  //             // console.log('Total RM for transaction:', transaction.totalRM);  // Debugging: Print total RM for this transaction
  //           } else {
  //             console.log('Package data is not in the expected array format');
  //           }
  //         } catch (error) {
  //           console.log('Error parsing package data for transaction:', error);  // Error handling
  //         }
  //       } else {
  //         console.log('No valid package data found for this transaction');
  //       }
  //     });
      
  //     },
  //     (error)=>{
  //       console.log(error);
  //     }

     
  //   )
  // }