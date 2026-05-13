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

export type MenuContext =
  | 'superadmin'
  | 'operator_admin'
  | 'operator_staff'
  | 'tourist'
  | 'association';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private readonly menuItemsByContext: Record<MenuContext, MenuItem[]> = {
    superadmin: [
      {
        id: 'master-data',
        label: 'Data Induk/Master Data',
        icon: 'list-outline',
        route: '/master-data',
        permission: 'product:read',
      },
    ],
    operator_admin: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'speedometer-outline',
        route: '/home',
        permission: 'booking:read',
      },
      {
        id: 'company-profile',
        label: 'Profil Syarikat/Company Profile',
        icon: 'business-outline',
        route: '/company-profile',
        permission: 'profile:read',
      },
      {
        id: 'master-data',
        label: 'Data Induk/Master Data',
        icon: 'list-outline',
        route: '/master-data',
        permission: 'product:read',
      },
      {
        id: 'booking-home',
        label: 'Booking/Tempahan',
        icon: 'calendar-outline',
        route: '/booking-home',
      },
      {
        id: 'my-transaction',
        label: 'My Transaksi / Transaksi',
        icon: 'receipt-outline',
        route: '/my-transaction',
      },
      {
        id: 'e-receipt',
        label: 'E-Receipt',
        icon: 'document-text-outline',
        route: '/e-receipt',
        permission: 'receipt:create',
      },
      {
        id: 'users',
        label: 'Users / Pengguna',
        icon: 'people-outline',
        route: '/users',
        permission: 'user:read',
      },
    ],
    operator_staff: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'speedometer-outline',
        route: '/home',
        permission: 'booking:read',
      },
      {
        id: 'company-profile',
        label: 'Profil Syarikat/Company Profile',
        icon: 'business-outline',
        route: '/company-profile',
        permission: 'profile:read',
      },
      {
        id: 'booking-home',
        label: 'Booking/Tempahan',
        icon: 'calendar-outline',
        route: '/booking-home',
      },
      {
        id: 'my-transaction',
        label: 'My Transaksi / Transaksi',
        icon: 'receipt-outline',
        route: '/my-transaction',
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
        label: 'BI Dashboard',
        icon: 'bar-chart-outline',
        route: '/association/dashboard',
        permission: 'bi_dashboard:read',
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
