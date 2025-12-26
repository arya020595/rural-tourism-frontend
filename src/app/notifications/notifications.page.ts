import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../services/notification.service';
import { NavController } from '@ionic/angular';

interface Notification {
  id: number;
  operator_id: string;
  tourist_user_id: string;
  booking_id: number;
  message: string;
  read_status: number; // comes from backend
  read?: boolean;      // mapped locally for convenience
  createdAt?: string;
  updatedAt?: string;
}

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
    this.uid = localStorage.getItem('uid');
    if (this.uid) {
      this.loadNotifications();
    }
  }


  backHome(){
    this.navCtrl.navigateForward('/home', {
      animated: true,        // Enable animation
      animationDirection: 'back'  // Can be 'forward' or 'back' for custom direction
    });
  }

loadNotifications() {
  if (!this.uid) return;

  this.notificationService.getNotifications(this.uid).subscribe(
    (data) => {
      // Map read_status → read
      this.notifications = data.map(n => ({
        ...n,
        read: !!n.read_status
      }));

      // Update unread count
      this.unreadCount = this.notifications.filter(n => !n.read).length;
    },
    err => console.error(err)
  );
}



  markAsRead(notification: Notification) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe(
        () => {
          notification.read = true; // Update local UI
          this.unreadCount = this.notifications.filter(n => !n.read).length;
        },
        (err) => console.error('Error marking notification as read:', err)
      );
    }
  }
}
