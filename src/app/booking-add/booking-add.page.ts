import { Component, OnInit } from '@angular/core';
import { MenuController, NavController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { MenuItem, MenuService } from '../services/menu.service';

@Component({
  selector: 'app-booking-add',
  templateUrl: './booking-add.page.html',
  styleUrls: ['./booking-add.page.scss'],
})
export class BookingAddPage implements OnInit {
  user: any = null;
  menuItems: MenuItem[] = [];

  selectedType = 'activity';
  selectedNationality = 'domestic';

  constructor(
    private menuCtrl: MenuController,
    private navCtrl: NavController,
    private menuService: MenuService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadUser();
  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, 'booking-add-menu');
    this.loadUser();
  }

  onMenuItemTap(_item: MenuItem): void {
    this.menuCtrl.close('booking-add-menu');
  }

  logOut(): void {
    this.authService.logout('/login');
    this.user = null;
    this.menuCtrl.enable(false, 'booking-add-menu');
    this.menuCtrl.close('booking-add-menu');
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.navCtrl.back();
      return;
    }

    this.navCtrl.navigateBack('/booking-home', { replaceUrl: true });
  }

  private loadUser(): void {
    const rawUser = localStorage.getItem('user');
    this.user = this.authService.currentUser;

    if (!this.user && rawUser) {
      try {
        this.user = JSON.parse(rawUser);
      } catch {
        this.user = null;
      }
    }

    this.menuItems = this.menuService.getVisibleMenuItemsForContext('operator');
  }
}
