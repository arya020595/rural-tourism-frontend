import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ImageCropperComponent } from 'ngx-image-cropper';
import { SharedModule } from '../_shared/shared.module';
import { CompanyProfilePageRoutingModule } from './company-profile-routing.module';
import { CompanyProfilePage } from './company-profile.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ImageCropperComponent,
    CompanyProfilePageRoutingModule,
    SharedModule,
  ],
  declarations: [CompanyProfilePage],
})
export class CompanyProfilePageModule {}
