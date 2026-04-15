import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {

   // Inject the Router service into the functional guard
   const router = inject(Router);
   const authService = inject(AuthService);
  const loginRole = (route.data?.['loginRole'] as string) || 'operator';

   // Check centralized auth state (token + restored user session)
   if (authService.isAuthenticated) {
     return true;
   }

   return router.createUrlTree(['/login'], {
     queryParams: {
       role: loginRole,
       redirect: state.url,
     },
   });
  
};
