import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
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

  // Search and filter
  searchQuery: string = '';
  filteredActivities: any[] = [];
  filteredAccommodations: any[] = [];
  startDate: string = '';
  endDate: string = '';
  showDateFilter: boolean = false;

  constructor(
    private apiService: ApiService,
    private menu: MenuController,
    private router: Router,
    private toastController: ToastController,
    private modalCtrl: ModalController
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
        [true, 1, '1'].includes(activity.showInSuggestions)
    );
  }

  onSearchChange(event: any) {
    const query = event.detail.value?.toLowerCase() || '';
    this.searchQuery = query;
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
          this.endDate
        );

      return matchesSearch && matchesDate;
    });
  }

  private isActivityAvailableInRange(
    activity: any,
    startDate: string,
    endDate: string
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
      return activity.available_dates.some((dateStr: string) => {
        try {
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
    endDate: string
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

      return accom.available_dates.some((dateStr: string) => {
        try {
          const availableDate = new Date(dateStr);
          availableDate.setHours(0, 0, 0, 0);
          return availableDate >= filterStart && availableDate <= filterEnd;
        } catch {
          return false;
        }
      });
    }

    // Fallback: if show_availability is enabled, show in results
    // Otherwise, show all accommodations when no availability dates are set
    if (accom.show_availability || accom.showAvailability) {
      return true;
    }

    // Default: show accommodation if no availability data is configured
    return true;
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
}
