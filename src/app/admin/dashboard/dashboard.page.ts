import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import { AuthService, User } from '../../services/auth.service';
import { MenuItem, MenuService } from '../../services/menu.service';
import { sanitizePowerBiUrl } from '../../utils/power-bi-url.util';

/**
 * Hardcoded Power BI dashboard for the platform superadmin. Unlike the
 * association dashboard (whose URL is stored per-record in the database), the
 * admin dashboard points at a single fixed report. Replace this URL to change
 * which report superadmin sees.
 */
const ADMIN_POWER_BI_URL =
  'https://app.powerbi.com/view?r=REPLACE_WITH_ADMIN_REPORT_URL';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class AdminDashboardPage implements OnInit {
  user: User | null = null;
  menuItems: MenuItem[] = [];
  biDashboardUrl: SafeResourceUrl | null = null;

  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private toastController: ToastController,
    private menuService: MenuService,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    this.loadUser();
  }

  ionViewWillEnter() {
    this.loadUser();
  }

  loadUser() {
    this.user = this.authService.currentUser;
    this.menuItems = this.menuService.getVisibleMenuItemsForCurrentUser();

    if (!this.user) {
      this.biDashboardUrl = null;
      this.router.navigate(['/login']);
      return;
    }

    const rawUrl = sanitizePowerBiUrl(ADMIN_POWER_BI_URL);
    this.biDashboardUrl = rawUrl
      ? this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl)
      : null;
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

  trackMenuItem(_index: number, item: MenuItem): string {
    return item.id;
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
