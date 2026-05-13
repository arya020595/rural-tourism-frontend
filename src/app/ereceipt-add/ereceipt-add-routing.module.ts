import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { EreceiptAddPage } from './ereceipt-add.page';

const routes: Routes = [
  {
    path: '',
    component: EreceiptAddPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EreceiptAddPageRoutingModule {}
