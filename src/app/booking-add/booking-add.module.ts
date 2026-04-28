import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SharedModule } from '../_shared/shared.module';
import { BookingAddPageRoutingModule } from './booking-add-routing.module';
import { BookingAddPage } from './booking-add.page';
import { AccommodationBookingFormComponent } from './components/accommodation-booking-form/accommodation-booking-form.component';
import { ActivityBookingFormComponent } from './components/activity-booking-form/activity-booking-form.component';
import { PackageBookingFormComponent } from './components/package-booking-form/package-booking-form.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    BookingAddPageRoutingModule,
  ],
  declarations: [
    BookingAddPage,
    ActivityBookingFormComponent,
    AccommodationBookingFormComponent,
    PackageBookingFormComponent,
  ],
})
export class BookingAddPageModule {}
