import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRoleName } from './services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const requiredRoles = (route.data?.['roles'] as UserRoleName[] | undefined) || [];
  const preferredLoginRole =
    (route.data?.['loginRole'] as UserRoleName | undefined) ||
    requiredRoles[0] ||
    'operator';

  if (!authService.isAuthenticated) {
    router.navigate(['/login'], {
      queryParams: {
        role: preferredLoginRole,
        redirect: state.url,
      },
    });
    return false;
  }

  if (!requiredRoles.length) {
    return true;
  }

  const currentRole = authService.getCurrentRole();

  if (currentRole === 'admin') {
    return true;
  }

  if (currentRole && requiredRoles.includes(currentRole)) {
    return true;
  }

  router.navigate(['/unauthorized'], {
    queryParams: {
      requiredRoles: requiredRoles.join(','),
    },
  });
  return false;
};
