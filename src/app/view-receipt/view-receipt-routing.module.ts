import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ViewReceiptPage } from './view-receipt.page';

const routes: Routes = [
  {
    path: '',
    component: ViewReceiptPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ViewReceiptPageRoutingModule {}
