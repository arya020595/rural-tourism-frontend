import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AssociationStatisticsPage } from './association-statistics.page';

const routes: Routes = [
  {
    path: '',
    component: AssociationStatisticsPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AssociationStatisticsPageRoutingModule {}
