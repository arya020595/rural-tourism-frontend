import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { BookingService } from '../services/booking.service';
import { MenuItem, MenuService } from '../services/menu.service';
import { NetworkService } from '../services/network.service';

@Component({
  selector: 'app-e-receipt',
  templateUrl: './e-receipt.page.html',
  styleUrls: ['./e-receipt.page.scss'],
})
export class EReceiptPage implements OnInit, OnDestroy {
  uid: string | null = null;
  user: any = null;
  menuItems: MenuItem[] = [];
  pendingBookingsCount: number = 0;
  isOffline = false;

  private networkSub?: Subscription;

  activityBgSrc = '';
  accomBgSrc = '';
  packageBgSrc = '';
  treeIconSrc = 'assets/icon/tree.png';
  houseIconSrc = 'assets/icon/house.png';
  packageIconSrc = 'assets/icon/pakej-removebg-preview.png';

  constructor(
    private bookingService: BookingService,
    private menuCtrl: MenuController,
    private router: Router,
    private toastController: ToastController,
    private networkService: NetworkService,
    private menuService: MenuService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadUserData();

    this.isOffline = !this.networkService.isOnline;
    this.networkSub = this.networkService.isOnline$
      .pipe(distinctUntilChanged())
      .subscribe((online) => {
        this.isOffline = !online;
      });

    void this.loadBgImages();
  }

  ngOnDestroy(): void {
    this.networkSub?.unsubscribe();
  }

  private async loadBgImages(): Promise<void> {
    const assets = [
      { key: 'activityBgSrc' as const, path: 'assets/mountain.jpg' },
      { key: 'accomBgSrc' as const, path: 'assets/accom.jpg' },
      { key: 'packageBgSrc' as const, path: 'assets/package.jpg' },
      { key: 'treeIconSrc' as const, path: 'assets/icon/tree.png' },
      { key: 'houseIconSrc' as const, path: 'assets/icon/house.png' },
      { key: 'packageIconSrc' as const, path: 'assets/icon/pakej-removebg-preview.png' },
    ];

    let cache: Cache | null = null;
    try {
      cache = await caches.open('prewarm-assets-v1');
    } catch {
      // Cache API unavailable
    }

    for (const asset of assets) {
      try {
        const cached = cache ? await cache.match(asset.path) : null;
        if (cached) {
          const blob = await cached.blob();
          this[asset.key] = URL.createObjectURL(blob);
        } else {
          this[asset.key] = asset.path;
        }
      } catch {
        this[asset.key] = asset.path;
      }
    }
  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, 'e-receipt-menu');
    this.loadUserData();
  }

  private loadUserData(): void {
    this.uid = this.authService.getUserId();
    this.user = this.authService.currentUser;
    this.refreshMenuItems();

    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadCurrentSessionUser();
  }

  private loadCurrentSessionUser(): void {
    this.authService.refreshSession().subscribe({
      next: () => {
        this.user = this.authService.currentUser;
        this.uid = this.authService.getUserId();
        this.refreshMenuItems();
        this.updatePendingBookingsCount();
      },
      error: (err: any) => console.error('Error loading session user:', err),
    });
  }

  private refreshMenuItems(): void {
    this.menuItems =
      this.menuService.getVisibleMenuItemsForCurrentUser();
  }

  onMenuItemTap(item: MenuItem): void {
    if (item.action === 'feature-unavailable') {
      this.showFeatureUnavailableToast();
    }
  }

  updatePendingBookingsCount() {
    const operatorId = this.user?.id;
    if (!operatorId) return;

    this.bookingService.getOperatorAllBookings(operatorId).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.pendingBookingsCount = res.data.filter(
            (b: any) => b.status?.toLowerCase() === 'booked',
          ).length;
        } else {
          this.pendingBookingsCount = 0;
        }
      },
      error: (err: any) => {
        console.error('Error fetching bookings:', err);
        this.pendingBookingsCount = 0;
      },
    });
  }

  closeMenu(): void {
    this.menuCtrl.close();
  }

  openFirstMenu(): void {
    this.menuCtrl.open('e-receipt-menu');
  }

  async logoutToast(): Promise<void> {
    const toast = await this.toastController.create({
      message: 'User Logged Out',
      duration: 1500,
      position: 'bottom',
      cssClass: 'error-toast',
      icon: 'alert-circle',
    });
    await toast.present();
  }

  async showFeatureUnavailableToast() {
    const toast = await this.toastController.create({
      message: 'This feature is not available yet.',
      duration: 2000,
      position: 'bottom',
      icon: 'alert-circle-outline',
      color: 'warning',
    });
    await toast.present();
  }

  logOut(): void {
    this.authService.logout('/login');
    this.uid = null;
    this.user = null;
    this.menuItems = [];
    this.menuCtrl.enable(false, 'e-receipt-menu');
    this.menuCtrl.close();
    this.logoutToast();
  }
}
