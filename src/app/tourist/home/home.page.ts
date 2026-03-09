import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  MenuController,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { CalendarModal, CalendarModalOptions } from 'ion7-calendar';
import { environment } from '../../../environments/environment';
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
  newBookingCount: number = 0;

  // Search and filter
  searchQuery: string = '';
  filteredActivities: any[] = [];
  filteredAccommodations: any[] = [];
  startDate: string = '';
  endDate: string = '';
  showDateFilter: boolean = false;
  private hasShownDevAlert = false;

  constructor(
    private apiService: ApiService,
    private menu: MenuController,
    private router: Router,
    private toastController: ToastController,
    private modalCtrl: ModalController,
    private alertController: AlertController,
  ) {}

  ngOnInit() {
    this.loadUser();
    this.loadActivities();
    this.loadAccommodations();
    this.loadNewBookingCount();
  }

  ionViewWillEnter() {
    this.loadUser();
    this.menu.enable(true, 'mainMenu');
    this.showUnderDevelopmentAlert();
    this.hasShownDevAlert = true;
    this.loadNewBookingCount();
  }

  async showUnderDevelopmentAlert() {
    const alert = await this.alertController.create({
      header: '⚠️ Under Development',
      message:
        'Rural Tourism is currently still under development. Thank you for your understanding',
      buttons: ['OK'],
      backdropDismiss: false,
    });

    await alert.present();
  }

  async showFeatureUnavailableToast() {
    const toast = await this.toastController.create({
      message: 'This feature is not available yet.',
      duration: 2000,
      position: 'bottom',
      icon: 'alert-circle-outline',
      color: 'warning',
    });

    await toast.present();
  }

  loadUser() {
    const userData = localStorage.getItem('user');
    if (!userData) {
      this.user = null;
      return;
    }

    try {
      this.user = JSON.parse(userData);

      // ✅ Log full details
      console.log('Logged-in Tourist Details:', this.user);
      console.table(this.user); // nice tabular view in console
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

  goToAccommodationDetails(accomId: any) {
    if (!accomId) {
      console.error('Accommodation ID is undefined!', accomId);
      return;
    }
    this.router.navigate(['/tourist/accommodation-detail', accomId]);
  }

  /**
   * Get image URL for any resource type
   * @param imagePath - The image path or filename
   * @param folder - The folder name (activities, accommodations, operator-activities)
   */
  getImageUrl(imagePath: string, folder: string = 'activities'): string {
    return this.buildImageUrl(imagePath, folder);
  }

  get suggestedActivities() {
    return this.filteredActivities.filter(
      (activity) =>
        [true, 1, '1'].includes(activity.show_in_suggestions) ||
        [true, 1, '1'].includes(activity.showInSuggestions),
    );
  }

  onSearchChange(event: any) {
    const query = event.detail.value?.toLowerCase() || '';
    this.searchQuery = query;
    this.applyFilters();
  }

  onSearchInputChange(event: any) {
    const query = event.target.value?.toLowerCase() || '';
    this.searchQuery = query;
    this.applyFilters();
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  clearDateFilter(event: Event) {
    event.stopPropagation();
    this.startDate = '';
    this.endDate = '';
    this.showDateFilter = false;
    this.applyFilters();
  }

  async toggleDateFilter() {
    const currentYear = new Date().getFullYear();
    const options: CalendarModalOptions = {
      pickMode: 'range',
      title: 'Select Date Range',
      color: 'primary',
      defaultScrollTo: new Date(),
      from: new Date(currentYear - 1, 0, 1), // 1 year ago
      to: new Date(currentYear + 5, 11, 31), // 5 years ahead
      closeLabel: 'Cancel',
      doneLabel: 'Done',
    };

    const modal = await this.modalCtrl.create({
      component: CalendarModal,
      componentProps: { options },
    });

    await modal.present();

    const result = await modal.onDidDismiss();
    if (result.data) {
      const dateRange: any = result.data;
      if (dateRange.from && dateRange.to) {
        this.startDate = new Date(dateRange.from.time).toISOString();
        this.endDate = new Date(dateRange.to.time).toISOString();
        this.showDateFilter = true;
        this.applyFilters();
      }
    }
  }

  clearFilters() {
    this.searchQuery = '';
    this.startDate = '';
    this.endDate = '';
    this.showDateFilter = false;
    this.applyFilters();
  }

  private applyFilters() {
    // Filter activities
    this.filteredActivities = this.activities.filter((activity) => {
      const matchesSearch =
        !this.searchQuery ||
        activity.activity_name?.toLowerCase().includes(this.searchQuery);

      const matchesDate =
        (!this.startDate && !this.endDate) ||
        this.isActivityAvailableInRange(activity, this.startDate, this.endDate);

      return matchesSearch && matchesDate;
    });

    // Filter accommodations
    this.filteredAccommodations = this.accommodations.filter((accom) => {
      const matchesSearch =
        !this.searchQuery ||
        accom.name?.toLowerCase().includes(this.searchQuery);

      const matchesDate =
        (!this.startDate && !this.endDate) ||
        this.isAccommodationAvailableInRange(
          accom,
          this.startDate,
          this.endDate,
        );

      return matchesSearch && matchesDate;
    });
  }

  private isActivityAvailableInRange(
    activity: any,
    startDate: string,
    endDate: string,
  ): boolean {
    // If no dates provided, show all
    if (!startDate && !endDate) return true;

    // Check if activity has available_dates from operator_activities
    if (
      activity.available_dates &&
      Array.isArray(activity.available_dates) &&
      activity.available_dates.length > 0
    ) {
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);
      filterStart.setHours(0, 0, 0, 0);
      filterEnd.setHours(23, 59, 59, 999);

      // Check if any of the available dates fall within the selected range
      return activity.available_dates.some((entry: any) => {
        try {
          // Handle both plain date strings and objects {date, time, price}
          const dateStr = typeof entry === 'string' ? entry : entry?.date;
          if (!dateStr) return false;
          const availableDate = new Date(dateStr);
          availableDate.setHours(0, 0, 0, 0);
          return availableDate >= filterStart && availableDate <= filterEnd;
        } catch {
          return false;
        }
      });
    }

    // Fallback: if no available_dates, don't show in filtered results
    return false;
  }

  private isAccommodationAvailableInRange(
    accom: any,
    startDate: string,
    endDate: string,
  ): boolean {
    // If no dates provided, show all
    if (!startDate && !endDate) return true;

    // Check if accommodation has available_dates for proper availability filtering
    if (
      accom.available_dates &&
      Array.isArray(accom.available_dates) &&
      accom.available_dates.length > 0
    ) {
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);
      filterStart.setHours(0, 0, 0, 0);
      filterEnd.setHours(23, 59, 59, 999);

      return accom.available_dates.some((entry: any) => {
        try {
          // Handle both plain date strings and objects {date, price}
          const dateStr = typeof entry === 'string' ? entry : entry?.date;
          if (!dateStr) return false;
          const availableDate = new Date(dateStr);
          availableDate.setHours(0, 0, 0, 0);
          return availableDate >= filterStart && availableDate <= filterEnd;
        } catch {
          return false;
        }
      });
    }

    // Fallback: if no available_dates and date filter is applied, hide accommodation
    // This ensures only accommodations with matching available dates are shown
    return false;
  }

  private loadActivities() {
    this.apiService.getAllActivityMasterData().subscribe({
      next: (response: any) => {
        this.activities = response.data || response;
        this.filteredActivities = [...this.activities];
      },
      error: (err) => {
        if (!environment.production) {
          console.error('Failed to load activities:', err);
        }
      },
    });
  }

  private loadAccommodations() {
    this.apiService.getAllAccommodations().subscribe({
      next: (response: any) => {
        this.accommodations = response.data || response;
        this.filteredAccommodations = [...this.accommodations];
      },
      error: (err) => {
        if (!environment.production) {
          console.error('Failed to load accommodations:', err);
        }
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

    return `${environment.API}/uploads/${folder}/${imagePath}`;
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

  // Load new booking count from localStorage
  private loadNewBookingCount() {
    const count = localStorage.getItem('newBookingCount');
    this.newBookingCount = count ? parseInt(count, 10) : 0;
  }

  // Reset booking count (called when user visits Booking page)
  resetNewBookingCount() {
    this.newBookingCount = 0;
    localStorage.setItem('newBookingCount', '0');
  }

  // Call this from booking success page
  incrementNewBookingCount() {
    this.newBookingCount = (this.newBookingCount || 0) + 1;
    localStorage.setItem('newBookingCount', this.newBookingCount.toString());
  }
}
