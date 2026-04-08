import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EReceiptPage } from './e-receipt.page';

const routes: Routes = [
  {
    path: '',
    component: EReceiptPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EReceiptPageRoutingModule {}
