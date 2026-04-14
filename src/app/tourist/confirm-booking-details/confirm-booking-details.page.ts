import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { NotificationService } from 'src/app/services/notification.service';

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
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    // Load booking data from router state or history
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.bookingData = navigation.extras.state;
    } else if (history.state && Object.keys(history.state).length) {
      this.bookingData = history.state;
    } else {
      this.navCtrl.navigateBack('/tourist/home');
      return;
    }

    // Set tourist name
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

    // Fetch activity and operator info
    if (this.bookingData.activity_id) {
      this.fetchActivityAndOperator(this.bookingData.activity_id);
    } else {
      this.navCtrl.navigateBack('/tourist/home');
      return;
    }

    // If no date selected, pick first available date
    if (
      this.bookingData.available_dates_list?.length &&
      !this.bookingData.date
    ) {
      const firstSlot = this.bookingData.available_dates_list[0];
      this.bookingData.date = firstSlot.date; // YYYY-MM-DD string
      this.bookingData.time =
        firstSlot.time || `${firstSlot.startTime} - ${firstSlot.endTime}`;
      this.perPaxPrice = Number(firstSlot.price ?? this.perPaxPrice);
      this.updateTotalPrice();
    }

    // Set per-pax price from total price and pax
    if (this.bookingData.total_price && this.bookingData.no_of_pax) {
      this.perPaxPrice =
        this.bookingData.total_price / this.bookingData.no_of_pax;
    } else if (this.bookingData.total_price) {
      this.perPaxPrice = this.bookingData.total_price;
    }

    // Ensure total price is consistent
    this.updateTotalPrice();
  }

  private async fetchActivityAndOperator(activityId: string) {
    try {
      const res: any = await firstValueFrom(
        this.api.getActivityById(activityId),
      );
      const activity =
        res?.data && Array.isArray(res.data)
          ? res.data[0]
          : res?.data || res || {};

      this.bookingData.activity_name =
        activity.activity_name || activity.name || 'Unknown Activity';
      this.bookingData.activity_image =
        activity.image || 'assets/images/placeholder.jpg';

      this.operatorId =
        (
          this.bookingData.operator_id ??
          activity.operator_id ??
          activity.user_id ??
          activity.rt_user?.id
        )?.toString() || null;

      if (this.operatorId) {
        await this.fetchOperator(this.operatorId);
      } else {
        console.warn('Operator ID missing! Cannot fetch operator data.');
      }
    } catch (err) {
      console.error('Failed to fetch activity', err);
      this.navCtrl.navigateBack('/tourist/home');
    }
  }

  private async fetchOperator(operatorId: string) {
    try {
      const res: any = await firstValueFrom(
        this.api.getOperatorById(operatorId),
      );
      this.operatorData = res;

      this.bookingData.operator_name = res.business_name || 'N/A';
      this.bookingData.operator_image =
        res.image || 'assets/images/default-operator.jpg';
      this.bookingData.location = res.address || 'N/A';

      this.operatorId =
        res.user_id?.toString() || this.operatorId;
      if (!this.operatorId) {
        console.warn('Operator user ID missing! Notifications may not work.');
      }
    } catch (err) {
      console.error('Failed to fetch operator', err);
    }
  }

  // ==========================
  // Change Number of Pax
  // ==========================
  async changePax() {
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
              this.updateTotalPrice();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  updateTotalPrice() {
    const pax = this.bookingData.no_of_pax || 1;
    this.bookingData.total_price = parseFloat(
      (this.perPaxPrice * pax).toFixed(2),
    );
  }

  // ==========================
  // Change Date
  // ==========================
  async changeDate() {
    if (!this.bookingData.available_dates_list?.length) return;

    // Build unique date options
    const dateOptionsMap: Record<string, any> = {};
    this.bookingData.available_dates_list.forEach((slot: any) => {
      if (!dateOptionsMap[slot.date]) dateOptionsMap[slot.date] = slot;
    });

    const dateOptions = Object.keys(dateOptionsMap).map((date: string) => {
      const slot = dateOptionsMap[date];
      const price = slot.price ?? this.perPaxPrice;
      return {
        name: 'date',
        type: 'radio' as const,
        label: `${this.formatDateDisplay(date)} (RM ${price} / per pax)`,
        value: date,
        checked: date === this.bookingData.date,
      };
    });

    const alert = await this.alertController.create({
      header: 'Change Date',
      inputs: dateOptions,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'OK',
          handler: (selectedDate: string) => {
            if (selectedDate) {
              this.bookingData.date = selectedDate;

              // Update available times
              const timesForDate = this.bookingData.available_dates_list
                .filter((d: any) => d.date === selectedDate)
                .map((d: any) => d.time || `${d.startTime} - ${d.endTime}`);
              if (!timesForDate.includes(this.bookingData.time)) {
                this.bookingData.time = timesForDate[0] || null;
              }

              // Update per-pax price based on first slot
              const firstSlot = this.bookingData.available_dates_list.find(
                (d: any) => d.date === selectedDate,
              );
              if (firstSlot) {
                this.perPaxPrice = Number(firstSlot.price ?? this.perPaxPrice);
                this.updateTotalPrice();
              }
            }
          },
        },
      ],
    });

    await alert.present();
  }

  // ==========================
  // Format Date safely (Local)
  // ==========================
  formatDateDisplay(dateStr: string): string {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day); // local time
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  // ==========================
  // Change Time
  // ==========================
  async changeTime() {
    if (!this.bookingData.available_dates_list || !this.bookingData.date)
      return;

    const timesForDate: string[] = this.bookingData.available_dates_list
      .filter((d: any) => d.date === this.bookingData.date)
      .map((d: any) => d.time || `${d.startTime} - ${d.endTime}`)
      .filter(Boolean);

    if (!timesForDate.length) {
      const alert = await this.alertController.create({
        header: 'No Available Times',
        message: 'No times available for selected date.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Change Time',
      inputs: timesForDate.map((time: string) => ({
        name: 'time',
        type: 'radio',
        label: time,
        value: time,
        checked: time === this.bookingData.time,
      })),
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'OK',
          handler: (selectedTime: string) => {
            if (selectedTime) {
              this.bookingData.time = selectedTime;

              const slot = this.bookingData.available_dates_list.find(
                (d: any) =>
                  d.date === this.bookingData.date &&
                  (d.time || `${d.startTime} - ${d.endTime}`) === selectedTime,
              );
              if (slot) {
                this.perPaxPrice = Number(slot.price ?? this.perPaxPrice);
                this.updateTotalPrice();
              }
            }
          },
        },
      ],
    });

    await alert.present();
  }

  // ==========================
  // Cancel Booking
  // ==========================
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

  // ==========================
  // Confirm Booking
  // ==========================
  async confirmBooking() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    if (
      !this.bookingData.tourist_user_id ||
      !this.bookingData.activity_id ||
      !this.bookingData.total_price
    ) {
      const errorAlert = await this.alertController.create({
        header: 'Booking Failed',
        message: 'Booking data is incomplete.',
        buttons: ['OK'],
      });
      await errorAlert.present();
      this.isSubmitting = false;
      return;
    }

    // Always send date as YYYY-MM-DD string
    const finalBooking = {
      ...this.bookingData,
      operator_id: this.operatorId,
      status: 'booked',
      date: this.bookingData.date,
      time: this.bookingData.time || null,
    };

    try {
      const bookingResponse: any = await firstValueFrom(
        this.api.createBooking(finalBooking),
      );
      this.isSubmitting = false;

      const bookingId = bookingResponse?.data?.id || bookingResponse?.id;

      // Update booking badge count
      const currentCount = parseInt(
        localStorage.getItem('newBookingCount') || '0',
        10,
      );
      localStorage.setItem('newBookingCount', (currentCount + 1).toString());

      // Send notification to operator
      if (this.operatorId && bookingId) {
        const notificationPayload = {
          user_id: this.operatorId,
          title: 'New Booking',
          message: `${this.bookingData.tourist_name} has booked ${finalBooking.activity_name} on ${this.formatDateDisplay(finalBooking.date)}. Total price: RM ${finalBooking.total_price.toFixed(2)}`,
          tourist_name: this.bookingData.tourist_name,
          type: 'booking',
          related_id: bookingId,
          is_read: 0,
        };
        try {
          await firstValueFrom(
            this.notificationService.createOperatorNotification(
              notificationPayload,
            ),
          );
          console.log('Activity notification sent successfully');
        } catch (err) {
          console.error('Failed to send notification', err);
        }
      }

      // Show success alert
      const alert = await this.alertController.create({
        header: 'Booking Successful!',
        message: 'Your booking has been confirmed!',
        buttons: [
          {
            text: 'Return to Home Page',
            handler: () => this.navCtrl.navigateRoot('/tourist/home'),
          },
        ],
      });
      await alert.present();
    } catch (err: any) {
      this.isSubmitting = false;
      const errorAlert = await this.alertController.create({
        header: 'Booking Failed',
        message: err?.error?.message || 'Something went wrong.',
        buttons: ['OK'],
      });
      await errorAlert.present();
    }
  }
}
