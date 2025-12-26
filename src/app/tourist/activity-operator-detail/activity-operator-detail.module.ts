import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ActivityOperatorDetailPageRoutingModule } from './activity-operator-detail-routing.module';

import { ActivityOperatorDetailPage } from './activity-operator-detail.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ActivityOperatorDetailPageRoutingModule
  ],
  declarations: [ActivityOperatorDetailPage]
})
export class ActivityOperatorDetailPageModule {}
