import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BookingHomePageRoutingModule } from './booking-home-routing.module';

import { BookingHomePage } from './booking-home.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BookingHomePageRoutingModule
  ],
  declarations: [BookingHomePage]
})
export class BookingHomePageModule {}
