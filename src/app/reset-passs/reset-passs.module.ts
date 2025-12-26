import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ResetPasssPageRoutingModule } from './reset-passs-routing.module';

import { ResetPasssPage } from './reset-passs.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ResetPasssPageRoutingModule
  ],
  declarations: [ResetPasssPage]
})
export class ResetPasssPageModule {}
