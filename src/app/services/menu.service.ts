import { Injectable } from '@angular/core';
import { PermissionService } from './permission.service';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  permission?: string | string[];
  action?: 'logout' | 'feature-unavailable';
}

export type MenuContext = 'admin' | 'operator' | 'tourist' | 'association';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private readonly menuItemsByContext: Record<MenuContext, MenuItem[]> = {
    admin: [],
    operator: [
      {
        id: 'company-profile',
        label: 'Profil Syarikat/Company Profile',
        icon: 'business-outline',
        route: '/company-profile',
        permission: 'profile:read',
      },
    ],
    tourist: [
      {
        id: 'tourist-bookings',
        label: 'List of Bookings',
        icon: 'clipboard',
        route: '/tourist/tourist-bookings',
        permission: 'booking:read',
      },
      {
        id: 'tourist-transaction',
        label: 'Transaction History',
        icon: 'clipboard',
        route: '/tourist/transaction',
        permission: 'receipt:read',
      },
      {
        id: 'tourist-messages',
        label: 'Messages',
        icon: 'chatbubbles',
        action: 'feature-unavailable',
      },
    ],
    association: [
      {
        id: 'association-dashboard',
        label: 'Dashboard',
        icon: 'analytics',
        route: '/association/dashboard',
        permission: 'association:read',
      },
    ],
  };

  constructor(private permissionService: PermissionService) {}

  getMenuItemsForContext(context: MenuContext): MenuItem[] {
    const items = this.menuItemsByContext[context] || [];

    return items.map((item) => ({
      ...item,
      permission: Array.isArray(item.permission)
        ? [...item.permission]
        : item.permission,
    }));
  }

  getVisibleMenuItems(items: MenuItem[]): MenuItem[] {
    return items.filter((item) => {
      if (!item.permission) return true;

      const requiredPermissions = Array.isArray(item.permission)
        ? item.permission
        : [item.permission];

      return this.permissionService.hasAnyPermission(requiredPermissions);
    });
  }

  getVisibleMenuItemsForContext(context: MenuContext): MenuItem[] {
    return this.getVisibleMenuItems(this.getMenuItemsForContext(context));
  }
}
