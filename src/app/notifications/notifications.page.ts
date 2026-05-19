import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { CompanyService } from '../services/company.service';
import { StorageService } from '../services/storage.service';
import {
  Notification,
  NotificationService,
} from '../services/notification.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage implements OnInit {
  uid: string | null = null;
  notifications: Notification[] = [];
  unreadCount: number = 0;
  companyLogoUrl: string | null = null;

  constructor(
    private notificationService: NotificationService,
    private navCtrl: NavController,
    private authService: AuthService,
    private companyService: CompanyService,
    private storageService: StorageService,
  ) {}

  ngOnInit() {
    this.uid = localStorage.getItem('uid');
  }

  ionViewWillEnter() {
    this.uid = localStorage.getItem('uid');
    if (this.uid) {
      this.notifications = [];
      this.loadNotifications();
      this.loadCompanyLogo();
    }
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

  backHome() {
    this.navCtrl.back();
  }

  loadNotifications() {
    if (!this.uid) return;

    this.notificationService.getNotifications(this.uid).subscribe({
      next: (notifications) => {
        console.log('Notifications received:', notifications);
        this.notifications = notifications;
        this.unreadCount = notifications.filter((n) => !n.read).length;
      },
      error: (err) => console.error('Error loading notifications:', err),
    });
  }

  get hasUnread(): boolean {
    return this.notifications.some((n) => !n.read);
  }

  markAsRead(notification: Notification) {
    if (notification.read) return;

    notification.read = true;
    this.unreadCount = this.notifications.filter((n) => !n.read).length;

    this.notificationService.markAsRead(notification.id).subscribe({
      error: (err) => console.error('Error marking notification as read:', err),
    });
  }

  markAllAsRead() {
    if (!this.uid) return;
    this.notificationService.markAllAsRead(this.uid).subscribe({
      next: () => {
        this.notifications.forEach((n) => (n.read = true));
        this.unreadCount = 0;
      },
    });
  }

  getAvatarLetter(notification: Notification): string {
    let name = notification.tourist_name?.trim();
    if (!name && notification.message) {
      name = notification.message.split(' ')[0];
    }
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  timeAgo(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }
}
