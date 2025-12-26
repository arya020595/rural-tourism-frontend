import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { ConfirmBookingDetailsPage } from './confirm-booking-details.page';

const routes: Routes = [
  {
    path: '',
    component: ConfirmBookingDetailsPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [ConfirmBookingDetailsPage],
})
export class ConfirmBookingDetailsPageModule {}
