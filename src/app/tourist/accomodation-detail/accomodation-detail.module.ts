import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AccomodationDetailPageRoutingModule } from './accomodation-detail-routing.module';

import { AccomodationDetailPage } from './accomodation-detail.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AccomodationDetailPageRoutingModule
  ],
  declarations: [AccomodationDetailPage]
})
export class AccomodationDetailPageModule {}
