import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ActivityOperatorListPageRoutingModule } from './activity-operator-list-routing.module';

import { ActivityOperatorListPage } from './activity-operator-list.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ActivityOperatorListPageRoutingModule
  ],
  declarations: [ActivityOperatorListPage]
})
export class ActivityOperatorListPageModule {}
