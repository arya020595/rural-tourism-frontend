import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { AlertController } from '@ionic/angular';
import { NavController } from '@ionic/angular';

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

  ionViewWillEnter() {
    if (this.operatorId) {
      this.loadBookings();
    }
  }

  setOperatorId() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) {
      alert('Operator not logged in.');
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
          alert(res.message || 'No bookings found.');
        }
      },
      (err) => {
        this.loading = false;
        console.error(err);
        alert('Server error while loading bookings.');
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
        return 'success';
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

  viewReceipt(booking: any) {
    if (!booking.receipt_id) {
      alert('Receipt not found for this booking.');
      return;
    }
    if (booking.type === 'accommodation') {
      this.navCtrl.navigateForward(`/receipt/${booking.receipt_id}`);
    } else {
      this.navCtrl.navigateForward(`/receipt-activity/${booking.receipt_id}`);
    }
  }

  createReceipt(booking: any) {
    if (booking.type === 'accommodation') {
      this.navCtrl.navigateForward(['/acco-form'], {
        queryParams: { bookingId: booking.id },
      });
    } else {
      this.navCtrl.navigateForward(['/activity-form'], {
        queryParams: { bookingId: booking.id },
      });
    }
  }
}
