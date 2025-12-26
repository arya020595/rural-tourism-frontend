import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AccommodationBookingPage } from './accommodation-booking.page';

const routes: Routes = [
  {
    path: '',
    component: AccommodationBookingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccommodationBookingPageRoutingModule {}
