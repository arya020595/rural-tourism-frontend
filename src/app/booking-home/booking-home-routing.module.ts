import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BookingHomePage } from './booking-home.page';

const routes: Routes = [
  {
    path: '',
    component: BookingHomePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BookingHomePageRoutingModule {}

