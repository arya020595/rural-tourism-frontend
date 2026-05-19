import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ConflictResolvePage } from './conflict-resolve.page';

const routes: Routes = [
  {
    path: '',
    component: ConflictResolvePage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConflictResolvePageRoutingModule {}
