import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TouristTransactionPage } from './tourist-transaction.page';

const routes: Routes = [
  {
    path: '',
    component: TouristTransactionPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TouristTransactionPageRoutingModule {}
