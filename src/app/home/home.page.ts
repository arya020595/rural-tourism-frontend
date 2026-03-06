import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../services/api.service';
import {
  Notification,
  NotificationService,
} from '../services/notification.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  uid: string | null = null;
  user: any = null;
  unreadCount: number = 0;
  notifications: Notification[] = [];
  pendingBookingsCount: number = 0; // new property

  constructor(
    private apiService: ApiService,
    private menuCtrl: MenuController,
    private router: Router,
    private toastController: ToastController,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadUserData();

    // Subscribe to reactive unread count
    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
    });
  }

  ionViewWillEnter(): void {
    this.loadUserData();
  }

  /** Load user and notifications */
  private loadUserData(): void {
    this.uid = localStorage.getItem('uid');
    const storedUser = localStorage.getItem('user');
    this.user = storedUser ? JSON.parse(storedUser) : null;

    if (!this.uid) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadUser();
    this.loadNotifications();
    this.updatePendingBookingsCount();
  }

  private loadUser(): void {
    if (!this.uid) return;

    this.apiService.getUserByID(this.uid).subscribe({
      next: (data: any) => (this.user = data),
      error: (err: any) => console.error('Error loading user:', err),
    });
  }

  /** Load notifications via service (reactive) */
  private loadNotifications(): void {
    if (!this.uid) return;

    this.notificationService.getNotifications(this.uid).subscribe({
      next: (notifications: Notification[]) => {
        this.notifications = notifications;
      },
      error: (err: any) => console.error('Error fetching notifications:', err),
    });
  }

  // Call this whenever you load operator bookings
  updatePendingBookingsCount() {
    const operatorId = this.user?.id;
    if (!operatorId) return;

    this.apiService.getOperatorAllBookings(operatorId).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          // Count only bookings that are not yet Paid or Cancelled
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

  /** Mark a single notification as read */
  markNotificationAsRead(notification: Notification): void {
    if (notification.read) return;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true; // update locally for UI
      },
      error: (err) => console.error('Error marking notification as read:', err),
    });
  }

  /** Go to notifications page and mark all as read */
  goToNotifications(): void {
    if (!this.uid) return;

    this.router.navigate(['/notifications']);
    this.notificationService.markAllAsRead(this.uid).subscribe({
      next: () => {
        // notifications marked read, badge auto-updates via BehaviorSubject
        this.notifications.forEach((n) => (n.read = true)); // optional local update
      },
      error: (err) =>
        console.error('Error marking all notifications as read:', err),
    });
  }

  /** Send a test notification */
  async sendTestNotification(): Promise<void> {
    if (!this.uid) return;

    const notificationData = {
      operator_id: this.uid,
      tourist_user_id: '123',
      booking_id: 456,
      message: 'Test notification',
      read_status: 0,
    };

    try {
      await firstValueFrom(
        this.notificationService.createOperatorNotification(notificationData),
      );
      console.log('Notification sent successfully');
      this.loadNotifications();
    } catch (err: any) {
      console.error('Error sending notification:', err);
    }
  }

  closeMenu(): void {
    this.menuCtrl.close();
  }

  openFirstMenu(): void {
    this.menuCtrl.open('menu');
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
    localStorage.clear();
    this.uid = null;
    this.user = null;
    this.menuCtrl.enable(false, 'mainMenu');
    this.menuCtrl.close();
    this.logoutToast();
    this.router.navigate(['/tourist/home']);
  }
}
