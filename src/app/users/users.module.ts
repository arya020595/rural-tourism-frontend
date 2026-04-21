import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../_shared/shared.module';
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
  declarations: [UsersPage],
})
export class UsersPageModule {}
