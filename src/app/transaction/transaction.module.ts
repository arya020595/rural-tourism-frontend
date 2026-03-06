import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TransactionPageRoutingModule } from './transaction-routing.module';

import { SharedModule } from '../_shared/shared.module';
import { TransactionPage } from './transaction.page';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      { path: '', component: TransactionPage },
    ]),
    TransactionPageRoutingModule,
    SharedModule, 
  ],
  declarations: [TransactionPage],
})
export class TransactionPageModule {}
