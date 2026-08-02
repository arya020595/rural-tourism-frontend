import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssociationChangePasswordPage } from './change-password.page';

const routes: Routes = [
  {
    path: '',
    component: AssociationChangePasswordPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AssociationChangePasswordPageRoutingModule {}
