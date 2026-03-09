import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SharedModule } from '../_shared/shared.module';
import { OperatorDashboardPageRoutingModule } from './operator-dashboard-routing.module';
import { OperatorDashboardPage } from './operator-dashboard.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    OperatorDashboardPageRoutingModule,
  ],
  declarations: [OperatorDashboardPage],
})
export class OperatorDashboardPageModule {}
