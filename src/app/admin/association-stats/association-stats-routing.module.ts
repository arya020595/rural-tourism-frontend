import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssociationStatsPage } from './association-stats.page';

const routes: Routes = [
  {
    path: '',
    component: AssociationStatsPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AssociationStatsPageRoutingModule {}
