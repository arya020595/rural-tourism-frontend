import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Transaction } from '../my-transaction/my-transaction.models';

interface ReceiptViewModel {
  receiptDateLabel: string;
  bookedBy: string;
  title: string;
  checkInDate: string;
  checkOutDate: string;
  totalNightsLabel: string;
  paymentStatus: string;
  issuedBy: string;
  issuerEmail: string;
  totalLabel: string;
  transactionId: string;
}

@Component({
  selector: 'app-my-transaction-receipt',
  templateUrl: './my-transaction-receipt.page.html',
  styleUrls: ['./my-transaction-receipt.page.scss'],
})
export class MyTransactionReceiptPage implements OnInit {
  receipt: ReceiptViewModel = {
    receiptDateLabel: '10 JAN 2026',
    bookedBy: 'HANANI RASYIQAH',
    title: 'KIULU FARMSTAY',
    checkInDate: '21-01-2025',
    checkOutDate: '24-01-2025',
    totalNightsLabel: '4 MALAM/NIGHTS',
    paymentStatus: 'PAID',
    issuedBy: 'PANDA COMPANY CO.',
    issuerEmail: 'pandacompany@gmail.com',
    totalLabel: 'RM 455.00',
    transactionId: 'TRX-ACCOM-001',
  };

  constructor(
    private router: Router,
    private navCtrl: NavController,
  ) {}

  ngOnInit(): void {
    this.initializeFromNavigationState();
  }

  goBackToTransactionHistory(): void {
    if (window.history.length > 1) {
      this.navCtrl.back();
      return;
    }

    this.navCtrl.navigateBack('/my-transaction', { replaceUrl: true });
  }

  private initializeFromNavigationState(): void {
    // TODO: On real API integration, use transactionId from state/query
    // and fetch full receipt details from backend.
    const state = this.router.getCurrentNavigation()?.extras?.state || history.state;
    const trx = state?.transaction as Transaction | undefined;

    if (!trx) {
      return;
    }

    this.receipt = {
      receiptDateLabel: trx.date.replace(',', '').toUpperCase(),
      bookedBy: trx.name.toUpperCase(),
      title: trx.title.toUpperCase(),
      checkInDate: this.formatToDashDate(trx.date),
      checkOutDate: this.estimateCheckoutDate(trx.date),
      totalNightsLabel: '1 MALAM/NIGHTS',
      paymentStatus: trx.status.toUpperCase(),
      issuedBy: 'PANDA COMPANY CO.',
      issuerEmail: 'pandacompany@gmail.com',
      totalLabel: `RM ${trx.totalPrice.toFixed(2)}`,
      transactionId: String(trx.id),
    };
  }

  private formatToDashDate(label: string): string {
    const date = new Date(label);
    if (Number.isNaN(date.getTime())) {
      return label;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private estimateCheckoutDate(label: string): string {
    const date = new Date(label);
    if (Number.isNaN(date.getTime())) {
      return label;
    }

    date.setDate(date.getDate() + 1);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }
}
