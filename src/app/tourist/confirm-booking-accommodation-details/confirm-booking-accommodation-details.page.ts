import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-confirm-booking-accommodation-details',
  templateUrl: './confirm-booking-accommodation-details.page.html',
  styleUrls: ['./confirm-booking-accommodation-details.page.scss'],
})
export class ConfirmBookingAccommodationDetailsPage implements OnInit {
  bookingData: any = {};
  operatorId: string | null = null;
  operatorData: any = null;
  isSubmitting = false;
  perNightPrice = 0;

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController,
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    // Get booking data from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.bookingData = navigation.extras.state;
    }

    // ✅ Add tourist name from localStorage or fallback
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.bookingData.tourist_name =
          this.bookingData.contact_name ||
          user.full_name ||
          user.name ||
          user.username ||
          'A tourist';
      } catch {
        this.bookingData.tourist_name =
          this.bookingData.contact_name || 'A tourist';
      }
    } else {
      this.bookingData.tourist_name =
        this.bookingData.contact_name || 'A tourist';
    }

    this.route.queryParams.subscribe((params) => {
      if (!this.bookingData || Object.keys(this.bookingData).length === 0) {
        this.bookingData = { ...params };
      }

      this.bookingData.tourist_user_id ||= params['tourist_user_id'];
      this.bookingData.accommodation_id ||= params['accommodation_id'];

      if (!this.bookingData.total_price && params['price']) {
        this.bookingData.total_price = parseFloat(params['price']);
      }

      if (this.bookingData.accommodation_id) {
        this.fetchAccommodationAndOperator(this.bookingData.accommodation_id);
      } else {
        this.navCtrl.navigateBack('/tourist/home');
      }
    });
  }

  // ===============================
  // Fetch Accommodation + Operator
  // ===============================
  private async fetchAccommodationAndOperator(accommodationId: string) {
    try {
      const res: any = await firstValueFrom(
        this.api.getAccommodationById(accommodationId),
      );

      const accommodation =
        res?.data && Array.isArray(res.data)
          ? res.data[0]
          : res?.data || res || {};

      this.bookingData.accommodation_name =
        accommodation.name || 'Unknown Accommodation';

      this.bookingData.accommodation_image =
        accommodation.image || 'assets/images/placeholder.jpg';

      this.bookingData.location =
        accommodation.location ||
        accommodation.address ||
        'Location not available';

      this.operatorId = this.bookingData.operator_id || accommodation.user_id;

      const nights = this.bookingData.number_of_nights || 1;
      if (this.bookingData.total_price) {
        this.perNightPrice = this.bookingData.total_price / nights;
      }

      if (this.operatorId) {
        await this.fetchOperator(this.operatorId);
      }
    } catch (err) {
      console.error('Failed to fetch accommodation', err);
      this.navCtrl.navigateBack('/tourist/home');
    }
  }

  // ===============================
  // Fetch Operator
  // ===============================
  private async fetchOperator(operatorId: string) {
    try {
      const res: any = await firstValueFrom(
        this.api.getAccommodationOperatorById(operatorId),
      );

      this.operatorData = res;

      this.bookingData.operator_name = res?.business_name || 'N/A';

      this.bookingData.operator_image =
        res?.image || 'assets/images/default-operator.jpg';

      this.bookingData.operator_location = res?.address || 'N/A';
    } catch (err) {
      console.error('Failed to fetch operator', err);
    }
  }

  // ===============================
  // Change Pax
  // ===============================
  async changeRooms() {
    const alert = await this.alertController.create({
      header: 'Change Number of Pax',
      inputs: [
        {
          name: 'pax',
          type: 'number',
          min: 1,
          value: this.bookingData.no_of_pax || 1,
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'OK',
          handler: (data) => {
            const pax = parseInt(data.pax, 10);
            if (pax >= 1) {
              this.bookingData.no_of_pax = pax;
            }
          },
        },
      ],
    });
    await alert.present();
  }

  // ===============================
  // Change Dates
  // ===============================
  async changeDates() {
    const alert = await this.alertController.create({
      header: 'Change Dates',
      inputs: [
        {
          name: 'start_date',
          type: 'date',
          value: this.bookingData.start_date || '',
        },
        {
          name: 'end_date',
          type: 'date',
          value: this.bookingData.end_date || '',
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'OK',
          handler: (data) => {
            if (data.start_date && data.end_date) {
              const start = new Date(data.start_date);
              const end = new Date(data.end_date);

              if (end >= start) {
                this.bookingData.start_date = data.start_date;
                this.bookingData.end_date = data.end_date;

                const nights = Math.max(
                  1,
                  Math.ceil(
                    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
                  ),
                );

                this.bookingData.number_of_nights = nights;
                this.bookingData.total_price = parseFloat(
                  (this.perNightPrice * nights).toFixed(2),
                );
              }
            }
          },
        },
      ],
    });

    await alert.present();
  }

  // ===============================
  // Cancel Booking
  // ===============================
  async confirmCancel() {
    const alert = await this.alertController.create({
      header: 'Cancel Booking',
      message: 'Are you sure you want to cancel the booking?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Yes!',
          handler: () =>
            this.navCtrl.navigateRoot('/tourist/home', {
              animated: true,
              animationDirection: 'forward',
            }),
        },
      ],
    });
    await alert.present();
  }

  // ===============================
  // Confirm Booking
  // ===============================
  async confirmBooking() {
    this.isSubmitting = true;

    if (
      !this.bookingData.tourist_user_id ||
      !this.bookingData.accommodation_id ||
      !this.bookingData.total_price ||
      !this.bookingData.start_date ||
      !this.bookingData.end_date
    ) {
      const alert = await this.alertController.create({
        header: 'Booking Failed',
        message: 'Booking data is incomplete.',
        buttons: ['OK'],
      });
      await alert.present();
      this.isSubmitting = false;
      return;
    }

    const payload = {
      tourist_user_id: this.bookingData.tourist_user_id,
      accommodation_id: this.bookingData.accommodation_id,
      check_in: this.bookingData.start_date,
      check_out: this.bookingData.end_date,
      total_no_of_nights: this.bookingData.number_of_nights || 1,
      no_of_pax: this.bookingData.no_of_pax || 1,
      total_price: this.bookingData.total_price,
      status: 'booked',
      contact_name: this.bookingData.contact_name || 'N/A',
      contact_email: this.bookingData.contact_email || '',
      contact_phone: this.bookingData.contact_phone || '',
      nationality: this.bookingData.nationality || '',
    };

    try {
      const res: any = await firstValueFrom(
        this.api.createAccommodationBooking(payload),
      );

      const bookingId = res?.data?.id;
      if (!bookingId) throw new Error('Booking ID missing');

      // Format dates for notification
      const startDate = new Date(
        this.bookingData.start_date,
      ).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const endDate = new Date(this.bookingData.end_date).toLocaleDateString(
        'en-GB',
        { day: '2-digit', month: 'short', year: 'numeric' },
      );

      // ✅ Operator notification with full tourist name
      if (this.operatorId) {
        await firstValueFrom(
          this.notificationService.createOperatorNotification({
            user_id: this.operatorId.toString(),
            title: `New booking from ${this.bookingData.tourist_name}`,
            message: `${this.bookingData.tourist_name} booked "${this.bookingData.accommodation_name}" from ${startDate} to ${endDate}`,
            type: 'booking',
            related_id: bookingId,
          }),
        );
      }

      const success = await this.alertController.create({
        header: 'Booking Successful!',
        message:
          'Your booking has been confirmed! You will be contacted soon for more inquiries. Thank you!',
        buttons: [
          {
            text: 'Return to Home Page',
            handler: () => this.navCtrl.navigateRoot('/tourist/home'),
          },
        ],
      });

      await success.present();
    } catch (err: any) {
      const alert = await this.alertController.create({
        header: 'Booking Failed',
        message: err?.message || 'Something went wrong.',
        buttons: ['OK'],
      });
      await alert.present();
    } finally {
      this.isSubmitting = false;
    }
  }
}
