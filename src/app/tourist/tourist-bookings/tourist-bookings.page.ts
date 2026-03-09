import { Component, OnInit } from '@angular/core';
import {
  AlertController,
  NavController,
  ToastController,
} from '@ionic/angular';
import { ApiService } from '../../services/api.service';

interface Booking {
  id: string | number;
  type: 'activity' | 'accommodation';
  activityName?: string;
  accommodationName?: string;
  accommodationDisplayName?: string;
  date?: string;
  check_in?: string;
  check_out?: string;
  no_of_pax?: number;
  no_of_rooms?: number;
  total_no_of_nights?: number;
  total_price?: number | string;
  status?: string;
  [key: string]: any; // for backend fields with different names
}

@Component({
  selector: 'app-tourist-bookings',
  templateUrl: './tourist-bookings.page.html',
  styleUrls: ['./tourist-bookings.page.scss'],
})
export class TouristBookingsPage implements OnInit {
  touristId: string = '';
  activityBookings: Booking[] = [];
  accommodationBookings: Booking[] = [];
  loading: boolean = false;
  filterStatus: string = 'all';
  userIsActive: boolean = true; // Tracks if user is active or suspended

  selectedSegment: 'activity' | 'accommodation' = 'activity';

  constructor(
    private apiService: ApiService,
    private toastController: ToastController,
    private navCtrl: NavController,
    private alertController: AlertController,
  ) {}

