import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import { AuthService, User } from '../../services/auth.service';
import { MenuItem, MenuService } from '../../services/menu.service';
import {
  AssociationStatRow,
  DashboardApiService,
} from '../../home/dashboard/services/dashboard-api.service';

/**
 * Superadmin-only page: all-time totals per association — bookings, receipts
 * (paid bookings), and tourists — shown as a stat card per association.
 */
@Component({
  selector: 'app-association-stats',
  templateUrl: './association-stats.page.html',
  styleUrls: ['./association-stats.page.scss'],
})
export class AssociationStatsPage implements OnInit {
  user: User | null = null;
  menuItems: MenuItem[] = [];

  associations: AssociationStatRow[] = [];
  totals = { totalBookings: 0, totalReceipts: 0, totalTourists: 0 };
  isLoading = false;
  loadError = false;

  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private toastController: ToastController,
    private menuService: MenuService,
    private authService: AuthService,
    private dashboardApi: DashboardApiService,
  ) {}

  ngOnInit() {
    this.loadUser();
    this.loadStats();
  }

  ionViewWillEnter() {
    this.loadUser();
    this.loadStats();
  }

  private loadUser() {
    this.user = this.authService.currentUser;
    this.menuItems = this.menuService.getVisibleMenuItemsForCurrentUser();
    if (!this.user) {
      this.router.navigate(['/login']);
    }
  }

  private loadStats() {
    this.isLoading = true;
    this.loadError = false;
    this.dashboardApi.getAssociationStats().subscribe({
      next: (res) => {
        this.associations = res?.data?.associations ?? [];
        this.totals =
          res?.data?.totals ?? {
            totalBookings: 0,
            totalReceipts: 0,
            totalTourists: 0,
          };
        this.isLoading = false;
      },
      error: () => {
        this.loadError = true;
        this.isLoading = false;
      },
    });
  }

  onMenuItemTap(item: MenuItem): void {
    if (item.action === 'feature-unavailable') {
      this.toastController
        .create({
          message: 'This feature is not available yet.',
          duration: 2000,
          position: 'bottom',
          color: 'warning',
        })
        .then((toast) => toast.present());
    }
  }

  trackAssociation(_index: number, row: AssociationStatRow): number {
    return row.associationId;
  }

  closeMenu() {
    this.menuCtrl.close();
  }

  async logOut() {
    this.authService.logout('/login');
    this.user = null;
    this.menuCtrl.close();
    const toast = await this.toastController.create({
      message: 'Logged out successfully',
      duration: 1500,
      position: 'bottom',
      color: 'danger',
    });
    await toast.present();
  }
}
