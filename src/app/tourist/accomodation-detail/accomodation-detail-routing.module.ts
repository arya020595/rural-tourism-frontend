import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AccomodationDetailPage } from './accomodation-detail.page';

const routes: Routes = [
  {
    path: '',
    component: AccomodationDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccomodationDetailPageRoutingModule {}
