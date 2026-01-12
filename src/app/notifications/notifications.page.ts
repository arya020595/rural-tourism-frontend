import { Component, OnInit } from '@angular/core';
import { NotificationService, Notification } from '../services/notification.service';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage implements OnInit {

  uid: string | null = null;
  notifications: Notification[] = [];
  unreadCount: number = 0;
  
  constructor(
    private notificationService: NotificationService,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    this.uid = localStorage.getItem('operator_id'); // ensure this is operator_id
    console.log('Operator ID:', this.uid);
    if (this.uid) this.loadNotifications();
  }

  ionViewWillEnter() {
    if (this.uid) this.loadNotifications(); // refresh every time page is entered
  }

  backHome() {
    this.navCtrl.navigateForward('/home', {
      animated: true,
      animationDirection: 'back'
    });
  }

  /** Load notifications */
  loadNotifications() {
    if (!this.uid) return;

    this.notificationService.getNotifications(this.uid).subscribe({
      next: (data) => {
        console.log('Notifications fetched:', data);

        // Convert backend is_read (0/1) to frontend boolean
        this.notifications = data.map(n => ({
          ...n,
          read: !!n.is_read // <-- only map is_read
        }));

        // Count unread notifications
        this.unreadCount = this.notifications.filter(n => !n.read).length;

        console.log('Loaded notifications from API:', this.notifications);
      },
      error: (err) => console.error('Error loading notifications:', err)
    });
  }

  /** Mark single notification as read */
  markAsRead(notification: Notification) {
    if (notification.read) return;

    // Optimistic update
    notification.read = true;
    this.unreadCount = this.notifications.filter(n => !n.read).length;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => console.log(`Notification ${notification.id} marked as read`),
      error: err => console.error('Error marking notification as read:', err)
    });
  }

  /** Mark all notifications as read */
  markAllAsRead() {
    if (!this.uid) return;

    this.notifications.forEach(n => n.read = true);
    this.unreadCount = 0;

    this.notificationService.markAllAsRead(this.uid).subscribe({
      next: () => console.log('All notifications marked as read'),
      error: err => console.error('Error marking all notifications as read:', err)
    });
  }
}
