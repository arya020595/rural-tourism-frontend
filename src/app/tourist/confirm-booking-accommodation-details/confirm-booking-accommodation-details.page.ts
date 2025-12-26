import { Component, OnInit } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { NotificationService } from 'src/app/services/notification.service'; // <-- import
import { firstValueFrom } from 'rxjs';

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
  perNightPrice: number = 0;

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController,
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private notificationService: NotificationService // <-- inject here
  ) {}

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.bookingData = navigation.extras.state;
    }

    this.route.queryParams.subscribe((params) => {
      if (!this.bookingData || Object.keys(this.bookingData).length === 0) {
        this.bookingData = params;
      }

      if (!this.bookingData['tourist_user_id'] && params['tourist_user_id']) {
        this.bookingData['tourist_user_id'] = params['tourist_user_id'];
      }
      if (!this.bookingData['total_price'] && params['price']) {
        this.bookingData['total_price'] = parseFloat(params['price']);
      }
      if (!this.bookingData['accommodation_id'] && params['accommodation_id']) {
        this.bookingData['accommodation_id'] = params['accommodation_id'];
      }

      if (this.bookingData.accommodation_id) {
        this.fetchAccommodationAndOperator(this.bookingData.accommodation_id);
      } else {
        this.navCtrl.navigateBack('/tourist/home');
      }
    });
  }

  private async fetchAccommodationAndOperator(accommodationId: string) {
    try {
      const res: any = await firstValueFrom(this.api.getAccommodationById(accommodationId));
      const accommodation =
        res?.data && Array.isArray(res.data)
          ? res.data[0]
          : res?.data || res || {};

      this.bookingData.accommodation_name = accommodation.name || 'Unknown Accommodation';
      this.bookingData.accommodation_image = accommodation.image || 'assets/images/placeholder.jpg';
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

  private async fetchOperator(operatorId: string) {
    try {
      const res: any = await firstValueFrom(this.api.getAccommodationOperatorById(operatorId));
      this.operatorData = res;
      this.bookingData.operator_name = res.business_name || 'N/A';
      this.bookingData.operator_image = res.image || 'assets/images/default-operator.jpg';
      this.bookingData.location = res.address || 'N/A';
    } catch (err) {
      console.error('Failed to fetch operator', err);
    }
  }

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

  async changeDates() {
    const alert = await this.alertController.create({
      header: 'Change Dates',
      inputs: [
        {
          name: 'start_date',
          type: 'date',
          value: this.bookingData.start_date || '',
          placeholder: 'Start Date'
        },
        {
          name: 'end_date',
          type: 'date',
          value: this.bookingData.end_date || '',
          placeholder: 'End Date'
        }
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

                const number_of_nights = Math.max(
                  1,
                  Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                );
                this.bookingData.number_of_nights = number_of_nights;

                this.bookingData.total_price = parseFloat(
                  (this.perNightPrice * number_of_nights).toFixed(2)
                );
              }
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmCancel() {
    const alert = await this.alertController.create({
      header: 'Cancel Booking',
      message: 'Are you sure you want to cancel your booking?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Yes!', handler: () => this.navCtrl.back() },
      ],
    });
    await alert.present();
  }

  async confirmBooking() {
    this.isSubmitting = true;

    if (!this.bookingData.tourist_user_id || !this.bookingData.accommodation_id || !this.bookingData.total_price) {
      const errorAlert = await this.alertController.create({
        header: 'Booking Failed',
        message: 'Booking data is incomplete.',
        buttons: ['OK'],
      });
      await errorAlert.present();
      this.isSubmitting = false;
      return;
    }

    const finalBooking = {
      tourist_user_id: this.bookingData.tourist_user_id,
      accommodation_id: this.bookingData.accommodation_id,
      operator_id: this.operatorId,
      accommodation_name: this.bookingData.accommodation_name,
      location: this.bookingData.location,
      start_date: this.bookingData.start_date || new Date().toISOString().split('T')[0],
      end_date: this.bookingData.end_date || new Date().toISOString().split('T')[0],
      number_of_nights: this.bookingData.number_of_nights || 1,
      no_of_pax: this.bookingData.no_of_pax || 1,
      total_price: this.bookingData.total_price,
      status: 'confirmed',
    };

    try {
      const bookingResponse: any = await firstValueFrom(this.api.createAccommodationBooking(finalBooking));
      this.isSubmitting = false;

      const bookingId = bookingResponse?.data?.id;
      if (!this.operatorId || !bookingId) {
        console.warn('Missing operatorId or bookingId. Notification not sent.');
      } else {
        const notification = {
          operator_id: this.operatorId,
          tourist_user_id: this.bookingData.tourist_user_id,
          booking_id: bookingId,
          message: `New booking for ${this.bookingData.accommodation_name}`,
        };
        console.log('Sending notification:', notification);

        try {
          // <-- use NotificationService
          const response = await firstValueFrom(this.notificationService.createOperatorNotification(notification));
          console.log('Notification sent successfully:', response);
        } catch (err) {
          console.error('Failed to send notification:', err);
        }
      }

      const alert = await this.alertController.create({
        header: 'Booking Confirmed',
        message: 'Your booking has been successfully confirmed!',
        buttons: [{ text: 'OK', handler: () => this.navCtrl.navigateRoot('/tourist/home') }],
      });
      await alert.present();
    } catch (err: any) {
      this.isSubmitting = false;
      const errorAlert = await this.alertController.create({
        header: 'Booking Failed',
        message: err?.error?.message || 'Something went wrong. Please try again later.',
        buttons: ['OK'],
      });
      await errorAlert.present();
    }
  }
}
