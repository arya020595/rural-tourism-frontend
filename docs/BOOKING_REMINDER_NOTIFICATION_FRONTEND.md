# Frontend Technical Documentation: Booking Reminder Notification System

**Feature**: Real-Time Notification Polling & Bell Icon Updates  
**Version**: 1.0  
**Date**: May 7, 2026  
**Author**: Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Phase 1: Notification Polling Setup](#phase-1-notification-polling-setup)
4. [Phase 2: UI Enhancements](#phase-2-ui-enhancements)
5. [Phase 3: Testing & Validation](#phase-3-testing--validation)
6. [Deployment Guide](#deployment-guide)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### Purpose

Enable operators to receive real-time notifications about upcoming bookings via automated polling of the backend API, displaying unread count in the bell icon across all pages.

### User Experience

1. Operator logs into the app
2. Polling starts automatically (every 60 seconds)
3. Bell icon badge updates when new notifications arrive
4. Clicking notification navigates to booking details
5. Notifications marked as read automatically

### Technical Requirements

- Angular 15+ with Ionic Framework
- RxJS for reactive state management
- HttpClient for API communication
- Capacitor (mobile app support)

---

## Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      APP INITIALIZATION                         │
│                     app.component.ts                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  User Logs In        │
                  │  (auth.service.ts)   │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────────────┐
                  │  Start Polling               │
                  │  notificationService         │
                  │  .startPolling(userId)       │
                  └──────────┬───────────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
        ▼                                         ▼
┌───────────────────┐                  ┌──────────────────────┐
│ RxJS interval(60s)│                  │ Components Subscribe │
│ Trigger API Call  │                  │ to unreadCount$      │
└────────┬──────────┘                  └──────────┬───────────┘
         │                                        │
         ▼                                        │
┌────────────────────────┐                       │
│ GET /api/notifications │                       │
│ /operator/:uid         │                       │
│ /unread-count          │                       │
└────────┬───────────────┘                       │
         │                                        │
         ▼                                        │
┌────────────────────────┐                       │
│ Update BehaviorSubject │                       │
│ unreadCountSubject     │                       │
└────────┬───────────────┘                       │
         │                                        │
         └────────────────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  Bell Icon Updates   │
                  │  Badge: {{ count }}  │
                  └──────────────────────┘
```

### State Management

**Reactive Pattern (RxJS):**

```typescript
// Service (notification.service.ts)
private unreadCountSubject = new BehaviorSubject<number>(0);
public unreadCount$ = this.unreadCountSubject.asObservable();

// Component (home.page.ts)
ngOnInit() {
  this.notificationService.unreadCount$.subscribe(count => {
    this.unreadCount = count;
  });
}

// Template (home.page.html)
<ion-badge *ngIf="unreadCount > 0">{{ unreadCount }}</ion-badge>
```

**Benefits:**

- **Centralized state**: Single source of truth for unread count
- **Automatic updates**: All subscribed components update simultaneously
- **Memory efficient**: Components auto-unsubscribe on destroy
- **Type-safe**: TypeScript ensures correct data types

---

## Phase 1: Notification Polling Setup

### Step 1.1: Modify Notification Service

**File:** `src/app/services/notification.service.ts`

**Add Polling Logic:**

```typescript
import { Injectable, OnDestroy } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { BehaviorSubject, Observable, interval, EMPTY, Subject } from "rxjs";
import { switchMap, catchError, tap, takeUntil, distinctUntilChanged } from "rxjs/operators";
import { environment } from "src/environments/environment";

export interface Notification {
  id: number;
  user_id: string;
  user_type: "operator" | "tourist";
  title: string;
  message: string;
  type?: string;
  related_id?: number;
  is_read?: number;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: "root",
})
export class NotificationService implements OnDestroy {
  private apiUrl = `${environment.apiUrl}/notifications`;

  // Reactive state management
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable().pipe(
    distinctUntilChanged(), // Only emit when value changes
  );

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  // Polling control
  private pollingSubscription?: any;
  private destroy$ = new Subject<void>();
  private isPolling = false;

  // Configuration
  private readonly POLL_INTERVAL = 60000; // 60 seconds
  private readonly POLL_ON_ERROR_INTERVAL = 120000; // 2 minutes (slower on error)

  constructor(private http: HttpClient) {}

  /**
   * Start polling for new notifications
   * @param userId - Operator's user ID
   */
  startPolling(userId: string): void {
    if (this.isPolling) {
      console.log("[NotificationService] Polling already active");
      return;
    }

    if (!userId) {
      console.warn("[NotificationService] Cannot start polling: userId is required");
      return;
    }

    console.log("[NotificationService] Starting notification polling for user:", userId);
    this.isPolling = true;

    // Initial load (immediate)
    this.loadUnreadCount(userId);

    // Setup periodic polling
    this.pollingSubscription = interval(this.POLL_INTERVAL)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.getUnreadCount(userId)),
        tap((count) => {
          this.unreadCountSubject.next(count);
        }),
        catchError((error) => {
          console.error("[NotificationService] Polling error:", error);
          // Continue polling even on error
          return EMPTY;
        }),
      )
      .subscribe();
  }

  /**
   * Stop polling (call on logout)
   */
  stopPolling(): void {
    if (this.pollingSubscription) {
      console.log("[NotificationService] Stopping notification polling");
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
    this.isPolling = false;
    this.unreadCountSubject.next(0);
    this.notificationsSubject.next([]);
  }

  /**
   * Load unread count (one-time)
   */
  private loadUnreadCount(userId: string): void {
    this.getUnreadCount(userId).subscribe({
      next: (count) => this.unreadCountSubject.next(count),
      error: (err) => console.error("[NotificationService] Error loading unread count:", err),
    });
  }

  /**
   * Get unread notification count from API
   */
  getUnreadCount(userId: string): Observable<number> {
    const token = localStorage.getItem("token");
    const headers = new HttpHeaders().set("Authorization", `Bearer ${token}`);

    return this.http.get<{ success: boolean; data: { count: number } }>(`${this.apiUrl}/operator/${userId}/unread-count`, { headers }).pipe(
      tap((response) => {
        console.log(`[NotificationService] Unread count: ${response.data.count}`);
      }),
      switchMap((response) => {
        if (response.success && response.data) {
          return [response.data.count];
        }
        return [0];
      }),
      catchError((error) => {
        console.error("[NotificationService] Error fetching unread count:", error);
        return [0]; // Return 0 on error to prevent breaking UI
      }),
    );
  }

  /**
   * Get all notifications for a user
   */
  getNotifications(userId: string, lastCreated?: string): Observable<Notification[]> {
    const token = localStorage.getItem("token");
    const headers = new HttpHeaders().set("Authorization", `Bearer ${token}`);

    let url = `${this.apiUrl}/operator/${userId}`;
    if (lastCreated) {
      url += `?lastCreated=${lastCreated}`;
    }

    return this.http.get<{ success: boolean; data: Notification[] }>(url, { headers }).pipe(
      tap((response) => {
        console.log(`[NotificationService] Fetched ${response.data.length} notifications`);
        this.notificationsSubject.next(response.data);
      }),
      switchMap((response) => {
        if (response.success && response.data) {
          return [response.data];
        }
        return [[]];
      }),
      catchError((error) => {
        console.error("[NotificationService] Error fetching notifications:", error);
        return [[]];
      }),
    );
  }

  /**
   * Mark a single notification as read
   */
  markAsRead(notificationId: number): Observable<any> {
    const token = localStorage.getItem("token");
    const headers = new HttpHeaders().set("Authorization", `Bearer ${token}`);

    return this.http.patch(`${this.apiUrl}/${notificationId}/read`, {}, { headers }).pipe(
      tap(() => {
        console.log(`[NotificationService] Marked notification ${notificationId} as read`);
        // Decrement unread count
        const currentCount = this.unreadCountSubject.value;
        if (currentCount > 0) {
          this.unreadCountSubject.next(currentCount - 1);
        }
      }),
      catchError((error) => {
        console.error("[NotificationService] Error marking as read:", error);
        throw error;
      }),
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead(userId: string): Observable<any> {
    const token = localStorage.getItem("token");
    const headers = new HttpHeaders().set("Authorization", `Bearer ${token}`);

    return this.http.patch(`${this.apiUrl}/operator/${userId}/read-all`, {}, { headers }).pipe(
      tap(() => {
        console.log("[NotificationService] Marked all notifications as read");
        this.unreadCountSubject.next(0);
      }),
      catchError((error) => {
        console.error("[NotificationService] Error marking all as read:", error);
        throw error;
      }),
    );
  }

  /**
   * Refresh notifications manually
   */
  refreshNotifications(userId: string): void {
    this.loadUnreadCount(userId);
    this.getNotifications(userId).subscribe();
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopPolling();
  }
}
```

**Key Features:**

1. **Automatic Polling**: Starts on `startPolling()`, runs every 60 seconds
2. **Error Resilient**: Continues polling even if API fails
3. **Memory Safe**: Auto-cleanup with `takeUntil(destroy$)`
4. **State Sync**: All components see same unread count via `unreadCount$` observable
5. **Optimized**: `distinctUntilChanged()` prevents unnecessary re-renders

---

### Step 1.2: Start Polling on App Init

**File:** `src/app/app.component.ts`

**Modify to Start Polling After Login:**

```typescript
import { Component, OnInit } from "@angular/core";
import { Platform } from "@ionic/angular";
import { Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";
import { AuthService } from "./services/auth.service";
import { NotificationService } from "./services/notification.service";
import { StorageService } from "./services/storage.service";

@Component({
  selector: "app-root",
  templateUrl: "app.component.html",
  styleUrls: ["app.component.scss"],
})
export class AppComponent implements OnInit {
  constructor(
    private platform: Platform,
    private authService: AuthService,
    private notificationService: NotificationService,
    private storageService: StorageService,
    private router: Router,
  ) {
    this.initializeApp();
  }

  ngOnInit() {
    // Start polling when user is authenticated
    this.authService.currentUser$.subscribe((user) => {
      if (user && user.unified_user_id) {
        console.log("[AppComponent] User authenticated, starting notification polling");
        this.notificationService.startPolling(user.unified_user_id);
      } else {
        console.log("[AppComponent] User logged out, stopping notification polling");
        this.notificationService.stopPolling();
      }
    });

    // Also check on navigation (handle page refresh)
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.checkAuthAndStartPolling();
    });
  }

  private async initializeApp() {
    await this.platform.ready();

    // Check if user is logged in on app start
    this.checkAuthAndStartPolling();
  }

  private checkAuthAndStartPolling() {
    const userId = localStorage.getItem("uid");
    const token = localStorage.getItem("token");

    if (userId && token) {
      // User is logged in, ensure polling is active
      this.notificationService.startPolling(userId);
    }
  }
}
```

**Alternative: Start Polling in Auth Service (More Elegant)**

**File:** `src/app/services/auth.service.ts`

**Add to `login()` method:**

```typescript
import { NotificationService } from "./notification.service";

@Injectable({ providedIn: "root" })
export class AuthService {
  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private notificationService: NotificationService, // Add this
  ) {}

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(async (response: any) => {
        if (response.success && response.data) {
          const { token, user } = response.data;

          // Store auth data
          await this.storageService.setToken(token);
          await this.storageService.setItem("uid", user.unified_user_id || user.id);
          await this.storageService.setItem("user", JSON.stringify(user));

          // Update current user
          this.currentUserSubject.next(user);

          // Start notification polling
          const userId = user.unified_user_id || user.id;
          this.notificationService.startPolling(userId);
        }
      }),
      catchError((error) => {
        console.error("Login error:", error);
        throw error;
      }),
    );
  }

  logout(): Observable<any> {
    // Stop polling on logout
    this.notificationService.stopPolling();

    // Clear auth data
    this.storageService.clearAuth();
    this.currentUserSubject.next(null);

    return this.http.post(`${this.apiUrl}/auth/logout`, {});
  }
}
```

---

### Step 1.3: Update Bell Icon Components

**Affected Files:**

- `src/app/home/home.page.ts`
- `src/app/notifications/notifications.page.ts`
- `src/app/e-receipt/e-receipt.page.ts`
- `src/app/company-profile/company-profile.page.ts`
- Any other pages with bell icons

**Example: `src/app/home/home.page.ts`**

**BEFORE:**

```typescript
export class HomePage implements OnInit {
  unreadCount: number = 0;
  uid: string = "";

