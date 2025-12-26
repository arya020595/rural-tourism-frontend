import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReceiptPackagePageRoutingModule } from './receipt-package-routing.module';

import { ReceiptPackagePage } from './receipt-package.page';

import { QRCodeModule } from 'angularx-qrcode'; //QR code generator library

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReceiptPackagePageRoutingModule,
    QRCodeModule
  ],
  declarations: [ReceiptPackagePage]
})
export class ReceiptPackagePageModule {}
