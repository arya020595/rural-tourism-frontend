import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TouristBookingsPage } from './tourist-bookings.page';

const routes: Routes = [
  {
    path: '',
    component: TouristBookingsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TouristBookingsPageRoutingModule {}
