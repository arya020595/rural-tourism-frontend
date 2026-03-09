import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class AssociationDashboardPage implements OnInit {
  user: any = null;

  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private toastController: ToastController,
  ) {}

  ngOnInit() {
    this.loadUser();
  }

  ionViewWillEnter() {
    this.loadUser();
  }

  loadUser() {
    const storedUser = localStorage.getItem('association_user');
    this.user = storedUser ? JSON.parse(storedUser) : null;

    if (!this.user) {
      this.router.navigate(['/role']);
    }
  }

  closeMenu() {
    this.menuCtrl.close();
  }

  async logOut() {
    localStorage.clear();
    this.user = null;
    this.menuCtrl.close();
    const toast = await this.toastController.create({
      message: 'Logged out successfully',
      duration: 1500,
      position: 'bottom',
      color: 'danger',
    });
    await toast.present();
    this.router.navigate(['/role']);
  }
}
