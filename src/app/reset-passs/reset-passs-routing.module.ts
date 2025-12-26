import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ResetPasssPage } from './reset-passs.page';

const routes: Routes = [
  {
    path: '',
    component: ResetPasssPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ResetPasssPageRoutingModule {}
