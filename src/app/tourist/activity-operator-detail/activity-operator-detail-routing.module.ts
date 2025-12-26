import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ActivityOperatorDetailPage } from './activity-operator-detail.page';

const routes: Routes = [
  {
    path: '',
    component: ActivityOperatorDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ActivityOperatorDetailPageRoutingModule {}
