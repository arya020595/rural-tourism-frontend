import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MenuItem } from '../../services/menu.service';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
})
export class SideNavComponent {
  @Input() menuId = 'main-menu';
  @Input() contentId = 'main-content';
  @Input() menuType: 'overlay' | 'push' | 'reveal' = 'overlay';
  @Input() menuSide: 'start' | 'end' = 'start';

  @Input() user: any = null;
  @Input() menuItems: MenuItem[] = [];
  @Input() badgeCounts: Record<string, number> = {};

  @Input() showHeaderLogo = true;
  @Input() logoSrc = 'assets/icon/rt logo.png';

  @Input() guestMode = false;
  @Input() guestTitle = 'Profile';
  @Input() guestMessageLines: string[] = [
    'Want to make a booking for your next trip?',
    'You need to log in or register your account first',
  ];
  @Input() guestLoginRoute = '/login';
  @Input() guestLoginLabel = 'Log In Account';
  @Input() guestRegisterRoute = '/tourist/register';
  @Input() guestRegisterLabel = 'Register Here';

  @Input() logoutLabel = 'Log Out';

  @Output() menuItemTap = new EventEmitter<MenuItem>();
  @Output() logoutTap = new EventEmitter<void>();

  get showGuestPanel(): boolean {
    return this.guestMode && !this.user;
  }

  get displayName(): string {
    return (
      this.user?.full_name ||
      this.user?.name ||
      this.user?.username ||
      'User'
    );
  }

  get displayEmail(): string {
    return (
      this.user?.email ||
      this.user?.user_email ||
      this.user?.email_address ||
      ''
    );
  }

  trackMenuItem(_index: number, item: MenuItem): string {
    return item.id;
  }

  onMenuItemTap(item: MenuItem): void {
    this.menuItemTap.emit(item);
  }

  onLogoutTap(): void {
    this.logoutTap.emit();
  }

  getBadgeCount(itemId: string): number {
    const count = this.badgeCounts[itemId];
    return typeof count === 'number' && count > 0 ? count : 0;
  }
}
