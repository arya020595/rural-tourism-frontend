import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
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

  constructor(
    private notificationService: NotificationService,
    private navCtrl: NavController,
  ) {}

  ngOnInit() {
    this.uid = localStorage.getItem('operator_id');
  }

  ionViewWillEnter() {
    this.uid = localStorage.getItem('operator_id');
    if (this.uid) {
      this.notifications = []; // reset to avoid duplicates
      this.loadNotifications();
    }
  }

  backHome() {
    this.navCtrl.navigateForward('/home', {
      animated: true,
      animationDirection: 'back',
    });
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

  markAsRead(notification: Notification) {
    if (notification.read) return;

    notification.read = true;
    this.unreadCount = this.notifications.filter((n) => !n.read).length;

    this.notificationService.markAsRead(notification.id).subscribe({
      error: (err) => console.error('Error marking notification as read:', err),
    });
  }

  /** Avatar letter from tourist_name or fallback */
  getAvatarLetter(notification: Notification): string {
    let name = notification.tourist_name?.trim();

    // fallback: use first word from message
    if (!name && notification.message) {
      name = notification.message.split(' ')[0];
    }

    return name ? name.charAt(0).toUpperCase() : '?';
  }

  /** Time ago: takes a string date */
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
