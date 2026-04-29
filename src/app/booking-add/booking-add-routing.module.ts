import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BookingAddPage } from './booking-add.page';

const routes: Routes = [
  {
    path: '',
    component: BookingAddPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BookingAddPageRoutingModule {}
