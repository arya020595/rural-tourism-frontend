import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { HeaderLogoComponent } from '../_components/header-logo/header-logo.component';

@NgModule({
  declarations: [
    HeaderLogoComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [
    HeaderLogoComponent
  ]
})
export class SharedModule {}