  ngOnInit() {
    this.uid = localStorage.getItem("uid") || "";
  }

  ionViewWillEnter() {
    this.loadNotifications(); // Manual load every time
  }

  private loadNotifications() {
    this.notificationService.getUnreadCount(this.uid).subscribe({
      next: (count) => {
        this.unreadCount = count;
      },
      error: (err) => console.error("Error fetching unread count:", err),
    });
  }

  goToNotifications() {
    this.router.navigate(["/notifications"]);
  }
}
```

**AFTER (Reactive Approach):**

```typescript
import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { NotificationService } from "../services/notification.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

export class HomePage implements OnInit, OnDestroy {
  unreadCount: number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    // Subscribe to reactive unread count
    this.notificationService.unreadCount$.pipe(takeUntil(this.destroy$)).subscribe((count) => {
      this.unreadCount = count;
      console.log("[HomePage] Unread count updated:", count);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToNotifications() {
    this.router.navigate(["/notifications"]);
  }
}
```

**Changes:**

1. ✅ Removed manual `loadNotifications()` calls
2. ✅ Subscribed to `notificationService.unreadCount$` observable
3. ✅ Added `takeUntil(destroy$)` for proper memory cleanup
4. ✅ Implemented `OnDestroy` lifecycle hook
5. ✅ Count updates automatically when backend polling detects changes

**HTML Template** (no changes needed):

```html
<ion-button (click)="goToNotifications()" class="notification-button">
  <ion-icon class="notification-bell" slot="icon-only" name="notifications"></ion-icon>
  <ion-badge *ngIf="unreadCount > 0" color="danger" class="notification-badge"> {{ unreadCount }} </ion-badge>
</ion-button>
```

---

### Step 1.4: Update Notifications Page

**File:** `src/app/notifications/notifications.page.ts`

**Add Pull-to-Refresh & Reactive Updates:**

```typescript
import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { NotificationService, Notification } from "../services/notification.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-notifications",
  templateUrl: "./notifications.page.html",
  styleUrls: ["./notifications.page.scss"],
})
export class NotificationsPage implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount: number = 0;
  uid: string = "";
  loading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    this.uid = localStorage.getItem("uid") || "";

    // Subscribe to notifications observable
    this.notificationService.notifications$.pipe(takeUntil(this.destroy$)).subscribe((notifications) => {
      this.notifications = notifications;
    });

    // Subscribe to unread count
    this.notificationService.unreadCount$.pipe(takeUntil(this.destroy$)).subscribe((count) => {
      this.unreadCount = count;
    });

    // Initial load
    this.loadNotifications();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications() {
    if (!this.uid) return;

    this.loading = true;
    this.notificationService.getNotifications(this.uid).subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.loading = false;
      },
      error: (err) => {
        console.error("[NotificationsPage] Error loading notifications:", err);
        this.loading = false;
      },
    });
  }

  /**
   * Handle pull-to-refresh
   */
  handleRefresh(event: any) {
    this.notificationService.refreshNotifications(this.uid);

    // Complete refresh after 1 second
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  /**
   * Mark notification as read and navigate to booking
   */
  markAsRead(notification: Notification) {
    if (notification.is_read === 0 || !notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          // Update local state
          notification.read = true;
          notification.is_read = 1;

          // Navigate to booking detail if related_id exists
          if (notification.related_id) {
            this.router.navigate(["/booking-detail", notification.related_id]);
          }
        },
        error: (err) => {
          console.error("[NotificationsPage] Error marking as read:", err);
        },
      });
    } else if (notification.related_id) {
      // Already read, just navigate
      this.router.navigate(["/booking-detail", notification.related_id]);
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    if (this.unreadCount === 0) return;

    this.notificationService.markAllAsRead(this.uid).subscribe({
      next: () => {
        // Update local state
        this.notifications.forEach((n) => {
          n.read = true;
          n.is_read = 1;
        });
      },
      error: (err) => {
        console.error("[NotificationsPage] Error marking all as read:", err);
      },
    });
  }

  /**
   * Get avatar letter from tourist name
   */
  getAvatarLetter(notification: Notification): string {
    const match = notification.message.match(/^(\w)/);
    return match ? match[1].toUpperCase() : "N";
  }

  /**
   * Format timestamp as relative time
   */
  timeAgo(dateString: string): string {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return past.toLocaleDateString();
  }

  goBack() {
    this.router.navigate(["/home"]);
  }
}
```

**File:** `src/app/notifications/notifications.page.html`

**Add Pull-to-Refresh:**

```html
<ion-header [translucent]="true">
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-button (click)="goBack()" class="back-button">
        <ion-icon slot="icon-only" name="arrow-back"></ion-icon>
      </ion-button>
    </ion-buttons>
    <ion-title>Notifications</ion-title>
    <ion-buttons slot="end">
      <ion-button (click)="markAllAsRead()" [disabled]="unreadCount === 0">
        <ion-icon slot="icon-only" name="checkmark-done-outline"></ion-icon>
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true">
  <!-- Pull to Refresh -->
  <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
    <ion-refresher-content pullingIcon="chevron-down-circle-outline" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..."> </ion-refresher-content>
  </ion-refresher>

  <!-- Loading State -->
  <div *ngIf="loading" class="loading-container">
    <ion-spinner name="crescent"></ion-spinner>
    <p>Loading notifications...</p>
  </div>

  <!-- Notifications List -->
  <ion-list *ngIf="!loading && notifications.length > 0">
    <ion-item *ngFor="let notification of notifications" (click)="markAsRead(notification)" [class.unread]="!notification.read && notification.is_read === 0" button detail="false">
      <!-- Avatar -->
      <ion-avatar slot="start">
        <div class="avatar-letter">{{ getAvatarLetter(notification) }}</div>
      </ion-avatar>

      <!-- Content -->
      <ion-label>
        <h2>{{ notification.title }}</h2>
        <p>{{ notification.message }}</p>
        <p class="timestamp">{{ timeAgo(notification.createdAt) }}</p>
      </ion-label>

      <!-- Unread Indicator -->
      <ion-badge *ngIf="!notification.read && notification.is_read === 0" color="primary" slot="end"> New </ion-badge>
    </ion-item>
  </ion-list>

  <!-- Empty State -->
  <div *ngIf="!loading && notifications.length === 0" class="empty-state">
    <ion-icon name="notifications-off-outline"></ion-icon>
    <h3>No Notifications</h3>
    <p>You're all caught up!</p>
  </div>
