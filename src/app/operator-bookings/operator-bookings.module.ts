import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OperatorBookingsPageRoutingModule } from './operator-bookings-routing.module';

import { SharedModule } from '../_shared/shared.module';
import { OperatorBookingsPage } from './operator-bookings.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OperatorBookingsPageRoutingModule,
    SharedModule,
  ],
  declarations: [OperatorBookingsPage]
})
export class OperatorBookingsPageModule {}
