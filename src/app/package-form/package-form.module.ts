import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PackageFormPageRoutingModule } from './package-form-routing.module';

import { PackageFormPage } from './package-form.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PackageFormPageRoutingModule
  ],
  declarations: [PackageFormPage]
})
export class PackageFormPageModule {}
