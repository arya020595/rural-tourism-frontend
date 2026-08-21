import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { from, Observable, throwError } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { LoadingService } from './loading.service';
import { NetworkService } from './network.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class HttpInterceptorService implements HttpInterceptor {
  private isRedirectingToLogin = false;

  constructor(
    private router: Router,
    private toastController: ToastController,
    private loadingService: LoadingService,
    private storageService: StorageService,
    private networkService: NetworkService,
    // Resolved lazily (not constructor-injected) to avoid a circular
    // dependency: AuthService itself depends on HttpClient, which this
    // interceptor wraps.
    private injector: Injector,
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
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
            switchMap(() => throwError(() => error)),
          );
        }

        return throwError(() => error);
      }),
      finalize(() => {
        if (showLoading) {
          this.loadingService.hide();
        }
      }),
    );
  }

  // Added request parameter to detect login requests
  private async handleError(
    error: HttpErrorResponse,
    request?: HttpRequest<any>,
  ): Promise<void> {
    let message = 'An unexpected error occurred';

    switch (error.status) {
      case 0:
        // User is already aware they're offline via the offline banner — skip toast
        if (!this.networkService.isOnline) return;
        message =
          'Unable to connect to server. Please check your internet connection.';
        break;
      case 400:
        message =
          error.error?.message || 'Bad request. Please check your input.';
        break;
      case 401: {
        const isLoginRequest = request?.url.includes('/auth/login');

        if (!isLoginRequest) {
          // If already redirecting, suppress duplicate toasts from in-flight requests
          if (this.isRedirectingToLogin) return;
          this.isRedirectingToLogin = true;

          message = 'Session expired. Please login again.';
          // Route through AuthService.logout() (resolved lazily via Injector
          // — see the constructor comment) rather than clearing storage
          // directly. AuthService also flips isAuthenticatedSubject to
          // false, which is what actually stops app.component.ts's 60s
          // notification-polling interval and SyncService's periodic sync.
          // Clearing storage alone left those running against a wiped
          // token, so every poll re-hit this same 401 handler and re-showed
          // this toast every ~60s even while sitting on the login page.
          //
          // isRedirectingToLogin must stay true until navigation actually
          // completes, not reset synchronously — several background
          // services (notification polling, offline sync) can have
          // requests already in flight when this fires; if the flag resets
          // immediately, their 401s slip through and re-trigger this whole
          // block again a moment later.
          const authService = this.injector.get(AuthService);
          // Empty redirectTo: this handler does its own navigation below so
          // it can reset isRedirectingToLogin only once that completes.
          authService.logout('');
          this.router.navigate(['/login']).then(() => {
            this.isRedirectingToLogin = false;
          });
        } else {
          return;
        }
        break;
      }

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
      case 413:
        // Upload-size errors are already surfaced by the calling page
        // (register/company-profile) with a more specific message.
        return;
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
