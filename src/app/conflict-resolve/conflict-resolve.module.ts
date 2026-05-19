import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ConflictResolvePageRoutingModule } from './conflict-resolve-routing.module';
import { ConflictResolvePage } from './conflict-resolve.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConflictResolvePageRoutingModule,
  ],
  declarations: [ConflictResolvePage],
})
export class ConflictResolvePageModule {}