</ion-content>
```

---

## Phase 2: UI Enhancements

### Step 2.1: Add Notification Type Filtering

**File:** `src/app/notifications/notifications.page.ts`

**Add Segment Filter:**

```typescript
export class NotificationsPage implements OnInit, OnDestroy {
  // ... existing properties ...
  selectedSegment: string = "all";
  filteredNotifications: Notification[] = [];

  ngOnInit() {
    // ... existing code ...

    // Watch for notifications change and apply filter
    this.notificationService.notifications$.pipe(takeUntil(this.destroy$)).subscribe((notifications) => {
      this.notifications = notifications;
      this.applyFilter();
    });
  }

  /**
   * Handle segment change
   */
  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
    this.applyFilter();
  }

  /**
   * Apply filter based on selected segment
   */
  private applyFilter() {
    switch (this.selectedSegment) {
      case "reminders":
        this.filteredNotifications = this.notifications.filter((n) => n.type === "booking_reminder");
        break;
      case "confirmations":
        this.filteredNotifications = this.notifications.filter((n) => n.type === "booking_confirmation");
        break;
      case "all":
      default:
        this.filteredNotifications = this.notifications;
        break;
    }
  }
}
```

**File:** `src/app/notifications/notifications.page.html`

**Add Segment Toolbar:**

```html
<ion-content>
  <!-- Segment Filter -->
  <ion-segment [(ngModel)]="selectedSegment" (ionChange)="segmentChanged($event)" mode="md">
    <ion-segment-button value="all">
      <ion-label>All</ion-label>
    </ion-segment-button>
    <ion-segment-button value="reminders">
      <ion-label>Reminders</ion-label>
    </ion-segment-button>
    <ion-segment-button value="confirmations">
      <ion-label>Confirmations</ion-label>
    </ion-segment-button>
  </ion-segment>

  <!-- Use filteredNotifications instead of notifications -->
  <ion-list *ngIf="!loading && filteredNotifications.length > 0">
    <ion-item *ngFor="let notification of filteredNotifications" ...>
      <!-- ... existing item content ... -->
    </ion-item>
  </ion-list>

  <!-- Update empty state to show when filtered list is empty -->
  <div *ngIf="!loading && filteredNotifications.length === 0" class="empty-state">
    <ion-icon name="notifications-off-outline"></ion-icon>
    <h3>No {{ selectedSegment === 'all' ? '' : selectedSegment }} Notifications</h3>
    <p>You're all caught up!</p>
  </div>
