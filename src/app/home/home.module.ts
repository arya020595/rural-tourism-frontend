import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NgApexchartsModule } from 'ng-apexcharts';
import { HomePage } from './home.page';

import { SharedModule } from '../_shared/shared.module';
import { HomePageRoutingModule } from './home-routing.module';
import { DashboardChartPanelComponent } from './dashboard/components/chart-panel/dashboard-chart-panel.component';
import { DashboardReceiptListTableComponent } from './dashboard/components/receipt-list-table/dashboard-receipt-list-table.component';
import { DashboardSummaryCardsComponent } from './dashboard/components/summary-cards/dashboard-summary-cards.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NgApexchartsModule,
    HomePageRoutingModule,
    SharedModule,
  ],
  declarations: [
    HomePage,
    DashboardSummaryCardsComponent,
    DashboardChartPanelComponent,
    DashboardReceiptListTableComponent,
  ],
})
export class HomePageModule {}
