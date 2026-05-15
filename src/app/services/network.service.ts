import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Network } from '@capacitor/network';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  private _isOnline$ = new BehaviorSubject<boolean>(true);

  readonly isOnline$: Observable<boolean> = this._isOnline$.asObservable();

  get isOnline(): boolean {
    return this._isOnline$.value;
  }

  async initialize(): Promise<void> {
    const status = await Network.getStatus();
    this._isOnline$.next(status.connected && navigator.onLine);

    Network.addListener('networkStatusChange', (status) => {
      this._isOnline$.next(status.connected && navigator.onLine);
    });

    // navigator.onLine responds to DevTools offline throttling
    window.addEventListener('online', this.onBrowserOnline);
    window.addEventListener('offline', this.onBrowserOffline);
  }

  private onBrowserOnline = (): void => {
    console.log('[NetworkService] browser online event');
    this._isOnline$.next(true);
  };

  private onBrowserOffline = (): void => {
    console.log('[NetworkService] browser offline event');
    this._isOnline$.next(false);
  };

  destroy(): void {
    Network.removeAllListeners();
    window.removeEventListener('online', this.onBrowserOnline);
    window.removeEventListener('offline', this.onBrowserOffline);
  }
}
