import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AssociationChangePasswordPageRoutingModule } from './change-password-routing.module';
import { AssociationChangePasswordPage } from './change-password.page';
import { SharedModule } from '../../_shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AssociationChangePasswordPageRoutingModule,
    SharedModule,
  ],
  declarations: [AssociationChangePasswordPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AssociationChangePasswordPageModule {}
