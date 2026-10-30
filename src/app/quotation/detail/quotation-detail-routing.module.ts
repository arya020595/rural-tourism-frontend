import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { QuotationDetailPage } from './quotation-detail.page';

const routes: Routes = [
  {
    path: '',
    component: QuotationDetailPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuotationDetailPageRoutingModule {}
