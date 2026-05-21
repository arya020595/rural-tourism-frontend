import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../_shared/shared.module';
import { RoleDeleteModalComponent } from './components/role-delete-modal.component';
import { RoleFormModalComponent } from './components/role-form-modal.component';
import { RoleViewModalComponent } from './components/role-view-modal.component';
import { RoleManagementPageRoutingModule } from './role-management-routing.module';
import { RoleManagementPage } from './role-management.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RoleManagementPageRoutingModule,
    SharedModule,
  ],
  declarations: [
    RoleManagementPage,
    RoleFormModalComponent,
    RoleViewModalComponent,
    RoleDeleteModalComponent,
  ],
})
export class RoleManagementPageModule {}
