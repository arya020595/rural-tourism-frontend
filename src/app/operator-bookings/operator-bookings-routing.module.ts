import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OperatorBookingsPage } from './operator-bookings.page';

const routes: Routes = [
  {
    path: '',
    component: OperatorBookingsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OperatorBookingsPageRoutingModule {}
