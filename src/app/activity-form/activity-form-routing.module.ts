import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ActivityFormPage } from './activity-form.page';

const routes: Routes = [
  {
    path: '',
    component: ActivityFormPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ActivityFormPageRoutingModule {}
