import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ActivityOperatorListPage } from './activity-operator-list.page';

const routes: Routes = [
  {
    path: '',
    component: ActivityOperatorListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ActivityOperatorListPageRoutingModule {}
