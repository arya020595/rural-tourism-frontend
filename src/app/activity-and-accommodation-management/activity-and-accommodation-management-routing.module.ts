import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ActivityAndAccommodationManagementPage } from './activity-and-accommodation-management.page';

const routes: Routes = [
  {
    path: '',
    component: ActivityAndAccommodationManagementPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ActivityAndAccommodationManagementPageRoutingModule {}
