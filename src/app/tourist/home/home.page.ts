import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  selectedSegment: string = 'activity';
  activities: any[] = [];
  accommodations: any[] = [];
  user: any = null;

  constructor(
    private apiService: ApiService,
    private menu: MenuController,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadUser();
    this.loadActivities();
    this.loadAccommodations();
  }

  ionViewWillEnter() {
    this.loadUser();
    this.menu.enable(true, 'mainMenu');
  }

  loadUser() {
    const userData = localStorage.getItem('user');
    if (!userData) {
      this.user = null;
      return;
    }

    try {
      this.user = JSON.parse(userData);
      if (this.user.tourist_user_id) {
        localStorage.setItem('tourist_user_id', this.user.tourist_user_id);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      this.user = null;
    }
  }

  logOut() {
    localStorage.removeItem('user');
    this.user = null;
    this.showLogoutToast();
    this.menu.close('mainMenu');
    this.router.navigate(['/tourist/home']);
  }

  closeMenu() {
    this.menu.close('mainMenu');
  }

  goToOperatorList(id: string) {
    this.router.navigate(['/tourist/activity-operator-list', id]);
  }

  goToAccommodationDetails(accomId: string) {
    this.router.navigate(['/tourist/accommodation-detail', accomId]);
  }

  getImageSource(imagePath: string): string {
    return this.buildImageUrl(imagePath, 'activities');
  }

  getAccommodationImage(imagePath: string): string {
    return this.buildImageUrl(imagePath, 'accommodations');
  }

  get suggestedActivities() {
    return this.activities.filter(
      (activity) =>
        [true, 1, '1'].includes(activity.show_in_suggestions) ||
        [true, 1, '1'].includes(activity.showInSuggestions)
    );
  }

  private loadActivities() {
    this.apiService.getAllActivityMasterData().subscribe({
      next: (response: any) => {
        this.activities = response.data || response;
      },
      error: (err) => {
        console.error('Failed to load activities:', err);
      },
    });
  }

  private loadAccommodations() {
    this.apiService.getAllAccommodations().subscribe({
      next: (response: any) => {
        this.accommodations = response.data || response;
      },
      error: (err) => {
        console.error('Failed to load accommodations:', err);
      },
    });
  }

  private buildImageUrl(imagePath: string, folder: string): string {
    if (!imagePath) {
      return 'assets/icon/placeholder.png';
    }

    if (
      imagePath.startsWith('assets/') ||
      imagePath.startsWith('http') ||
      imagePath.startsWith('data:image')
    ) {
      return imagePath;
    }

    return `http://localhost:3000/uploads/${folder}/${imagePath}`;
  }

  private async showLogoutToast() {
    const toast = await this.toastController.create({
      message: 'User Logged Out',
      duration: 1500,
      position: 'bottom',
      cssClass: 'error-toast',
      icon: 'alert-circle',
    });
    await toast.present();
  }
}
