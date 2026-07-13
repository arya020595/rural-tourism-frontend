import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import { AuthService, User } from '../../services/auth.service';
import { MenuItem, MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-association-change-password',
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
})
export class AssociationChangePasswordPage implements OnInit {
  user: User | null = null;
  menuItems: MenuItem[] = [];

  // Profile fields
  name = '';
  username = '';
  email = '';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  showCurrent = false;
  showNew = false;
  showConfirm = false;

  savingProfile = false;
  submitting = false;

  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private toastController: ToastController,
    private menuService: MenuService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.loadUser();
  }

  ionViewWillEnter() {
    this.loadUser();
  }

  loadUser() {
    this.user =
      this.authService.currentUser ||
      this.parseStoredUser(localStorage.getItem('association_user')) ||
      this.parseStoredUser(localStorage.getItem('user'));
    this.menuItems =
      this.menuService.getVisibleMenuItemsForCurrentUser();

    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    this.name = this.user.name || this.user.full_name || '';
    this.username = this.user.username || '';
    this.email = this.user.email || '';
  }

  private getUserId(): string | number | null {
    return (
      this.user?.id ??
      this.user?.unified_user_id ??
      this.user?.user_id ??
      null
    );
  }

  get isProfileValid(): boolean {
    return (
      this.name.trim().length >= 2 &&
      this.username.trim().length >= 3 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim()) &&
      !this.savingProfile
    );
  }

  async saveProfile() {
    const userId = this.getUserId();
    if (!this.isProfileValid || !userId) {
      return;
    }

    this.savingProfile = true;
    this.authService
      .updateProfile(userId, {
        name: this.name.trim(),
        username: this.username.trim(),
        email: this.email.trim(),
      })
      .subscribe({
        next: async () => {
          this.savingProfile = false;
          this.persistUserChanges({
            name: this.name.trim(),
            username: this.username.trim(),
            email: this.email.trim(),
          });
          await this.presentToast(
            'Profil berjaya dikemas kini / Profile updated successfully.',
            'success',
          );
        },
        error: async () => {
          this.savingProfile = false;
          // The HTTP interceptor already shows the server error message.
        },
      });
  }

  private persistUserChanges(changes: {
    name: string;
    username: string;
    email: string;
  }): void {
    if (this.user) {
      this.user = { ...this.user, ...changes };
    }
    for (const key of ['user', 'association_user']) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        localStorage.setItem(key, JSON.stringify({ ...parsed, ...changes }));
      } catch {
        // ignore malformed entry
      }
    }
  }

  private parseStoredUser(rawUser: string | null): User | null {
    if (!rawUser) {
      return null;
    }
    try {
      const parsed = JSON.parse(rawUser);
      return parsed && typeof parsed === 'object' ? (parsed as User) : null;
    } catch {
      return null;
    }
  }

  get passwordMismatch(): boolean {
    return (
      this.confirmPassword.length > 0 &&
      this.newPassword !== this.confirmPassword
    );
  }

  get isValid(): boolean {
    return (
      this.currentPassword.length > 0 &&
      this.newPassword.length >= 8 &&
      this.newPassword === this.confirmPassword &&
      !this.submitting
    );
  }

  async submit() {
    if (!this.isValid) {
      return;
    }

    this.submitting = true;
    this.authService
      .changePassword(this.currentPassword, this.newPassword)
      .subscribe({
        next: async () => {
          this.submitting = false;
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          await this.presentToast(
            'Kata laluan berjaya ditukar / Password changed successfully.',
            'success',
          );
        },
        error: async () => {
          this.submitting = false;
          // The HTTP interceptor already shows the server error message.
        },
      });
  }

  private async presentToast(
    message: string,
    color: 'success' | 'danger',
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color,
    });
    await toast.present();
  }

  onMenuItemTap(_item: MenuItem): void {
    // No special handling required for association menu items.
  }

  async logOut() {
    this.authService.logout('/login');
    this.user = null;
    this.menuCtrl.close();
  }
}
