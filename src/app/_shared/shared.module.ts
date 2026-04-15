import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { HeaderLogoComponent } from '../_components/header-logo/header-logo.component';
import { HasPermissionDirective } from './has-permission.directive';
import { SideNavComponent } from './side-nav/side-nav.component';

@NgModule({
  declarations: [HeaderLogoComponent, HasPermissionDirective, SideNavComponent],
  imports: [CommonModule, RouterModule, IonicModule],
  exports: [HeaderLogoComponent, HasPermissionDirective, SideNavComponent],
})
export class SharedModule {}
