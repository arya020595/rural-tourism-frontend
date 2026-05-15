import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { AuthService } from './services/auth.service';
import { NetworkService } from './services/network.service';
import { OfflineQueueService } from './services/offline-queue.service';
import { SyncService } from './services/sync.service';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  uid: string | null = null;
  user: any = null;

  constructor(
    private platform: Platform,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private networkService: NetworkService,
    private syncService: SyncService,
    private offlineQueue: OfflineQueueService,
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
    this.uid = localStorage.getItem('uid');

    const storedUser = localStorage.getItem('user');
    this.user = storedUser ? JSON.parse(storedUser) : null;

    if (!this.uid) return;

    this.loadUser();
  }

  private loadUser(): void {
    if (!this.uid) return;

    this.userService.getUserByID(this.uid).subscribe({
      next: (data: any) => {
        this.authService.syncUserProfile(data);
        this.user = this.authService.currentUser || data;
      },
      error: (err: any) => console.error('Error loading user:', err),
    });
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
