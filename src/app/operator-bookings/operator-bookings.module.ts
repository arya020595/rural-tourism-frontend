import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OperatorBookingsPageRoutingModule } from './operator-bookings-routing.module';

import { OperatorBookingsPage } from './operator-bookings.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OperatorBookingsPageRoutingModule
  ],
  declarations: [OperatorBookingsPage]
})
export class OperatorBookingsPageModule {}
