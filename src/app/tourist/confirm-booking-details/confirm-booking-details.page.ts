import { Component, OnInit } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { NotificationService } from 'src/app/services/notification.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-confirm-booking-details',
  templateUrl: './confirm-booking-details.page.html',
  styleUrls: ['./confirm-booking-details.page.scss'],
})
export class ConfirmBookingDetailsPage implements OnInit {
  bookingData: any = {};
  operatorId: string | null = null;
  operatorData: any = null;
  isSubmitting = false;
  perPaxPrice: number = 0;

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController,
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.bookingData = navigation.extras.state;
    }

    this.route.queryParams.subscribe((params) => {
      // Merge query params into bookingData
      this.bookingData.activity_id = this.bookingData.activity_id || params['activity_id'];
      this.bookingData.operator_id = params['operator_id'] || this.bookingData.operator_id;
      this.bookingData.tourist_user_id = this.bookingData.tourist_user_id || params['tourist_user_id'];
      this.bookingData.total_price = this.bookingData.total_price || (params['price'] ? parseFloat(params['price']) : 0);

      // Set operatorId if provided in bookingData or params
      this.operatorId = this.bookingData.operator_id || null;

      // Calculate per pax price if possible
      if (this.bookingData.total_price && this.bookingData.no_of_pax) {
        this.perPaxPrice = this.bookingData.total_price / this.bookingData.no_of_pax;
      }

      if (!this.bookingData.activity_id) {
        this.navCtrl.navigateBack('/tourist/home');
        return;
      }

      this.fetchActivityAndOperator(this.bookingData.activity_id);
    });
  }

  private async fetchActivityAndOperator(activityId: string) {
    try {
      const res: any = await firstValueFrom(this.api.getActivityById(activityId));
      const activity =
        res?.data && Array.isArray(res.data)
          ? res.data[0]
          : res?.data || res || {};

      this.bookingData.activity_name = activity.activity_name || activity.name || 'Unknown Activity';
      this.bookingData.activity_image = activity.image || 'assets/images/placeholder.jpg';

      // Assign operatorId reliably
      this.operatorId = this.bookingData.operator_id || activity.user_id || activity.rt_user?.id || null;

      if (this.operatorId) {
        await this.fetchOperator(this.operatorId);
      }
    } catch (err) {
      console.error('Failed to fetch activity', err);
      this.navCtrl.navigateBack('/tourist/home');
    }
  }

  private async fetchOperator(operatorId: string) {
    try {
      const res: any = await firstValueFrom(this.api.getOperatorById(operatorId));
      this.operatorData = res;
      this.bookingData.operator_name = res.business_name || 'N/A';
      this.bookingData.operator_image = res.image || 'assets/images/default-operator.jpg';
      this.bookingData.location = res.address || 'N/A';
    } catch (err) {
      console.error('Failed to fetch operator', err);
    }
  }

  async changePax() {
    const alert = await this.alertController.create({
      header: 'Change Number of Pax',
      inputs: [
        { name: 'pax', type: 'number', min: 1, value: this.bookingData.no_of_pax || 1 },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'OK',
          handler: (data) => {
            const pax = parseInt(data.pax, 10);
            if (pax >= 1) {
              this.bookingData.no_of_pax = pax;
              this.bookingData.total_price = parseFloat((this.perPaxPrice * pax).toFixed(2));
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async changeDate() {
    const alert = await this.alertController.create({
      header: 'Change Date',
      inputs: [
        { name: 'date', type: 'date', value: this.bookingData.date ? this.bookingData.date.split('T')[0] : '' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'OK',
          handler: (data) => {
            if (data.date) this.bookingData.date = data.date;
          },
        },
      ],
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

    if (!this.bookingData.tourist_user_id || !this.bookingData.activity_id || !this.bookingData.total_price) {
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
      ...this.bookingData,
      operator_id: this.operatorId,
      status: 'confirmed',
      date: this.bookingData.date || new Date().toISOString().split('T')[0],
    };

    try {
      const bookingResponse: any = await firstValueFrom(this.api.createBooking(finalBooking));
      this.isSubmitting = false;

      const bookingId = bookingResponse?.data?.id || bookingResponse?.id;

      if (this.operatorId && bookingId) {
        const notification = {
          tourist_user_id: this.bookingData.tourist_user_id,
          operator_id: this.operatorId,
          booking_id: bookingId,
          message: `Your booking for ${finalBooking.activity_name} has been confirmed!`,
          read_status: 0,
        };

        try {
          await firstValueFrom(this.notificationService.createOperatorNotification(notification));
          console.log('Notification sent successfully');
        } catch (err) {
          console.error('Notification failed:', err);
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
