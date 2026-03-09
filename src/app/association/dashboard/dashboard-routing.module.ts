import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssociationDashboardPage } from './dashboard.page';

const routes: Routes = [
  {
    path: '',
    component: AssociationDashboardPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardPageRoutingModule {}
