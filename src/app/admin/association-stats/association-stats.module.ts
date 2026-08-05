import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AssociationStatsPageRoutingModule } from './association-stats-routing.module';
import { AssociationStatsPage } from './association-stats.page';
import { SharedModule } from '../../_shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AssociationStatsPageRoutingModule,
    SharedModule,
  ],
  declarations: [AssociationStatsPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AssociationStatsPageModule {}
