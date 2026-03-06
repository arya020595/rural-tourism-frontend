import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { QRCodeModule } from 'angularx-qrcode';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DateModalModule } from './date-modal/date-modal.module';
import { HttpInterceptorService } from './services/http-interceptor.service';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [AppComponent],
  imports: [
    // Core Angular modules (import only once)
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,

    // Ionic module with global configuration
    IonicModule.forRoot({
      mode: 'ios', // Set the mode globally to 'ios'
    }),

    // App routing
    AppRoutingModule,

    // Third-party modules
    QRCodeModule,
    SweetAlert2Module.forRoot(),
    DateModalModule,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
