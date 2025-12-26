import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { DateModalComponent } from './date-modal.component';

@NgModule({
  declarations: [DateModalComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
  ],
  exports: [DateModalComponent]
})
export class DateModalModule {}
