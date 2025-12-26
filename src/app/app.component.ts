import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(private platform: Platform, private router: Router) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.applyStandaloneClass();

      // Ensure it triggers on every route change
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.applyStandaloneClass();
        }
      });
    });
  }

  ngOnInit() {
  this.platform.ready().then(() => {
    this.applyStandaloneClass();
    console.log('Standalone?', window.matchMedia('(display-mode: standalone)').matches);
    console.log('navigator.standalone?', (window.navigator as any).standalone);
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
