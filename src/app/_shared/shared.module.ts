import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { HeaderLogoComponent } from '../_components/header-logo/header-logo.component';
import { NotificationBellComponent } from './notification-panel/notification-bell.component';
import { NotificationPanelComponent } from './notification-panel/notification-panel.component';
import { HasPermissionDirective } from './has-permission.directive';
import { PullRefreshDirective } from './refresh-button/pull-refresh.directive';
import { RefreshButtonComponent } from './refresh-button/refresh-button.component';
import { SideNavComponent } from './side-nav/side-nav.component';

@NgModule({
  declarations: [
    HeaderLogoComponent,
    HasPermissionDirective,
    SideNavComponent,
    NotificationPanelComponent,
    NotificationBellComponent,
    RefreshButtonComponent,
    PullRefreshDirective,
  ],
  imports: [CommonModule, RouterModule, IonicModule],
  exports: [
    HeaderLogoComponent,
    HasPermissionDirective,
    SideNavComponent,
    NotificationPanelComponent,
    NotificationBellComponent,
    RefreshButtonComponent,
    PullRefreshDirective,
  ],
})
export class SharedModule {}
