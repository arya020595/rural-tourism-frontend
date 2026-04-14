import { NgModule } from '@angular/core';
import { ConfirmBookingAccommodationDetailsPage } from './confirm-booking-accommodation-details.page';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: ConfirmBookingAccommodationDetailsPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConfirmBookingAccommodationDetailsPageRoutingModule {}
