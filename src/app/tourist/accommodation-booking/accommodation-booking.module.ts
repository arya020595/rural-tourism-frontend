import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // <-- add ReactiveFormsModule
import { IonicModule } from '@ionic/angular';

import { AccommodationBookingPageRoutingModule } from './accommodation-booking-routing.module';
import { AccommodationBookingPage } from './accommodation-booking.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AccommodationBookingPageRoutingModule
  ],
  declarations: [AccommodationBookingPage]
})
export class AccommodationBookingPageModule {}
