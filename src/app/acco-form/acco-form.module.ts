import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AccoFormPageRoutingModule } from './acco-form-routing.module';

import { AccoFormPage } from './acco-form.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AccoFormPageRoutingModule
  ],
  declarations: [AccoFormPage]
})
export class AccoFormPageModule {}
