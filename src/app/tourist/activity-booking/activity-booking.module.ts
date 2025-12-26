import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // ✅ import here
import { IonicModule } from '@ionic/angular';
import { ActivityBookingPageRoutingModule } from './activity-booking-routing.module';
import { ActivityBookingPage } from './activity-booking.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule, // ✅ must be here
    IonicModule,
    ActivityBookingPageRoutingModule
  ],
  declarations: [ActivityBookingPage]
})
export class ActivityBookingPageModule {}
