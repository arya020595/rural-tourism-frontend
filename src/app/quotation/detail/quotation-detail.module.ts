import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { SharedModule } from '../../_shared/shared.module';
import { QuotationDetailPageRoutingModule } from './quotation-detail-routing.module';
import { QuotationDetailPage } from './quotation-detail.page';

@NgModule({
  imports: [CommonModule, IonicModule, SharedModule, QuotationDetailPageRoutingModule],
  declarations: [QuotationDetailPage],
})
export class QuotationDetailPageModule {}
