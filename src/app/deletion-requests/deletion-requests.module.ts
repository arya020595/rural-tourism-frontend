import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../_shared/shared.module';
import { DeletionRequestsPageRoutingModule } from './deletion-requests-routing.module';
import { DeletionRequestsPage } from './deletion-requests.page';

// Note: UserViewModalComponent / UserDeleteModalComponent (declared in
// UsersPageModule) are reused here via ModalController.create({ component }),
// which instantiates them dynamically — no NgModule declaration needed on
// this side, and declaring them here too would be an Angular duplicate-
// declaration error.
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DeletionRequestsPageRoutingModule,
    SharedModule,
  ],
  declarations: [DeletionRequestsPage],
})
export class DeletionRequestsPageModule {}
