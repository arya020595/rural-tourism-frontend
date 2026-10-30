import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { SharedModule } from '../../_shared/shared.module';
import { BookingDateSheetComponent } from '../../booking-forms/components/booking-date-sheet/booking-date-sheet.component';
import { QuotationFormPageRoutingModule } from './quotation-form-routing.module';
import { QuotationFormPage } from './quotation-form.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    BookingDateSheetComponent,
    QuotationFormPageRoutingModule,
  ],
  declarations: [QuotationFormPage],
})
export class QuotationFormPageModule {}
