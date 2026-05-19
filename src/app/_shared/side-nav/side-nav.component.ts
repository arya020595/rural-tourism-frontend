import { ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MenuItem } from '../../services/menu.service';
import { NetworkService } from '../../services/network.service';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
})
export class SideNavComponent implements OnInit, OnDestroy {
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

  isOnline = true;
  private networkSub: Subscription | null = null;

  constructor(
    private networkService: NetworkService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.isOnline = this.networkService.isOnline;
    this.networkSub = this.networkService.isOnline$.subscribe((online) => {
      this.zone.run(() => {
        this.isOnline = online;
        this.cdr.detectChanges();
      });
    });
  }

  ngOnDestroy(): void {
    this.networkSub?.unsubscribe();
  }


  get showGuestPanel(): boolean {
    return this.guestMode && !this.user;
  }

  get displayName(): string {
    return (
      this.user?.full_name || this.user?.name || this.user?.username || 'User'
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

  isActiveItem(item: MenuItem): boolean {
    if (!item.route) {
      return false;
    }

    const currentUrl = this.router.url.split('?')[0];
    const target = item.route;

    if (target === '/home') {
      return currentUrl === '/home';
    }

    return currentUrl === target || currentUrl.startsWith(`${target}/`);
  }
}
