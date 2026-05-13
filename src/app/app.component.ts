import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { AuthService } from './services/auth.service';

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
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.platform.ready().then(() => {
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
