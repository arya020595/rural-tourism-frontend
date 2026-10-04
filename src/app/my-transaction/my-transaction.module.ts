import { BookingDateSheetComponent } from '../booking-forms/components/booking-date-sheet/booking-date-sheet.component';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SharedModule } from '../_shared/shared.module';
import { MyTransactionPageRoutingModule } from './my-transaction-routing.module';
import { MyTransactionPage } from './my-transaction.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    MyTransactionPageRoutingModule,
    BookingDateSheetComponent,
  ],
  declarations: [MyTransactionPage],
})
export class MyTransactionPageModule {}
