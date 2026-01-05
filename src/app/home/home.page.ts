import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { MenuController, ToastController } from '@ionic/angular';
import { Router } from "@angular/router";
import { NotificationService, Notification } from '../services/notification.service';
import { firstValueFrom } from 'rxjs';

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

  constructor(
    private apiService: ApiService,
    private menuCtrl: MenuController,
    private router: Router,
    private toastController: ToastController,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  ionViewWillEnter(): void {
    this.loadUserData();
  }

  /** Load user and notifications from localStorage / API */
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
  }

  private loadUser(): void {
    if (!this.uid) return;

    this.apiService.getUserByID(this.uid).subscribe({
      next: (data: any) => this.user = data,
      error: (err: any) => console.error('Error loading user:', err)
    });
  }

  /** Load notifications and update unread count */
  private loadNotifications(): void {
    if (!this.uid) return;

    this.notificationService.getNotifications(this.uid).subscribe({
      next: (notifications: Notification[]) => {
        // Convert TINYINT read_status to boolean
        this.notifications = notifications.map(n => ({
          ...n,
          read: Number(n.read_status) === 1
        }));
        this.updateUnreadCount();
      },
      error: (err: any) => console.error('Error fetching notifications:', err)
    });
  }

  /** Update unreadCount based on notifications array */
  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  /** Mark a single notification as read */
  markNotificationAsRead(notification: Notification): void {
    if (notification.read) return;

    // Optimistically mark as read locally
    notification.read = true;
    notification.read_status = 1;
    this.updateUnreadCount();

    // Update backend
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        console.log(`Notification ${notification.id} marked as read on backend`);
        // Reload notifications to ensure consistency
        this.loadNotifications();
      },
      error: (err) => console.error('Error marking notification as read:', err)
    });
  }

  //Toast Message for Feature Not Available
  async featureNotAvailable(): Promise<void>{
    const toast = await this.toastController.create({
      message: 'This option feature is not available yet.', 
      duration: 2000, 
      position: 'bottom',
      color: 'medium',
      icon: 'information-circle'
    });
    
    await toast.present();
  }

  /** Navigate to notifications and mark all as read */
  goToNotifications(): void {
    if (!this.uid) return;

    this.router.navigate(['/notifications']);

    // Optimistically mark all as read locally
    this.notifications = this.notifications.map(n => ({
      ...n,
      read: true,
      read_status: 1
    }));
    this.updateUnreadCount();

    // Update backend
    this.notificationService.markAllAsRead(this.uid).subscribe({
      next: () => {
        console.log('All notifications marked as read on backend');
        this.loadNotifications(); // reload from backend
      },
      error: (err) => console.error('Error marking all notifications as read:', err)
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
      read_status: 0
    };

    try {
      await firstValueFrom(this.notificationService.createOperatorNotification(notificationData));
      console.log('Notification sent successfully');
      this.loadNotifications(); // Refresh badge after sending
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
      message: "User Logged Out",
      duration: 1500,
      position: "bottom",
      cssClass: 'error-toast',
      icon: 'alert-circle'
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