</ion-content>
```

---

### Step 2.2: Add Type-Specific Icons

**File:** `src/app/notifications/notifications.page.html`

**Update Item Template:**

```html
<ion-item *ngFor="let notification of filteredNotifications" (click)="markAsRead(notification)" [class.unread]="!notification.read && notification.is_read === 0" button detail="false">
  <!-- Type-Specific Icon -->
  <ion-icon slot="start" [name]="getNotificationIcon(notification.type)" [color]="getNotificationColor(notification.type)" size="large"> </ion-icon>

  <!-- Content -->
  <ion-label>
    <h2>{{ notification.title }}</h2>
    <p>{{ notification.message }}</p>
    <p class="timestamp">
      <ion-icon name="time-outline" size="small"></ion-icon>
      {{ timeAgo(notification.createdAt) }}
    </p>
  </ion-label>

  <!-- Unread Badge -->
  <ion-badge *ngIf="!notification.read && notification.is_read === 0" color="primary" slot="end"> New </ion-badge>
</ion-item>
```

**File:** `src/app/notifications/notifications.page.ts`

**Add Icon Helper Methods:**

```typescript
/**
 * Get icon based on notification type
 */
getNotificationIcon(type?: string): string {
  switch (type) {
    case 'booking_reminder':
      return 'calendar-outline';
    case 'booking_confirmation':
      return 'checkmark-circle-outline';
    case 'booking_cancelled':
      return 'close-circle-outline';
    case 'payment_received':
      return 'cash-outline';
    default:
      return 'notifications-outline';
  }
}

