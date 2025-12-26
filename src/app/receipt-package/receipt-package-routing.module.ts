import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReceiptPackagePage } from './receipt-package.page';

const routes: Routes = [
  {
    path: '',
    component: ReceiptPackagePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReceiptPackagePageRoutingModule {}
