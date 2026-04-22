import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../_shared/shared.module';
import { UserDeleteModalComponent } from './components/user-delete-modal.component';
import { UserFormModalComponent } from './components/user-form-modal.component';
import { UserViewModalComponent } from './components/user-view-modal.component';
import { UsersPageRoutingModule } from './users-routing.module';
import { UsersPage } from './users.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UsersPageRoutingModule,
    SharedModule,
  ],
  declarations: [
    UsersPage,
    UserFormModalComponent,
    UserViewModalComponent,
    UserDeleteModalComponent,
  ],
})
export class UsersPageModule {}
