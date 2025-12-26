import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { TransactionPageRoutingModule } from './transaction-routing.module';

import { TransactionPage } from './transaction.page';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      { path: '', component: TransactionPage },
    ]),
    TransactionPageRoutingModule
  ],
  declarations: [TransactionPage],
})
export class TransactionPageModule {}
