import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ActivityAndAccommodationManagementPageRoutingModule } from './activity-and-accommodation-management-routing.module';
import { SharedModule } from '../_shared/shared.module';

import { ActivityAndAccommodationManagementPage } from './activity-and-accommodation-management.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ActivityAndAccommodationManagementPageRoutingModule,
    SharedModule,
  ],
  declarations: [ActivityAndAccommodationManagementPage],
})
export class ActivityAndAccommodationManagementPageModule {}
