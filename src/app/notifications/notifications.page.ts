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
    this.uid = localStorage.getItem('operator_id');
    if (this.uid) this.loadNotifications();
  }

  ionViewWillEnter() {
    if (this.uid) this.loadNotifications();
  }

  backHome() {
    this.navCtrl.navigateForward('/home', {
      animated: true,
      animationDirection: 'back'
    });
  }

  loadNotifications() {
    if (!this.uid) return;

    // Get the latest notification timestamp (if any)
    const latest = this.notifications.length ? this.notifications[0].createdAt : undefined;

    this.notificationService.getNotifications(this.uid, latest).subscribe({
      next: (newNotifications) => {
        if (newNotifications.length) {
          // Prepend new notifications to the existing list
          this.notifications = [...newNotifications, ...this.notifications];

          // Update unread count
          this.unreadCount = this.notifications.filter(n => !n.read).length;
        }
      },
      error: (err) => console.error('Error loading notifications:', err)
    });
  }

  markAsRead(notification: Notification) {
    if (notification.read) return;

    notification.read = true;
    this.unreadCount = this.notifications.filter(n => !n.read).length;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => console.log(`Notification ${notification.id} marked as read`),
      error: err => console.error('Error marking notification as read:', err)
    });
  }

  markAllAsRead() {
    if (!this.uid) return;

    this.notifications.forEach(n => n.read = true);
    this.unreadCount = 0;

    this.notificationService.markAllAsRead(this.uid).subscribe({
      next: () => console.log('All notifications marked as read'),
      error: err => console.error('Error marking all notifications as read:', err)
    });
  }

  /** Convert a date string to "seconds/minutes/hours/days ago" format */
timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime(); // difference in milliseconds

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}


  /** Format full date and time nicely */
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
