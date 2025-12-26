import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ConfirmBookingAccommodationDetailsPage } from './confirm-booking-accommodation-details.page';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: ConfirmBookingAccommodationDetailsPage,
  },
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [ConfirmBookingAccommodationDetailsPage],
})
export class ConfirmBookingAccommodationDetailsPageModule {}
