import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConfirmBookingDetailsPage } from './confirm-booking-details.page';

const routes: Routes = [
  {
    path: '',
    component: ConfirmBookingDetailsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConfirmBookingDetailsPageRoutingModule {}
