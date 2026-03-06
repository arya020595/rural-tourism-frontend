import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ActivityFormPageRoutingModule } from './activity-form-routing.module';

import { SharedModule } from '../_shared/shared.module';
import { ActivityFormPage } from './activity-form.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ActivityFormPageRoutingModule,
    SharedModule 
  ],
  declarations: [ActivityFormPage]
})
export class ActivityFormPageModule {}