/**
 * Get color based on notification type
 */
getNotificationColor(type?: string): string {
  switch (type) {
    case 'booking_reminder':
      return 'warning';
    case 'booking_confirmation':
      return 'success';
    case 'booking_cancelled':
      return 'danger';
    case 'payment_received':
      return 'tertiary';
    default:
      return 'medium';
  }
}
```

---

### Step 2.3: Improve Styling

**File:** `src/app/notifications/notifications.page.scss`

```scss
ion-content {
  --background: #f5f5f5;
}

// Segment styling
ion-segment {
  margin: 16px;
  --background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

ion-segment-button {
  --indicator-color: #2d5016;
  --color-checked: #ffffff;
  font-weight: 500;
}

// Notification list
ion-list {
  background: transparent;
  padding: 0 8px;
}

ion-item {
  --background: #ffffff;
  --border-radius: 12px;
  margin-bottom: 12px;
  --padding-start: 16px;
  --padding-end: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:active {
    transform: scale(0.98);
  }

  &.unread {
    --background: #f3fdf8;
    border-left: 4px solid #2d5016;
  }
}

// Icon styling
ion-icon[slot="start"] {
  margin-right: 16px;
}

// Label styling
ion-label {
  h2 {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
  }

  p {
    font-size: 14px;
    color: #666;
    line-height: 1.4;
  }

  .timestamp {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #999;
    margin-top: 8px;

    ion-icon {
      font-size: 14px;
    }
  }
}

// Badge styling
ion-badge {
  --padding-top: 4px;
  --padding-bottom: 4px;
  --padding-start: 8px;
  --padding-end: 8px;
  font-size: 11px;
  font-weight: 600;
}

// Empty state
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
  padding: 20px;

  ion-icon {
    font-size: 80px;
    color: #ccc;
    margin-bottom: 16px;
  }

  h3 {
    font-size: 20px;
    font-weight: 600;
    color: #666;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: #999;
  }
}

// Loading state
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;

  ion-spinner {
    width: 40px;
    height: 40px;
    margin-bottom: 16px;
  }

  p {
    color: #666;
    font-size: 14px;
  }
}

