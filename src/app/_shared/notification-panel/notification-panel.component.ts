import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { CompanyService } from '../../services/company.service';
import {
  Notification,
  NotificationService,
} from '../../services/notification.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-notification-panel',
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss'],
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
  isOpen = false;
  notifications: Notification[] = [];
  companyLogoUrl: string | null = null;

  private uid: string | null = null;
  private subs: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private companyService: CompanyService,
    private storageService: StorageService,
    private navCtrl: NavController,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.uid = this.authService.getUserId();
    this.loadCompanyLogo();

    // Auto-close panel when the user navigates to another page
    this.subs.push(
      this.router.events
        .pipe(filter((e) => e instanceof NavigationStart))
        .subscribe(() => {
          this.isOpen = false;
        }),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  toggle(): void {
    const uid = this.authService.getUserId();
    if (!uid) return;
    this.uid = uid;

    if (window.innerWidth >= 768) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.loadNotifications();
      }
    } else {
      this.navCtrl.navigateForward('/notifications');
    }
  }

  close(): void {
    this.isOpen = false;
  }

  get hasUnread(): boolean {
    return this.notifications.some((n) => !n.read);
  }

  markAsRead(notification: Notification): void {
    if (notification.read) return;
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
      },
    });
  }

  markAllAsRead(): void {
    const uid = this.uid;
    if (!uid) return;
    this.notificationService.markAllAsRead(uid).subscribe({
      next: () => {
        this.notifications.forEach((n) => (n.read = true));
      },
    });
  }

  getAvatarLetter(notification: Notification): string {
    const name = notification.tourist_name?.trim();
    if (name) return name.charAt(0).toUpperCase();
    if (notification.message) return notification.message.charAt(0).toUpperCase();
    return '?';
  }

  timeAgo(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  private loadNotifications(): void {
    const uid = this.uid;
    if (!uid) return;

    this.notificationService.getNotifications(uid).subscribe({
      next: (notifications) => {
        this.notifications = notifications;
      },
    });
  }

  private async loadCompanyLogo(): Promise<void> {
    const user = this.authService.currentUser;
    const companyId = user?.company_id;
    if (!companyId) return;

    // Show cached logo immediately (works offline)
    const cached = await this.storageService.getCompanyLogo(companyId);
    if (cached) {
      this.companyLogoUrl = cached;
    }

    // Fetch fresh from network and update cache
    this.companyService.getCompanyById(companyId).subscribe({
      next: async (res: any) => {
        const logo = res?.data?.operator_logo_image ?? res?.operator_logo_image ?? null;
        if (logo) {
          this.companyLogoUrl = logo;
          await this.storageService.setCompanyLogo(companyId, logo);
        }
      },
    });
  }
}
