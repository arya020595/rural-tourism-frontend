import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { IonicModule } from '@ionic/angular';

import { SharedModule } from '../_shared/shared.module';
import { MyTransactionReceiptPageRoutingModule } from './my-transaction-receipt-routing.module';
import { MyTransactionReceiptPage } from './my-transaction-receipt.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    SharedModule,
    MyTransactionReceiptPageRoutingModule,
  ],
  declarations: [MyTransactionReceiptPage],
})
export class MyTransactionReceiptPageModule {}
