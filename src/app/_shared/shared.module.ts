import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { HeaderLogoComponent } from '../_components/header-logo/header-logo.component';
import { NotificationBellComponent } from './notification-panel/notification-bell.component';
import { NotificationPanelComponent } from './notification-panel/notification-panel.component';
import { HasPermissionDirective } from './has-permission.directive';
import { SideNavComponent } from './side-nav/side-nav.component';

@NgModule({
  declarations: [
    HeaderLogoComponent,
    HasPermissionDirective,
    SideNavComponent,
    NotificationPanelComponent,
    NotificationBellComponent,
  ],
  imports: [CommonModule, RouterModule, IonicModule],
  exports: [
    HeaderLogoComponent,
    HasPermissionDirective,
    SideNavComponent,
    NotificationPanelComponent,
    NotificationBellComponent,
  ],
})
export class SharedModule {}
