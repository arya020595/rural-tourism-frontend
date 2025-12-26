import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AccoFormPage } from './acco-form.page';

const routes: Routes = [
  {
    path: '',
    component: AccoFormPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccoFormPageRoutingModule {}
