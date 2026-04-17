import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { DashboardPageRoutingModule } from './dashboard-routing.module';
import { AssociationDashboardPage } from './dashboard.page';
import { SharedModule } from '../../_shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardPageRoutingModule,
    SharedModule,
  ],
  declarations: [AssociationDashboardPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // This allows Ionic components like ion-row, ion-card-title
})
export class DashboardPageModule {}
