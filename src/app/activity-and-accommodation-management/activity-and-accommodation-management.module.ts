import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ActivityAndAccommodationManagementPageRoutingModule } from './activity-and-accommodation-management-routing.module';

import { ActivityAndAccommodationManagementPage } from './activity-and-accommodation-management.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ActivityAndAccommodationManagementPageRoutingModule,
  ],
  declarations: [ActivityAndAccommodationManagementPage],
})
export class ActivityAndAccommodationManagementPageModule {}
