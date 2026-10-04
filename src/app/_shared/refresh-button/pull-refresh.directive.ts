import { Directive, HostListener } from '@angular/core';
import { AppRefreshService } from '../../services/app-refresh.service';

/**
 * Pull-to-refresh: put on an ion-refresher, e.g.
 *   <ion-refresher slot="fixed" appPullRefresh>
 *     <ion-refresher-content></ion-refresher-content>
 *   </ion-refresher>
 * Only for list/view pages — on form pages a stray pull would wipe input.
 */
@Directive({
  selector: 'ion-refresher[appPullRefresh]',
})
export class PullRefreshDirective {
  constructor(private appRefresh: AppRefreshService) {}

  @HostListener('ionRefresh', ['$event'])
  async onRefresh(event: CustomEvent): Promise<void> {
    const reloading = await this.appRefresh.refresh();
    if (!reloading) {
      (event.target as HTMLIonRefresherElement).complete();
    }
  }
}
