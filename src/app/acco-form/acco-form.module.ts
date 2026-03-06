import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AccoFormPageRoutingModule } from './acco-form-routing.module';

import { SharedModule } from '../_shared/shared.module';
import { AccoFormPage } from './acco-form.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AccoFormPageRoutingModule,
    SharedModule, 
  ],
  declarations: [AccoFormPage]
})
export class AccoFormPageModule {}
