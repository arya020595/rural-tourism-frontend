import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { NotificationPanelComponent } from './notification-panel.component';

@Component({
  selector: 'app-notification-bell',
  template: `
    <ion-button
      (click)="onBellClick()"
      class="notification-button"
      *hasPermission="'booking:read'"
    >
      <ion-icon
        class="notification-bell"
        slot="icon-only"
        name="notifications"
      ></ion-icon>
      <ion-badge
        *ngIf="unreadCount > 0"
        color="danger"
        class="notification-badge"
      >
        {{ unreadCount }}
      </ion-badge>
    </ion-button>
  `,
  styles: [`
    :host { display: contents; }
    .notification-button { position: relative; }
    .notification-bell { font-size: 24px; color: #ffc107; }
    .notification-badge {
      position: absolute;
      top: 2px; right: 2px;
      font-size: 10px;
      padding: 2px 5px;
      border-radius: 50%;
      z-index: 10;
      transform: translate(25%, -25%);
    }
  `],
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  @Input() panel!: NotificationPanelComponent;

  unreadCount = 0;
  private sub?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.sub = this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onBellClick(): void {
    this.panel?.toggle();
  }
}
