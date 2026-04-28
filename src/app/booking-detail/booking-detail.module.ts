import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BookingDetailPageRoutingModule } from './booking-detail-routing.module';
import { SharedModule } from '../_shared/shared.module';

import { BookingDetailPage } from './booking-detail.page';
import { ActivityBookingDetailComponent } from './components/activity-booking-detail/activity-booking-detail.component';
import { AccommodationBookingDetailComponent } from './components/accommodation-booking-detail/accommodation-booking-detail.component';
import { PackageBookingDetailComponent } from './components/package-booking-detail/package-booking-detail.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BookingDetailPageRoutingModule,
    SharedModule,
  ],
  declarations: [
    BookingDetailPage,
    ActivityBookingDetailComponent,
    AccommodationBookingDetailComponent,
    PackageBookingDetailComponent,
  ],
})
export class BookingDetailPageModule {}
