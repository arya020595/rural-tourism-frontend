import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DeletionRequestsPage } from './deletion-requests.page';

const routes: Routes = [
  {
    path: '',
    component: DeletionRequestsPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DeletionRequestsPageRoutingModule {}
