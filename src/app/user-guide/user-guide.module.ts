import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { UserGuidePageRoutingModule } from './user-guide-routing.module';
import { UserGuidePage } from './user-guide.page';

@NgModule({
  imports: [CommonModule, IonicModule, UserGuidePageRoutingModule],
  declarations: [UserGuidePage],
})
export class UserGuidePageModule {}
