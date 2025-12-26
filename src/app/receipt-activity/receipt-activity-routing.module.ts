import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReceiptActivityPage } from './receipt-activity.page';

const routes: Routes = [
  {
    path: '',
    component: ReceiptActivityPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReceiptActivityPageRoutingModule {}
