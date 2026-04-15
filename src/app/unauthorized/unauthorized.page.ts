import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.page.html',
  styleUrls: ['./unauthorized.page.scss'],
})
export class UnauthorizedPage {
  constructor(
    private navCtrl: NavController,
    private authService: AuthService,
  ) {}

  goToHome(): void {
    const role = this.authService.getCurrentRole();

    if (role === 'tourist') {
      this.navCtrl.navigateRoot('/tourist/home');
      return;
    }

    if (role === 'association') {
      this.navCtrl.navigateRoot('/association/dashboard');
      return;
    }

    this.navCtrl.navigateRoot('/home');
  }

  switchAccount(): void {
    this.authService.logout('/login');
  }
}
