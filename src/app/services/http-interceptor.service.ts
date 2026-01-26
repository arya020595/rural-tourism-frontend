import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Observable, throwError, from } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { LoadingService } from './loading.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class HttpInterceptorService implements HttpInterceptor {
  constructor(
    private router: Router,
    private toastController: ToastController,
    private loadingService: LoadingService,
    private storageService: StorageService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Show loading for non-GET requests or specific endpoints
    const showLoading = request.method !== 'GET';
    if (showLoading) {
      this.loadingService.show();
    }

    // Add auth token if available
    const token = this.storageService.getToken();
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Skip showing toast for user fetch 404 errors (handled by fallback in home page)
        const isUserFetch404 =
          error.status === 404 &&
          request.url.includes('/api/users/') &&
          request.method === 'GET';

        if (!isUserFetch404) {
          // Convert async handleError to Observable to satisfy TypeScript
          return from(this.handleError(error, request)).pipe(
            switchMap(() => throwError(() => error))
          );
        }

        return throwError(() => error);
      }),
      finalize(() => {
        if (showLoading) {
          this.loadingService.hide();
        }
      })
    );
  }

  // Added request parameter to detect login requests
  private async handleError(
    error: HttpErrorResponse,
    request?: HttpRequest<any>
  ): Promise<void> {
    let message = 'An unexpected error occurred';

    switch (error.status) {
      case 0:
        message =
          'Unable to connect to server. Please check your internet connection.';
        break;
      case 400:
        message =
          error.error?.message || 'Bad request. Please check your input.';
        break;
        case 401:
            // List all login URLs
            const loginUrls = ['/login', '/tourist/login'];

            // Check if current request is a login request
            const isLoginRequest = loginUrls.some(url => request?.url.endsWith(url));

            if (!isLoginRequest) {
              // For protected APIs, clear auth and redirect
              message = 'Session expired. Please login again.';
              this.storageService.clearAuth();
              this.router.navigate(['/role']);
            } else {
              // For login attempts with wrong credentials, just show toast
              return;
            }
            break;

      case 403:
        message = 'You do not have permission to perform this action.';
        break;
      case 404:
        message = error.error?.message || 'Resource not found.';
        break;
      case 422:
        message =
          error.error?.message || 'Validation error. Please check your input.';
        break;
      case 500:
        message = 'Server error. Please try again later.';
        break;
      default:
        message = error.error?.message || `Error: ${error.status}`;
    }

    await this.showErrorToast(message);
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      cssClass: 'error-toast',
      icon: 'alert-circle',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel',
        },
      ],
    });
    await toast.present();
  }
}
