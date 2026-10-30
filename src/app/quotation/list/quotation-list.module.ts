import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { SharedModule } from '../../_shared/shared.module';
import { BookingDateSheetComponent } from '../../booking-forms/components/booking-date-sheet/booking-date-sheet.component';
import { QuotationListPageRoutingModule } from './quotation-list-routing.module';
import { QuotationListPage } from './quotation-list.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    BookingDateSheetComponent,
    QuotationListPageRoutingModule,
  ],
  declarations: [QuotationListPage],
})
export class QuotationListPageModule {}
