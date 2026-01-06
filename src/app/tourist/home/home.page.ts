import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  MenuController,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { CalendarModal, CalendarModalOptions } from 'ion7-calendar';
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

  getImageSource(imagePath: string): string {
    return this.buildImageUrl(imagePath, 'activities');
  }

  getAccommodationImage(imagePath: string): string {
    return this.buildImageUrl(imagePath, 'accommodations');
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
    const options: CalendarModalOptions = {
      pickMode: 'range',
      title: 'Select Date Range',
      color: 'primary',
      defaultScrollTo: new Date(),
      from: new Date(2020, 0, 1),
      to: new Date(2030, 11, 31),
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

    console.log(
      'Checking activity:',
      activity.activity_name,
      'available_dates:',
      activity.available_dates
    );

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

      console.log('Filter range:', filterStart, 'to', filterEnd);

      // Check if any of the available dates fall within the selected range
      const result = activity.available_dates.some((dateStr: string) => {
        try {
          const availableDate = new Date(dateStr);
          availableDate.setHours(0, 0, 0, 0);
          const isInRange =
            availableDate >= filterStart && availableDate <= filterEnd;
          console.log(
            '  Date:',
            dateStr,
            '→',
            availableDate,
            'inRange:',
            isInRange
          );
          return isInRange;
        } catch (error) {
          console.error('Error parsing available date:', dateStr, error);
          return false;
        }
      });

      console.log('Activity', activity.activity_name, 'matches:', result);
      return result;
    }

    // Fallback: if no available_dates, don't show in filtered results
    console.log('Activity', activity.activity_name, 'has no available_dates');
    return false;
  }

  private isAccommodationAvailableInRange(
    accom: any,
    startDate: string,
    endDate: string
  ): boolean {
    // If no dates provided, show all
    if (!startDate && !endDate) return true;

    // Filter based on createdAt or created_at (support both formats)
    const createdAtValue = accom.createdAt || accom.created_at;
    if (createdAtValue) {
      const createdDate = new Date(createdAtValue);
      createdDate.setHours(0, 0, 0, 0); // Reset time to start of day

      if (startDate && endDate) {
        const filterStart = new Date(startDate);
        const filterEnd = new Date(endDate);
        filterStart.setHours(0, 0, 0, 0);
        filterEnd.setHours(23, 59, 59, 999);
        // Check if createdAt is within the date range
        return createdDate >= filterStart && createdDate <= filterEnd;
      } else if (startDate) {
        const filterStart = new Date(startDate);
        filterStart.setHours(0, 0, 0, 0);
        return createdDate >= filterStart;
      } else if (endDate) {
        const filterEnd = new Date(endDate);
        filterEnd.setHours(23, 59, 59, 999);
        return createdDate <= filterEnd;
      }
    }

    return true;
  }

  private loadActivities() {
    this.apiService.getAllActivityMasterData().subscribe({
      next: (response: any) => {
        this.activities = response.data || response;
        console.log('Loaded activities with available_dates:', this.activities);
        this.filteredActivities = [...this.activities];
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
        this.filteredAccommodations = [...this.accommodations];
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
