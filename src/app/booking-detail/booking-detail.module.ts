import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BookingDetailPageRoutingModule } from './booking-detail-routing.module';
import { SharedModule } from '../_shared/shared.module';
import { ActivityBookingFormComponent } from '../booking-forms/components/activity-booking-form/activity-booking-form.component';
import { AccommodationBookingFormComponent } from '../booking-forms/components/accommodation-booking-form/accommodation-booking-form.component';
import { PackageBookingFormComponent } from '../booking-forms/components/package-booking-form/package-booking-form.component';

import { BookingDetailPage } from './booking-detail.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BookingDetailPageRoutingModule,
    SharedModule,
    ActivityBookingFormComponent,
    AccommodationBookingFormComponent,
    PackageBookingFormComponent,
  ],
  declarations: [BookingDetailPage],
})
export class BookingDetailPageModule {}
