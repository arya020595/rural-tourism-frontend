import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { SharedModule } from '../../_shared/shared.module';
import { BookingDateSheetComponent } from '../../booking-forms/components/booking-date-sheet/booking-date-sheet.component';
import { AssociationStatisticsPageRoutingModule } from './association-statistics-routing.module';
import { AssociationStatisticsPage } from './association-statistics.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    BookingDateSheetComponent,
    AssociationStatisticsPageRoutingModule,
  ],
  declarations: [AssociationStatisticsPage],
})
export class AssociationStatisticsPageModule {}
