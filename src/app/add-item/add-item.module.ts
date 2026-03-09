import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddItemPageRoutingModule } from './add-item-routing.module';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'; //for swiper
import { SharedModule } from '../_shared/shared.module';
import { AddItemPage } from './add-item.page';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddItemPageRoutingModule,
    SharedModule, 
  ],
  declarations: [AddItemPage]
})
export class AddItemPageModule {}
