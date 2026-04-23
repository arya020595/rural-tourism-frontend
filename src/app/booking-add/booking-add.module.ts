import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SharedModule } from '../_shared/shared.module';
import { BookingAddPageRoutingModule } from './booking-add-routing.module';
import { BookingAddPage } from './booking-add.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    BookingAddPageRoutingModule,
  ],
  declarations: [BookingAddPage],
})
export class BookingAddPageModule {}
