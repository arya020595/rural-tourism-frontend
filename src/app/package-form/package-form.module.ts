import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PackageFormPageRoutingModule } from './package-form-routing.module';

import { SharedModule } from '../_shared/shared.module';
import { PackageFormPage } from './package-form.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PackageFormPageRoutingModule,
    SharedModule, 
  ],
  declarations: [PackageFormPage]
})
export class PackageFormPageModule {}
