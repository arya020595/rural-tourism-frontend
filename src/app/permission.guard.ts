import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from './services/permission.service';

export const permissionGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const permissionService = inject(PermissionService);

  const routePermissions = route.data?.['permissions'];
  const requiredPermissions = Array.isArray(routePermissions)
    ? routePermissions
    : routePermissions
      ? [String(routePermissions)]
      : [];

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