  ngOnInit() {
    const userData = localStorage.getItem('user');
    if (!userData) {
      this.showToast('Please log in first');
      this.navCtrl.navigateRoot('/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      this.touristId = user.tourist_user_id || '';
      this.userIsActive = user.is_active !== 0; // check backend value

      if (!this.userIsActive) {
        // User already suspended, force logout
        localStorage.removeItem('user');
        localStorage.removeItem('tourist_user_id');
        this.navCtrl.navigateRoot('/login');
        return;
      }

      if (!this.touristId) {
        this.showToast('Invalid user data');
        return;
      }

      this.loadBookings();
    } catch (error) {
      this.showToast('Error reading user info');
      this.navCtrl.navigateRoot('/login');
    }
  }

  loadBookings() {
    if (!this.touristId) return;

    this.loading = true;

    this.apiService.getTouristAllBookings(this.touristId).subscribe({
      next: (response: any) => {
        this.loading = false;
        const bookings: Booking[] = Array.isArray(response.data)
          ? response.data
          : [];

        // Filter activity bookings and sort by date descending
        this.activityBookings = bookings
          .filter((b) => b.type === 'activity')
          .sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA; // latest first
          });

        // Filter accommodation bookings, map display name, and sort by check-in descending
        this.accommodationBookings = bookings
          .filter((b) => b.type === 'accommodation')
          .map((b) => ({
            ...b,
            accommodationDisplayName:
              b.accommodationName || b['accommodation_name'] || 'Accommodation',
          }))
          .sort((a, b) => {
            const checkInA = a.check_in ? new Date(a.check_in).getTime() : 0;
            const checkInB = b.check_in ? new Date(b.check_in).getTime() : 0;
            return checkInB - checkInA; // latest first
          });

        // auto-select segment with bookings
        if (
          this.selectedSegment === 'activity' &&
          this.activityBookings.length === 0 &&
          this.accommodationBookings.length > 0
        ) {
          this.selectedSegment = 'accommodation';
        } else if (
          this.selectedSegment === 'accommodation' &&
          this.accommodationBookings.length === 0 &&
          this.activityBookings.length > 0
        ) {
          this.selectedSegment = 'activity';
        }
      },
      error: () => {
        this.loading = false;
        this.showToast('Failed to load bookings');
      },
    });
  }

  contactBooking(
    bookingId: string | number,
    type: 'activity' | 'accommodation',
  ) {
    console.log(`Contact booking ${bookingId} of type ${type}`);

    this.showToast(
      'Contact Feature Coming Soon!',
      'danger',
      'information-circle-outline',
    );
  }

  getFilteredActivityBookings(): Booking[] {
    if (this.filterStatus === 'all') return this.activityBookings;
    return this.activityBookings.filter(
      (b) => (b.status || '').toLowerCase() === this.filterStatus.toLowerCase(),
    );
  }

  getFilteredAccommodationBookings(): Booking[] {
    if (this.filterStatus === 'all') return this.accommodationBookings;
    return this.accommodationBookings.filter(
      (b) => (b.status || '').toLowerCase() === this.filterStatus.toLowerCase(),
    );
  }

  // loadBookings() {
  //   if (!this.touristId) return;

  //   this.loading = true;

  //   this.apiService.getTouristAllBookings(this.touristId).subscribe({
  //     next: (response: any) => {
  //       this.loading = false;
  //       const bookings: Booking[] = Array.isArray(response.data) ? response.data : [];

  //       this.activityBookings = bookings.filter(b => b.type === 'activity');
  //       //this.accommodationBookings = bookings.filter(b => b.type === 'accommodation');
  //       this.accommodationBookings = bookings
  //       .filter(b => b.type === 'accommodation')
  //       .map(b => ({
  //         ...b,
  //         accommodationDisplayName:
  //           b.accommodationName ||
  //           b['accommodation_name'] ||
  //           'Accommodation',
  //       }));

  //       // auto-select segment with bookings
  //       if (this.selectedSegment === 'activity' && this.activityBookings.length === 0 && this.accommodationBookings.length > 0) {
  //         this.selectedSegment = 'accommodation';
  //       } else if (this.selectedSegment === 'accommodation' && this.accommodationBookings.length === 0 && this.activityBookings.length > 0) {
  //         this.selectedSegment = 'activity';
  //       }
  //     },
  //     error: () => {
  //       this.loading = false;
  //       this.showToast('Failed to load bookings');
  //     },
  //   });
  // }

  async confirmCancel(
    bookingId: string | number,
    type: 'activity' | 'accommodation',
  ) {
    const alert = await this.alertController.create({
      header: 'Confirm Cancel',
      message: 'Are you sure you want to cancel this booking?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
        },
        {
          text: 'Yes',
          handler: () => {
            this.cancelBooking(bookingId, type);
          },
        },
      ],
    });

    await alert.present();
  }

  async cancelBooking(
    bookingId: string | number,
    type: 'activity' | 'accommodation',
  ) {
    const idStr = bookingId.toString();

    const handleCancelSuccess = async () => {
      // Update local booking status
      let booking;
      if (type === 'activity') {
        booking = this.activityBookings.find((b) => b.id === bookingId);
        if (booking) booking.status = 'Cancelled';
      } else {
        booking = this.accommodationBookings.find((b) => b.id === bookingId);
        if (booking) booking.status = 'Cancelled';
      }

      this.showToast(
        `${type === 'activity' ? 'Activity' : 'Accommodation'} booking cancelled`,
      );

      // Count total cancelled bookings
      const totalCancelled =
        this.activityBookings.filter(
          (b) => b.status?.toLowerCase() === 'cancelled',
        ).length +
        this.accommodationBookings.filter(
          (b) => b.status?.toLowerCase() === 'cancelled',
        ).length;

      // Suspend user if 7 bookings cancelled
      if (totalCancelled === 7) {
        try {
          // Call backend to suspend user
          await this.apiService.suspendTouristUser(this.touristId).toPromise();

          // Update local state
          this.userIsActive = false;

          // Clear local storage
          localStorage.removeItem('user');
          localStorage.removeItem('tourist_user_id');

          // Show alert and log out
          const alert = await this.alertController.create({
            header: 'Account Suspended',
            message:
              'You have cancelled 7 bookings. Your account has been suspended. You will be logged out.',
            buttons: [
              {
                text: 'OK',
                role: 'confirm',
                handler: () => {
                  this.navCtrl.navigateRoot('/tourist/login');
                },
              },
            ],
          });
          await alert.present();
        } catch (error) {
          console.error('Failed to suspend user on backend', error);
          this.showToast('Error suspending account', 'danger');
        }
      }
    };

    // Call appropriate API
    if (type === 'activity') {
      this.apiService.cancelActivityBooking(idStr).subscribe({
        next: handleCancelSuccess,
        error: () => this.showToast('Failed to cancel activity booking'),
      });
    } else {
      this.apiService.cancelAccommodationBooking(idStr).subscribe({
        next: handleCancelSuccess,
        error: () => this.showToast('Failed to cancel accommodation booking'),
      });
    }
  }

  // Alert for suspension
  async showSuspensionAlert() {
    const alert = await this.alertController.create({
      header: 'Account Suspended',
      message:
        'You have cancelled 7 bookings. Your account has been suspended. Please contact support.',
      buttons: [{ text: 'OK', role: 'cancel' }],
    });
    await alert.present();
  }

  getStatusColor(status?: string): string {
    switch ((status || 'Pending').toLowerCase()) {
      case 'paid':
        return 'success';
      case 'booked':
        return 'warning';
      case 'pending':
        return 'warning';
      case 'cancelled':
      case 'canceled':
        return 'danger';
      default:
        return 'medium';
    }
  }

  parsePrice(price: any): number {
    if (!price) return 0;
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      return parseFloat(price.replace(/,/g, '')) || 0;
    }
    return 0;
  }

  async showToast(
    msg: string,
    color: 'success' | 'warning' | 'danger' | 'primary' | 'medium' = 'primary',
    icon: string = 'information-circle-outline',
  ) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 1500,
      position: 'bottom',
      color,
      icon,
    });

    await toast.present();
  }

  goBack() {
    // Clear the new booking notification count
    localStorage.setItem('newBookingCount', '0');

    // Optionally, navigate back to home or previous page
    this.navCtrl.navigateBack('/tourist/home');
  }
}
