import { Component, Input } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { AppRefreshService } from '../../services/app-refresh.service';

/**
 * Header button that does what a browser refresh does on the website:
 * pushes any offline-queued bookings to the server, then reloads the app so
 * every page fetches fresh data. See AppRefreshService.
 */
@Component({
  selector: 'app-refresh-button',
  template: `
    <ion-button
      (click)="onRefresh()"
      [disabled]="refreshing"
      class="refresh-button"
      aria-label="Refresh"
    >
      <ion-spinner *ngIf="refreshing" name="crescent" class="refresh-spinner"></ion-spinner>
      <ion-icon *ngIf="!refreshing" slot="icon-only" name="refresh-outline" class="refresh-icon"></ion-icon>
    </ion-button>
  `,
  styles: [`
    :host { display: contents; }
    .refresh-icon { font-size: 24px; color: #fff; }
    .refresh-spinner { width: 22px; height: 22px; color: #fff; }
  `],
})
export class RefreshButtonComponent {
  /** Ask before reloading — use on pages with a form that could hold unsaved input. */
  @Input() confirmReload = false;

  refreshing = false;

  constructor(
    private appRefresh: AppRefreshService,
    private alertController: AlertController,
  ) {}

  async onRefresh(): Promise<void> {
    if (this.confirmReload && !(await this.confirmDiscard())) return;

    this.refreshing = true;
    const reloading = await this.appRefresh.refresh();
    if (!reloading) this.refreshing = false;
  }

  private async confirmDiscard(): Promise<boolean> {
    const alert = await this.alertController.create({
      header: 'Muat Semula / Refresh',
      message:
        'Maklumat yang belum disimpan akan hilang. / Unsaved changes on this page will be lost.',
      buttons: [
        { text: 'Batal / Cancel', role: 'cancel' },
        { text: 'Muat Semula / Refresh', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }
}
