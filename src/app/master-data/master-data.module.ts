import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { SharedModule } from '../_shared/shared.module';
import { MasterDataPageRoutingModule } from './master-data-routing.module';
import { MasterDataPage } from './master-data.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MasterDataPageRoutingModule,
    SharedModule,
  ],
  declarations: [MasterDataPage],
})
export class MasterDataPageModule {}
