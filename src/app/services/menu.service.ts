import { Injectable } from '@angular/core';
import { AuthService, UserRoleName } from './auth.service';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  /**
   * Permission code(s) this item requires. The item is shown only when the
   * logged-in user's `roles_permissions` include at least one of them.
   * Items with no permission are always shown.
   */
  permission?: string | string[];
  action?: 'logout' | 'feature-unavailable';
  offlineCapable?: boolean;
  /**
   * Restrict this item to specific roles even when the permission matches.
   * Used where the same permission drives different routes per role
   * (e.g. bookings: operators vs tourists).
   */
  roles?: UserRoleName[];
}

export type MenuContext = UserRoleName;

/**
 * Menu items hidden from superadmin even though the `*:*` wildcard grants full
 * access to them. These are operator-operational modules that make no sense in
 * a platform superadmin's sidebar. Access is unaffected — superadmin can still
 * reach the routes/APIs directly; they're just kept off the menu.
 */
const SUPERADMIN_HIDDEN_MENU_IDS: readonly string[] = [
  'master-data',
  'booking-home',
  'my-transaction',
  'e-receipt',
];

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  /**
   * Single source of truth for every sidebar item. The visible menu for any
   * user is this list filtered by their `roles_permissions` (and optional
   * `roles` restriction). Add a menu item here + grant the permission in Role
   * Management and it appears — no per-role arrays to maintain.
   */
  private readonly menuItems: MenuItem[] = [
    {
      id: 'admin-dashboard',
      label: 'Papan Pemuka Admin / Admin Dashboard',
      icon: 'bar-chart-outline',
      route: '/admin/dashboard',
      roles: ['superadmin'],
    },
    {
      id: 'dashboard',
      label: 'My Dashboard / Dashboard Anda',
      icon: 'grid-outline',
      route: '/home',
      permission: 'dashboard:read',
      roles: ['operator_admin', 'operator_staff'],
    },
    {
      id: 'company-profile',
      label: 'My Profile / Profil Anda',
      icon: 'business-outline',
      route: '/company-profile',
      permission: 'profile:read',
      roles: ['operator_admin', 'operator_staff'],
    },
    {
      id: 'master-data',
      label: 'Master Data / Data Induk',
      icon: 'list-outline',
      route: '/master-data',
      permission: 'product:read',
      roles: ['operator_admin', 'operator_staff'],
    },
    {
      id: 'booking-home',
      label: 'Booking / Tempahan',
      icon: 'calendar-outline',
      route: '/booking-home',
      permission: 'booking:read',
      roles: ['operator_admin', 'operator_staff'],
      offlineCapable: true,
    },
    {
      id: 'my-transaction',
      label: 'My Transaction / Transaksi',
      icon: 'receipt-outline',
      route: '/my-transaction',
      permission: 'receipt:read',
      roles: ['operator_admin', 'operator_staff'],
    },
    {
      id: 'e-receipt',
      label: 'E-Receipt / E-Resit',
      icon: 'document-text-outline',
      route: '/e-receipt',
      permission: 'receipt:create',
      roles: ['operator_admin', 'operator_staff'],
      offlineCapable: true,
    },
    {
      id: 'users',
      label: 'User Management / Pengurusan Pengguna',
      icon: 'people-outline',
      route: '/users',
      permission: 'user:read',
      roles: ['superadmin', 'operator_admin'],
    },
    {
      id: 'role-management',
      label: 'Pengurusan Peranan / Role Management',
      icon: 'shield-outline',
      route: '/role-management',
      permission: 'role:read',
    },
    // ── Tourist ──────────────────────────────────────────────────────────
    {
      id: 'tourist-bookings',
      label: 'List of Bookings / Senarai Tempahan',
      icon: 'clipboard',
      route: '/tourist/tourist-bookings',
      permission: 'booking:read',
      roles: ['tourist'],
    },
    {
      id: 'tourist-transaction',
      label: 'Transaction History / Sejarah Transaksi',
      icon: 'clipboard',
      route: '/tourist/transaction',
      permission: 'receipt:read',
      roles: ['tourist'],
    },
    {
      id: 'tourist-messages',
      label: 'Messages / Mesej',
      icon: 'chatbubbles',
      action: 'feature-unavailable',
      roles: ['tourist'],
    },
    // ── Association ──────────────────────────────────────────────────────
    {
      id: 'association-dashboard',
      label: 'BI Dashboard / Papan Pemuka BI',
      icon: 'bar-chart-outline',
      route: '/association/dashboard',
      permission: 'bi_dashboard:read',
      roles: ['association'],
    },
    {
      id: 'association-account-settings',
      label: 'Tetapan Akaun / Account Settings',
      icon: 'settings-outline',
      route: '/association/change-password',
      roles: ['association'],
    },
  ];

  constructor(private authService: AuthService) {}

  /**
   * The sidebar for the current user: every menu item whose permission the
   * user holds (via `roles_permissions`) and whose optional `roles`
   * restriction includes the user's role.
   */
  getVisibleMenuItemsForCurrentUser(): MenuItem[] {
    const role = this.authService.getCurrentRole();
    const grantedCodes = this.getGrantedPermissionCodes();

    return this.menuItems
      .filter((item) => this.isVisible(item, role, grantedCodes))
      .map((item) => ({
        ...item,
        permission: Array.isArray(item.permission)
          ? [...item.permission]
          : item.permission,
      }));
  }

  private isVisible(
    item: MenuItem,
    role: UserRoleName | null,
    grantedCodes: string[]
  ): boolean {
    // superadmin / wildcard holders have full access, so the permission gate
    // doesn't apply to them — but the item's `roles` restriction still does
    // (tourist/association items stay off the superadmin sidebar), and the
    // explicitly-hidden operator modules are excluded.
    if (this.hasWildcard()) {
      if (SUPERADMIN_HIDDEN_MENU_IDS.includes(item.id)) return false;
      return this.matchesRole(item, 'superadmin');
    }

    return this.matchesRole(item, role) && this.matchesPermission(item, grantedCodes);
  }

  private hasWildcard(): boolean {
    const codes = this.authService.currentUser?.permissions;
    return (
      this.authService.getCurrentRole() === 'superadmin' ||
      (Array.isArray(codes) && codes.includes('*:*'))
    );
  }

  private matchesRole(item: MenuItem, role: UserRoleName | null): boolean {
    if (!item.roles) return true;
    if (!role) return false;
    return item.roles.includes(role);
  }

  private matchesPermission(item: MenuItem, grantedCodes: string[]): boolean {
    if (!item.permission) return true;

    const required = Array.isArray(item.permission)
      ? item.permission
      : [item.permission];

    return required.some((code) => grantedCodes.includes(code));
  }

  /**
   * The granular permission codes that gate the menu for a normal user, taken
   * straight from their `roles_permissions`. superadmin / wildcard holders are
   * handled separately in `isVisible` and never reach this path.
   */
  private getGrantedPermissionCodes(): string[] {
    const codes = this.authService.currentUser?.permissions;
    return Array.isArray(codes) ? codes : [];
  }
}
