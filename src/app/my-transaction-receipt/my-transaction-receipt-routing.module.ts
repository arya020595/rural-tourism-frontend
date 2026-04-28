import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MyTransactionReceiptPage } from './my-transaction-receipt.page';

const routes: Routes = [
  {
    path: '',
    component: MyTransactionReceiptPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MyTransactionReceiptPageRoutingModule {}
