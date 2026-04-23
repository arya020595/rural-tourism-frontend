import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { MenuItem, MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class AssociationDashboardPage implements OnInit {
  user: any = null;
  menuItems: MenuItem[] = [];
  biDashboardUrl: SafeResourceUrl | null = null;
  private readonly powerBiSensitiveParams = new Set([
    'access_token',
    'token',
    'id_token',
    'embedtoken',
    'jwt',
    'sig',
    'signature',
    'apikey',
    'api_key',
  ]);

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
    const storedAssociationUser = this.parseStoredUser(
      localStorage.getItem('association_user'),
    );
    const storedUser = this.parseStoredUser(localStorage.getItem('user'));
    this.user =
      this.authService.currentUser || storedAssociationUser || storedUser;
    this.menuItems =
      this.menuService.getVisibleMenuItemsForContext('association');

    if (!this.user) {
      this.biDashboardUrl = null;
      this.router.navigate(['/login']);
      return;
    }

    const rawUrl = this.sanitizePowerBiUrl(this.user.power_bi_url);
    this.biDashboardUrl = rawUrl
      ? this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl)
      : null;
  }

  private parseStoredUser(rawUser: string | null): any | null {
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser);
    } catch {
      return null;
    }
  }

  private sanitizePowerBiUrl(rawUrl: unknown): string | null {
    if (typeof rawUrl !== 'string') {
      return null;
    }

    const trimmedUrl = rawUrl.trim();
    if (!trimmedUrl) {
      return null;
    }

    try {
      const parsedUrl = new URL(trimmedUrl);
      const hostname = parsedUrl.hostname.toLowerCase();

      if (parsedUrl.protocol !== 'https:') {
        return null;
      }

      if (hostname !== 'powerbi.com' && !hostname.endsWith('.powerbi.com')) {
        return null;
      }

      let hasSensitiveParam = false;
      parsedUrl.searchParams.forEach((_value, queryKey) => {
        if (this.powerBiSensitiveParams.has(queryKey.toLowerCase())) {
          hasSensitiveParam = true;
        }
      });

      if (hasSensitiveParam) {
        return null;
      }

      return parsedUrl.toString();
    } catch {
      return null;
    }
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
