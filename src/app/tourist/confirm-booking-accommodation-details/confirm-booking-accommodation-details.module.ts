import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ConfirmBookingAccommodationDetailsPage } from './confirm-booking-accommodation-details.page';
import { ConfirmBookingAccommodationDetailsPageRoutingModule } from './confirm-booking-accommodation-details-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConfirmBookingAccommodationDetailsPageRoutingModule,
  ],
  declarations: [ConfirmBookingAccommodationDetailsPage],
})
export class ConfirmBookingAccommodationDetailsPageModule {}
