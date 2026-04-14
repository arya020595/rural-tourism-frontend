import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { CalendarModule } from 'ion7-calendar';

import { HomePageRoutingModule } from './home-routing.module';
import { SharedModule } from '../../_shared/shared.module';

import { HomePage } from './home.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    CalendarModule,
    SharedModule,
  ],
  declarations: [HomePage],
})
export class HomePageModule {}
