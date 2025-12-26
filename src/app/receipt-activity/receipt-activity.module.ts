import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReceiptActivityPageRoutingModule } from './receipt-activity-routing.module';

import { ReceiptActivityPage } from './receipt-activity.page';

import { QRCodeModule } from 'angularx-qrcode'; //QR code generator library

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReceiptActivityPageRoutingModule,
    QRCodeModule
  ],
  declarations: [ReceiptActivityPage]
})
export class ReceiptActivityPageModule {}