// Back button
.back-button {
  --background: #2d5016;
  --border-radius: 50%;
  width: 36px;
  height: 36px;
  margin-left: 8px;

  ion-icon {
    color: white;
  }
}
```

---

### Step 2.4: Add Haptic Feedback (Optional)

**Install Capacitor Haptics:**

```bash
cd /home/arya020595/Documents/work/rural-tourism-new/rural-tourism-frontend
npm install @capacitor/haptics
npx cap sync
```

**File:** `src/app/services/notification.service.ts`

**Add Vibration on New Notification:**

```typescript
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export class NotificationService implements OnDestroy {
  // ... existing code ...

  private previousUnreadCount = 0;

  startPolling(userId: string): void {
    // ... existing polling code ...

    this.pollingSubscription = interval(this.POLL_INTERVAL)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.getUnreadCount(userId)),
        tap((count) => {
          // Trigger haptic feedback if count increased
          if (count > this.previousUnreadCount) {
            this.triggerNotificationAlert();
          }

          this.previousUnreadCount = count;
          this.unreadCountSubject.next(count);
        }),
        catchError((error) => {
          console.error("[NotificationService] Polling error:", error);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  /**
   * Trigger haptic feedback for new notification
   */
  private async triggerNotificationAlert() {
    try {
      // Vibrate device
      await Haptics.impact({ style: ImpactStyle.Medium });

      // Optional: Play notification sound
      // const audio = new Audio('assets/sounds/notification.mp3');
      // audio.play();

      console.log("[NotificationService] New notification alert triggered");
    } catch (error) {
      console.log("[NotificationService] Haptics not available:", error);
      // Haptics may not be available in browser
    }
  }
}
```

---

## Phase 3: Testing & Validation

### Step 3.1: Unit Test Notification Service

**File:** `src/app/services/notification.service.spec.ts`

```typescript
import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { NotificationService } from "./notification.service";
import { environment } from "src/environments/environment";

describe("NotificationService", () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationService],
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);

    // Mock localStorage
    let store: { [key: string]: string } = {};
    spyOn(localStorage, "getItem").and.callFake((key: string) => store[key]);
    spyOn(localStorage, "setItem").and.callFake((key: string, value: string) => {
      store[key] = value;
    });
    store["token"] = "mock-token";
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should get unread count", (done) => {
    const mockResponse = { success: true, data: { count: 5 } };

    service.getUnreadCount("123").subscribe((count) => {
      expect(count).toBe(5);
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/notifications/operator/123/unread-count`);
    expect(req.request.method).toBe("GET");
    expect(req.request.headers.get("Authorization")).toBe("Bearer mock-token");
    req.flush(mockResponse);
  });

  it("should return 0 on error", (done) => {
    service.getUnreadCount("123").subscribe((count) => {
      expect(count).toBe(0);
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/notifications/operator/123/unread-count`);
    req.error(new ErrorEvent("Network error"));
  });

  it("should emit unread count updates", (done) => {
    service.unreadCount$.subscribe((count) => {
      if (count === 3) {
        done();
      }
    });

    // Simulate polling by manually calling getUnreadCount
    service.getUnreadCount("123").subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/notifications/operator/123/unread-count`);
    req.flush({ success: true, data: { count: 3 } });
  });

  it("should mark notification as read and decrement count", (done) => {
    // Set initial count
    service["unreadCountSubject"].next(5);

    service.markAsRead(1).subscribe(() => {
      service.unreadCount$.subscribe((count) => {
        expect(count).toBe(4);
        done();
      });
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/notifications/1/read`);
    expect(req.request.method).toBe("PATCH");
    req.flush({ success: true });
  });

  it("should mark all as read and reset count", (done) => {
    service["unreadCountSubject"].next(10);

    service.markAllAsRead("123").subscribe(() => {
      service.unreadCount$.subscribe((count) => {
        expect(count).toBe(0);
        done();
      });
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/notifications/operator/123/read-all`);
    expect(req.request.method).toBe("PATCH");
    req.flush({ success: true });
  });
});
```

**Run Tests:**

```bash
npm test -- --include='**/notification.service.spec.ts'
```

---

### Step 3.2: E2E Test

**File:** `e2e/notification-reminder.test.js`

```javascript
const puppeteer = require("puppeteer");

describe("Notification Reminder Flow", () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 50,
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it("should display notification badge after login", async () => {
    // Navigate to login page
    await page.goto("http://localhost:8100/login");

    // Fill login form
    await page.type('input[name="username"]', "operator@test.com");
    await page.type('input[name="password"]', "password123");
    await page.click('ion-button[type="submit"]');

    // Wait for navigation to home
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    // Wait for polling to start (initial load)
    await page.waitForTimeout(2000);

    // Check if badge exists
    const badge = await page.$("ion-badge.notification-badge");
    expect(badge).toBeTruthy();

    // Get badge count
    const count = await page.$eval("ion-badge.notification-badge", (el) => el.textContent);
    expect(parseInt(count)).toBeGreaterThanOrEqual(0);
  });

  it("should navigate to notifications page on bell click", async () => {
    // Click bell icon
    await page.click(".notification-button");

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    // Verify URL
    const url = await page.url();
    expect(url).toContain("/notifications");

    // Verify page title
    const title = await page.$eval("ion-title", (el) => el.textContent);
    expect(title).toBe("Notifications");
  });

  it("should mark notification as read on click", async () => {
    // Get initial unread count
    const initialCount = await page.$eval("ion-badge", (el) => parseInt(el.textContent));

    // Click first notification
    const firstNotification = await page.$("ion-item");
    await firstNotification.click();

    // Wait for API call
    await page.waitForTimeout(1000);

    // Navigate back to notifications
    await page.goto("http://localhost:8100/notifications");
    await page.waitForTimeout(1000);

    // Check if count decreased
    const newCount = await page.$eval("ion-badge", (el) => parseInt(el.textContent));
    expect(newCount).toBe(initialCount - 1);
  });

  it("should update badge automatically via polling", async () => {
    // Create test booking via API (requires backend running)
    const response = await page.evaluate(async () => {
      const res = await fetch("http://localhost:3000/api/booking-activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          tourist_user_id: 1,
          operator_activity_id: 1,
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          time: "09:00",
          total_price: 100,
          no_of_pax: 2,
          status: "confirmed",
        }),
      });
      return res.ok;
    });

    expect(response).toBe(true);

    // Trigger scheduler manually (backend)
    await page.evaluate(async () => {
      await fetch("http://localhost:3000/api/test/trigger-scheduler", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    });

    // Wait for next polling cycle (60 seconds + buffer)
    await page.waitForTimeout(65000);

    // Check if badge count increased
    const badge = await page.$("ion-badge.notification-badge");
    expect(badge).toBeTruthy();
  });
});
```

**Run E2E Tests:**

```bash
npm run e2e -- notification-reminder.test.js
```

---

### Step 3.3: Manual Testing Checklist

**Pre-Test Setup:**

1. Backend server running with scheduler enabled
2. Database has test bookings 3 days in future
3. Test operator account with valid credentials

**Test Cases:**

- [ ] **TC1: Login and Polling Start**
  - Login as operator
  - Check browser console for: `[NotificationService] Starting notification polling`
  - Verify no errors in console

- [ ] **TC2: Initial Badge Display**
  - After login, verify bell icon shows badge with correct count
  - Count should match unread notifications in database

- [ ] **TC3: Automatic Polling Update**
  - Wait 60 seconds (one polling cycle)
  - Verify badge updates if new notifications created
  - Check network tab for GET request to `/api/notifications/operator/:uid/unread-count`

- [ ] **TC4: Click Notification**
  - Navigate to notifications page
  - Click unread notification
  - Verify badge count decrements by 1
  - Verify navigation to booking detail (if `related_id` exists)

- [ ] **TC5: Mark All as Read**
  - Click "Mark all as read" button
  - Verify badge disappears
  - Verify all notifications show as read

- [ ] **TC6: Pull to Refresh**
  - Pull down on notifications page
  - Verify refresh animation
  - Verify notifications reload

- [ ] **TC7: Logout and Polling Stop**
  - Logout from app
  - Check console for: `[NotificationService] Stopping notification polling`
  - Verify no more API calls in network tab

- [ ] **TC8: Page Refresh Persistence**
  - Login and wait for badge to appear
  - Refresh browser (F5)
  - Verify polling restarts automatically
  - Verify badge reappears with correct count

- [ ] **TC9: Type Filtering (if implemented)**
  - Navigate to notifications page
  - Switch between "All", "Reminders", "Confirmations" segments
  - Verify list filters correctly

- [ ] **TC10: Mobile App (Android)**
  - Build APK and install on device
  - Login and verify polling works
  - Lock screen and unlock after 2 minutes
  - Verify polling resumes (badge updates)

---

## Deployment Guide

### Step 4.1: Build Configuration

**File:** `src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: "https://api.ruraltourismsabah.com/api", // Replace with actual production URL
  notificationPollingInterval: 60000, // 60 seconds
  enableNotificationSound: false,
  enableHapticFeedback: true,
};
```

**File:** `src/environments/environment.ts` (development)

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000/api",
  notificationPollingInterval: 30000, // 30 seconds for faster testing
  enableNotificationSound: false,
  enableHapticFeedback: true,
};
```

**Update Service to Use Environment Config:**

```typescript
import { environment } from "src/environments/environment";

export class NotificationService {
  private readonly POLL_INTERVAL = environment.notificationPollingInterval || 60000;
}
```

---

### Step 4.2: Build for Production

**Web Build:**

```bash
cd /home/arya020595/Documents/work/rural-tourism-new/rural-tourism-frontend
ionic build --prod
```

**Android Build:**

```bash
# Sync Capacitor
npx cap sync android

# Build APK
npm run android:apk

# Or build AAB for Play Store
npm run android:release
```

**Verify Build Output:**

```bash
ls -lh www/  # Should see index.html, main.js, polyfills.js, etc.
```

---

### Step 4.3: Deployment Checklist

- [ ] Environment variables configured correctly
- [ ] API URL points to production backend
- [ ] HTTPS enabled on backend (required for production)
- [ ] CORS configured on backend to allow frontend domain
- [ ] All tests passing
- [ ] No console errors in production build
- [ ] Service worker updated (if using PWA)
- [ ] Performance testing completed
- [ ] Mobile app signed with release certificate

---

## Troubleshooting

### Issue 1: Badge Not Updating

**Symptoms:**

- Bell icon shows 0 even though notifications exist
- Console shows "Unread count: 0"

**Diagnosis:**

```javascript
// In browser console
localStorage.getItem("uid");
localStorage.getItem("token");
```

**Solutions:**

1. Verify user ID exists in localStorage
2. Check backend API returns correct count:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/notifications/operator/123/unread-count
   ```
3. Verify polling is active:
   - Check console for `[NotificationService] Starting notification polling`
   - Check network tab for periodic GET requests

---

### Issue 2: Polling Not Starting

**Symptoms:**

- No polling logs in console
- No API calls in network tab

**Diagnosis:**

```typescript
// Add to app.component.ts ngOnInit
console.log("Current user:", await this.authService.currentUser$.toPromise());
```

**Solutions:**

1. Ensure `startPolling()` is called after login
2. Check `NODE_ENV !== 'test'` condition not blocking in dev
3. Verify `uid` is not null/undefined
4. Check for JavaScript errors preventing service initialization

---

### Issue 3: Memory Leak

**Symptoms:**

- App slows down over time
- Browser tab uses excessive memory

**Diagnosis:**

```bash
# Chrome DevTools > Memory > Take heap snapshot
# Look for detached DOM nodes or retained listeners
```

**Solutions:**

1. Ensure all components implement `ngOnDestroy`:
   ```typescript
   ngOnDestroy() {
     this.destroy$.next();
     this.destroy$.complete();
   }
   ```
2. Verify `takeUntil(destroy$)` on all subscriptions
3. Call `stopPolling()` on logout
4. Limit polling interval (don't go below 30 seconds)

---

### Issue 4: CORS Errors

**Symptoms:**

```
Access to XMLHttpRequest at 'http://localhost:3000/api/notifications'
from origin 'http://localhost:8100' has been blocked by CORS policy
```

**Solutions:**

**Backend (server.js):**

```javascript
const cors = require("cors");

app.use(
  cors({
    origin: ["http://localhost:8100", "http://localhost:4200", "https://your-production-domain.com"],
    credentials: true,
  }),
);
```

---

### Issue 5: Polling Too Frequent (Performance)

**Symptoms:**

- High server load
- Excessive API calls
- Battery drain on mobile

**Solutions:**

1. Increase polling interval:
   ```typescript
   private readonly POLL_INTERVAL = 120000; // 2 minutes
   ```
2. Add exponential backoff on errors:
   ```typescript
   catchError((error) => {
     this.currentInterval = this.currentInterval * 2; // Double interval on error
     return EMPTY;
   });
   ```
3. Pause polling when app is in background (mobile):

   ```typescript
   import { App } from "@capacitor/app";

   App.addListener("appStateChange", ({ isActive }) => {
     if (isActive) {
       this.resumePolling();
     } else {
       this.pausePolling();
     }
   });
   ```

---

## Summary

This frontend implementation enables real-time notification updates via polling with:

1. ✅ Automatic polling every 60 seconds
2. ✅ Reactive state management with RxJS
3. ✅ Bell icon badge updates across all pages
4. ✅ Pull-to-refresh support
5. ✅ Type-based filtering (optional)
6. ✅ Deep linking to booking details
7. ✅ Haptic feedback (optional)
8. ✅ Memory leak prevention
9. ✅ Comprehensive error handling

**Next Steps:**

- Complete backend implementation (see BOOKING_REMINDER_NOTIFICATION_BACKEND.md)
- Deploy to staging environment for integration testing
- Gather user feedback
- Plan push notification enhancement (Firebase/FCM)

**Estimated Implementation Time:** 6-10 hours (including testing)

---

_Last Updated: May 7, 2026_

---

## Update — May 18, 2026: Notification UX & Bell Badge Fixes

### Shared Component Architecture

The bell icon and panel were centralized into two shared components instead of being duplicated on each page:

- **`app-notification-bell`** (`src/app/_shared/notification-panel/notification-bell.component.ts`) — the yellow bell button with red badge. Goes inside `<ion-buttons slot="end">`. Takes an `@Input() panel` reference to the panel component.
- **`app-notification-panel`** (`src/app/_shared/notification-panel/notification-panel.component.ts`) — the slide-in desktop panel. Placed at page root outside `<ion-buttons>`.

Usage pattern on every operator page:
```html
<ion-buttons slot="end">
  <app-notification-bell [panel]="notifPanel"></app-notification-bell>
</ion-buttons>
<app-notification-panel #notifPanel></app-notification-panel>
```

Both are declared and exported from `SharedModule`. All 11 operator pages use this pattern.

### Bell Badge Polling — Race Condition Fixed (`app.component.ts`)

Previously `startNotificationPolling()` read `uid` from `localStorage` immediately on app start. If `refreshSession()` hadn't resolved yet, or the component was reading before auth was confirmed, the badge would not appear until the panel was opened.

**Fix:** Poll only after `AuthService.isAuthenticated$` emits `true`, which fires after `refreshSession()` completes:

```typescript
this.authService.isAuthenticated$
  .pipe(
    distinctUntilChanged(),
    filter((authenticated) => authenticated),
    switchMap(() => {
      const uid = this.authService.getUserId();
      if (!uid) return [];
      this.notificationService.getUnreadCount(uid).subscribe(); // immediate
      return interval(60_000).pipe(
        switchMap(() => this.notificationService.getUnreadCount(uid)),
      );
    }),
  )
  .subscribe();
```

### Badge Stays Red Until Explicitly Dismissed

Previously `toggle()` called `markAllAsRead()` the moment the panel opened, clearing the badge before the user read anything. This was removed. The badge now decrements only when:
- A single notification is clicked (`markAsRead`)
- The "Mark all read" button is clicked (`markAllAsRead`)

### "Mark all read" Button

- **Desktop panel**: text link in the header row next to "Notifications", visible only when `hasUnread` is true.
- **Mobile page**: full-width green button fixed at the bottom of the screen (`position: sticky; bottom: 0`), hidden when all notifications are read.

### Company Logo — Offline Caching (IndexedDB)

Company logos are stored in IndexedDB (`rt-assets` DB, `logos` object store, keyed by `company_id`) via `StorageService.setCompanyLogo / getCompanyLogo`. This avoids the 5 MB `localStorage` quota limit that base64 logo strings would breach (`QuotaExceededError`).

Both `NotificationPanelComponent` and `NotificationsPage` use the same pattern:
1. Read from IndexedDB immediately (instant, works offline)
2. Fetch fresh from network
3. Update IndexedDB cache

`AuthService.syncUserProfile()` strips `operator_logo_image` from the company object before persisting to `localStorage` to prevent the quota error.

### Mobile Notifications Page Fixes

- **Back button**: changed from `navCtrl.navigateForward('/home', {animationDirection: 'back'})` to `navCtrl.back()` so the OS back stack is respected.
- **Company logo**: replaced hardcoded Feel Sabah logo with dynamic logo loaded from IndexedDB / network (same pattern as panel).
- **Auto-close panel on navigation**: `NotificationPanelComponent` subscribes to `NavigationStart` router events and resets `isOpen = false` to prevent stale open state when navigating to `/notifications` on mobile.
