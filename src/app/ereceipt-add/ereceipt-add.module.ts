import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { SharedModule } from '../_shared/shared.module';
import { ActivityBookingFormComponent } from '../booking-forms/components/activity-booking-form/activity-booking-form.component';
import { AccommodationBookingFormComponent } from '../booking-forms/components/accommodation-booking-form/accommodation-booking-form.component';
import { PackageBookingFormComponent } from '../booking-forms/components/package-booking-form/package-booking-form.component';
import { EreceiptAddPageRoutingModule } from './ereceipt-add-routing.module';
import { EreceiptAddPage } from './ereceipt-add.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    ActivityBookingFormComponent,
    AccommodationBookingFormComponent,
    PackageBookingFormComponent,
    EreceiptAddPageRoutingModule,
  ],
  declarations: [EreceiptAddPage],
})
export class EreceiptAddPageModule {}
