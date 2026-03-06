import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { ApiService } from './services/api.service';

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
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.platform.ready().then(() => {

      this.loadUserData();
      this.applyStandaloneClass();

      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.applyStandaloneClass();
        }
      });

      console.log('Standalone?', window.matchMedia('(display-mode: standalone)').matches);
      console.log('navigator.standalone?', (window.navigator as any).standalone);

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

    this.apiService.getUserByID(this.uid).subscribe({
      next: (data: any) => {
        this.user = data;
        localStorage.setItem('user', JSON.stringify(data));
      },
      error: (err: any) => console.error('Error loading user:', err)
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