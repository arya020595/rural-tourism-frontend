import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { PermissionService } from './services/permission.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const permissionService = inject(PermissionService);

  const routePermissions = route.data?.['permissions'];
  const requiredPermissions = Array.isArray(routePermissions)
    ? routePermissions
    : routePermissions
      ? [String(routePermissions)]
      : [];

  const loginRole = (route.data?.['loginRole'] as string) || 'operator';

  if (!authService.isAuthenticated) {
    return router.createUrlTree(['/login'], {
      queryParams: {
        role: loginRole,
        redirect: state.url,
      },
    });
  }

  if (!requiredPermissions.length) {
    return true;
  }

  if (permissionService.hasAnyPermission(requiredPermissions)) {
    return true;
  }

  return router.createUrlTree(['/unauthorized'], {
    queryParams: {
      required: requiredPermissions.join(','),
    },
  });
};
