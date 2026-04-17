import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  constructor(private authService: AuthService) {}

  hasPermission(code: string): boolean {
    const user = this.authService.currentUser;
    if (!user) return false;

    const role = this.authService.getCurrentRole();
    if (role === 'admin') return true;

    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    return permissions.includes('*:*') || permissions.includes(code);
  }

  hasAnyPermission(codes: string[]): boolean {
    return codes.some((code) => this.hasPermission(code));
  }

  hasRole(roleName: string): boolean {
    return this.authService.getCurrentRole() === roleName;
  }
}
