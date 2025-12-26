import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PackageFormPage } from './package-form.page';

const routes: Routes = [
  {
    path: '',
    component: PackageFormPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PackageFormPageRoutingModule {}
