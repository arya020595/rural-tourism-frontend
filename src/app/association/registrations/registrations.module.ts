import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { SharedModule } from '../../_shared/shared.module';
import { RegistrationsPageRoutingModule } from './registrations-routing.module';
import { RegistrationsPage } from './registrations.page';

@NgModule({
  imports: [CommonModule, IonicModule, SharedModule, RegistrationsPageRoutingModule],
  declarations: [RegistrationsPage],
})
export class RegistrationsPageModule {}
