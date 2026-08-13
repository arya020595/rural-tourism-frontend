import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import { AuthService, User } from '../../services/auth.service';
import { MenuItem, MenuService } from '../../services/menu.service';
import { sanitizePowerBiUrl } from '../../utils/power-bi-url.util';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class AssociationDashboardPage implements OnInit {
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
    const storedAssociationUser = this.parseStoredUser(
      localStorage.getItem('association_user'),
    );
    const storedUser = this.parseStoredUser(localStorage.getItem('user'));
    this.user =
      this.authService.currentUser || storedAssociationUser || storedUser;
    this.menuItems =
      this.menuService.getVisibleMenuItemsForCurrentUser();

    if (!this.user) {
      this.biDashboardUrl = null;
      this.router.navigate(['/login']);
      return;
    }

    const rawUrl = sanitizePowerBiUrl(this.user.power_bi_url);
    this.biDashboardUrl = rawUrl
      ? this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl)
      : null;
  }

  private parseStoredUser(rawUser: string | null): User | null {
    if (!rawUser) {
      return null;
    }

    try {
      const parsedUser = JSON.parse(rawUser);
      return parsedUser && typeof parsedUser === 'object'
        ? (parsedUser as User)
        : null;
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
