import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { SharedModule } from '../_shared/shared.module';
import { EReceiptPageRoutingModule } from './e-receipt-routing.module';
import { EReceiptPage } from './e-receipt.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EReceiptPageRoutingModule,
    SharedModule,
  ],
  declarations: [EReceiptPage],
})
export class EReceiptPageModule {}
