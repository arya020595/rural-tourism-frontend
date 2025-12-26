import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode'; //QR code generator library
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CUSTOM_ELEMENTS_SCHEMA, isDevMode } from '@angular/core';
import { DateModalModule } from 'src/app/date-modal/date-modal.module';
//import { ServiceWorkerModule } from '@angular/service-worker'; //for swiper


@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [AppComponent],
  imports: [BrowserModule, 
            IonicModule.forRoot(),
            AppRoutingModule,
            HttpClientModule,
            FormsModule,
            QRCodeModule,
            SweetAlert2Module.forRoot(),
            BrowserModule, 
            DateModalModule,
            BrowserAnimationsModule,
            AppRoutingModule,
            IonicModule.forRoot({
              mode: 'ios'  // Set the mode globally to 'ios'
            }),
            
          ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
