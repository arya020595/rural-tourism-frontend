import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReceiptPageRoutingModule } from './receipt-routing.module';

import { ReceiptPage } from './receipt.page';

import { QRCodeModule } from 'angularx-qrcode'; //QR code generator library

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReceiptPageRoutingModule,
    QRCodeModule
  ],
  declarations: [ReceiptPage]
})
export class ReceiptPageModule {}
