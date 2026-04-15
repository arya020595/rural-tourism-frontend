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
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'home-outline',
        route: '/home',
      },
      {
        id: 'add-item',
        label:
          'Tambah Aktiviti & Tempat Penginapan/Add New Activity & Accommodation',
        icon: 'add-circle',
        route: '/add-item',
        permission: ['activity:create', 'accommodation:create'],
      },
      {
        id: 'operator-bookings',
        label:
          'Aktiviti & Penginapan Ditempah / Booked Activity & Accommodation',
        icon: 'calendar',
        route: '/operator-bookings',
        permission: 'booking:read',
      },
      {
        id: 'activity-and-accommodation-management',
        label:
          'Accommodation & Activity Management/Pengurusan Penginapan & Aktiviti',
        icon: 'calendar',
        route: '/activity-and-accommodation-management',
        permission: ['activity:read', 'accommodation:read'],
      },
      {
        id: 'transaction',
        label: 'Transaksi/Transaction History',
        icon: 'clipboard',
        route: '/transaction',
        permission: 'receipt:read',
      },
      {
        id: 'e-receipt',
        label: 'E-Receipt',
        icon: 'receipt-outline',
        route: '/e-receipt',
        permission: 'receipt:read',
      },
      {
        id: 'faq',
        label: 'Soalan Lazim/Frequently Asked Questions (FAQ)',
        icon: 'help-outline',
        route: '/faq',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: 'notifications-outline',
        route: '/notifications',
        permission: 'booking:read',
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
