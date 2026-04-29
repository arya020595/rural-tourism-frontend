import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BookingHomePageRoutingModule } from './booking-home-routing.module';
import { SharedModule } from '../_shared/shared.module';

import { BookingHomePage } from './booking-home.page';
import { BookingListTableComponent } from './components/booking-list-table.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BookingHomePageRoutingModule,
    SharedModule,
  ],
  declarations: [BookingHomePage, BookingListTableComponent],
})
export class BookingHomePageModule {}
