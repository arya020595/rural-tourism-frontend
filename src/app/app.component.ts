import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { Subscription, interval } from 'rxjs';
import { distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { InactivityService } from './services/inactivity.service';
import { NetworkService } from './services/network.service';
import { NotificationService } from './services/notification.service';
import { OfflineQueueService } from './services/offline-queue.service';
import { SyncService } from './services/sync.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  uid: string | null = null;
  user: any = null;

  private pollingSub?: Subscription;
  private inactivitySub?: Subscription;

  constructor(
    private platform: Platform,
    private router: Router,
    private authService: AuthService,
    private inactivityService: InactivityService,
    private networkService: NetworkService,
    private syncService: SyncService,
    private offlineQueue: OfflineQueueService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    this.platform.ready().then(async () => {
      const isAvailable = await this.offlineQueue.isAvailable();
      if (isAvailable) {
        await this.networkService.initialize();
        await this.syncService.initialize();
      } else {
        console.warn('IndexedDB unavailable — offline mode disabled');
      }

      this.loadUserData();
      this.startNotificationPolling();
      this.startInactivityTracking();
      this.applyStandaloneClass();

      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.applyStandaloneClass();
        }
      });

      console.log(
        'Standalone?',
        window.matchMedia('(display-mode: standalone)').matches,
      );
      console.log(
        'navigator.standalone?',
        (window.navigator as any).standalone,
      );
    });
  }

  private loadUserData(): void {
    this.uid = this.authService.getUserId();
    this.user = this.authService.currentUser;

    if (!this.authService.isAuthenticated) {
      return;
    }

    this.loadCurrentSessionUser();
  }

  private loadCurrentSessionUser(): void {
    this.authService.refreshSession().subscribe({
      next: () => {
        this.user = this.authService.currentUser;
        this.uid = this.authService.getUserId();
      },
      error: (err: any) => console.error('Error loading session user:', err),
    });
  }

  private startNotificationPolling(): void {
    // Wait for auth to be confirmed (fires immediately if already authenticated,
    // or after refreshSession() resolves on app startup).
    this.pollingSub = this.authService.isAuthenticated$
      .pipe(
        distinctUntilChanged(),
        filter((authenticated) => authenticated),
        switchMap(() => {
          const uid = this.authService.getUserId();
          if (!uid) return [];
          // Fetch immediately, then repeat every 60 seconds
          this.notificationService.getUnreadCount(uid).subscribe();
          return interval(60_000).pipe(
            switchMap(() => this.notificationService.getUnreadCount(uid)),
          );
        }),
      )
      .subscribe();
  }

  private startInactivityTracking(): void {
    this.inactivitySub = this.authService.isAuthenticated$
      .pipe(distinctUntilChanged())
      .subscribe((authenticated) => {
        if (authenticated) {
          this.inactivityService.start();
        } else {
          this.inactivityService.stop();
        }
      });
  }

  ngOnDestroy(): void {
    this.pollingSub?.unsubscribe();
    this.inactivitySub?.unsubscribe();
    this.inactivityService.stop();
  }

  applyStandaloneClass() {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    const indicator = document.getElementById('standalone-indicator');

    if (isStandalone) {
      document.body.classList.add('standalone-app');
      if (indicator) indicator.style.display = 'block';
      console.log('✅ Standalone mode detected');
    } else {
      document.body.classList.remove('standalone-app');
      if (indicator) indicator.style.display = 'none';
      console.warn('❌ Not in standalone mode');
    }
  }
}
