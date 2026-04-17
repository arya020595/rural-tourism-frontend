import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const loginRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (!authService.isAuthenticated) {
    return true;
  }

  const currentRole = authService.getCurrentRole();

  if (currentRole === 'tourist') {
    return router.createUrlTree(['/tourist/home']);
  }

  if (currentRole === 'association') {
    return router.createUrlTree(['/association/dashboard']);
  }

  return router.createUrlTree(['/company-profile']);
};
