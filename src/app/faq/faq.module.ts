import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FAQPageRoutingModule } from './faq-routing.module';

import { SharedModule } from '../_shared/shared.module';
import { FAQPage } from './faq.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FAQPageRoutingModule,
    SharedModule,
  ],
  declarations: [FAQPage]
})
export class FAQPageModule {}
