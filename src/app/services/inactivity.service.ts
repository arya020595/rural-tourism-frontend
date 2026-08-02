import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'wheel',
];

@Injectable({ providedIn: 'root' })
export class InactivityService implements OnDestroy {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private boundReset = this.reset.bind(this);
  private listening = false;

  constructor(
    private authService: AuthService,
    private ngZone: NgZone,
  ) {}

  start(): void {
    if (this.listening) return;
    this.listening = true;

    // Run outside Angular zone so activity events don't trigger change detection
    this.ngZone.runOutsideAngular(() => {
      for (const event of ACTIVITY_EVENTS) {
        window.addEventListener(event, this.boundReset, { passive: true });
      }
    });

    this.scheduleLogout();
  }

  stop(): void {
    this.clearTimer();

    for (const event of ACTIVITY_EVENTS) {
      window.removeEventListener(event, this.boundReset);
    }

    this.listening = false;
  }

  private reset(): void {
    this.clearTimer();
    this.scheduleLogout();
  }

  private scheduleLogout(): void {
    this.ngZone.runOutsideAngular(() => {
      this.timer = setTimeout(() => {
        this.ngZone.run(() => {
          this.stop();
          this.authService.logout('/login');
        });
      }, INACTIVITY_TIMEOUT_MS);
    });
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
