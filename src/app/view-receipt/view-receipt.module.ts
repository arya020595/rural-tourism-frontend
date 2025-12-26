import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ViewReceiptPageRoutingModule } from './view-receipt-routing.module';

import { ViewReceiptPage } from './view-receipt.page';

import { QRCodeModule } from 'angularx-qrcode'; //QR code generator library

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ViewReceiptPageRoutingModule,
    QRCodeModule
  ],
  declarations: [ViewReceiptPage]
})
export class ViewReceiptPageModule {}
