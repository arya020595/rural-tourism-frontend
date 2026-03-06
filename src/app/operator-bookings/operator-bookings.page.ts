import { Component, OnInit } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-operator-bookings',
  templateUrl: './operator-bookings.page.html',
  styleUrls: ['./operator-bookings.page.scss'],
})
export class OperatorBookingsPage implements OnInit {
  operatorId: string = '';
  bookings: any[] = [];
  activityBookings: any[] = [];
  accommodationBookings: any[] = [];
  selectedSegment: string = 'activity';
  loading: boolean = false;
  filterStatus: string = 'all';

  constructor(
    private api: ApiService,
    private alertCtrl: AlertController,
    private navCtrl: NavController,
  ) {}

  ngOnInit() {
    this.setOperatorId();
  }

  setOperatorId() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) {
      this.showAlert('Operator not logged in.');
      return;
    }
    this.operatorId = user.id;
    this.loadBookings();
  }

  loadBookings() {
    if (!this.operatorId) return;

    this.loading = true;

    this.api.getOperatorAllBookings(this.operatorId).subscribe(
      (res: any) => {
        this.loading = false;
        if (res.success && res.data) {
          this.bookings = res.data;
          this.activityBookings = this.bookings.filter(
            (b) => b.type === 'activity',
          );
          this.accommodationBookings = this.bookings.filter(
            (b) => b.type === 'accommodation',
          );
        } else {
          this.bookings = [];
          this.activityBookings = [];
          this.accommodationBookings = [];
          this.showAlert(res.message || 'No bookings found.');
        }
      },
      (err) => {
        this.loading = false;
        console.error(err);
        this.showAlert('Server error while loading bookings.');
      },
    );
  }

  async confirmMarkPaid(booking: any, type: 'activity' | 'accommodation') {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Payment',
      message: 'Are you sure you want to mark this booking as paid?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Yes',
          handler: () => {
            if (type === 'activity') {
              this.markActivityPaid(booking);
            } else {
              this.markAccommodationPaid(booking);
            }
          },
        },
      ],
    });

    await alert.present();
  }

  getFilteredActivityBookings() {
    if (this.filterStatus === 'all') return this.activityBookings;
    return this.activityBookings.filter(
      (b) => (b.status || '').toLowerCase() === this.filterStatus.toLowerCase(),
    );
  }

  getFilteredAccommodationBookings() {
    if (this.filterStatus === 'all') return this.accommodationBookings;
    return this.accommodationBookings.filter(
      (b) => (b.status || '').toLowerCase() === this.filterStatus.toLowerCase(),
    );
  }

  markActivityPaid(booking: any) {
    this.api.markActivityPaid(booking.id).subscribe(
      async (res: any) => {
        const alert = await this.alertCtrl.create({
          header: 'Success',
          message: 'This booking is confirmed paid!',
          buttons: ['OK'],
        });
        await alert.present();
        this.loadBookings();
      },
      (err) => console.error(err),
    );
  }

  markAccommodationPaid(booking: any) {
    this.api.markAccommodationPaid(booking.id).subscribe(
      async (res: any) => {
        const alert = await this.alertCtrl.create({
          header: 'Success',
          message: 'This booking is confirmed paid!',
          buttons: ['OK'],
        });
        await alert.present();
        this.loadBookings();
      },
      (err) => console.error(err),
    );
  }

  getStatusColor(status: string) {
    switch ((status || '').toLowerCase()) {
      case 'booked':
        return 'warning';
      case 'pending':
        return 'warning';
      case 'cancelled':
      case 'canceled':
        return 'danger';
      case 'paid':
        return 'primary';
      default:
        return 'medium';
    }
  }

  goBack() {
    // Clear the new booking notification count
    localStorage.setItem('newBookingCount', '0');

    // Optionally, navigate back to home or previous page
    this.navCtrl.navigateBack('/home');
  }

  private async showAlert(message: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Notice',
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
