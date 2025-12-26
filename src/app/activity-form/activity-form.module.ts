import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ActivityFormPageRoutingModule } from './activity-form-routing.module';

import { ActivityFormPage } from './activity-form.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ActivityFormPageRoutingModule
  ],
  declarations: [ActivityFormPage]
})
export class ActivityFormPageModule {}
