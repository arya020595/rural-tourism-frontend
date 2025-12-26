import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController, AlertController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-activity-booking',
  templateUrl: './activity-booking.page.html',
  styleUrls: ['./activity-booking.page.scss'],
})
export class ActivityBookingPage implements OnInit {
  bookingForm: FormGroup;
  totalPrice = 0;
  pricePerPax = 0;
  activityId = '';
  operatorId = '';
  touristUserId = '';
  activityDetails: any = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: ApiService,
    private navCtrl: NavController,
    private alertController: AlertController
  ) {
    this.bookingForm = this.fb.group({
      no_of_pax: [1, [Validators.required, Validators.min(1)]],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      contact_name: ['', Validators.required],
      contact_phone: [
        '',
        [Validators.required, Validators.pattern('^[\\s0-9+()\\-]{8,20}$')],
      ],
      nationality: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.activityId = params['activity_id'] || '';
      this.operatorId = params['operator_id'] || '';
      this.touristUserId = params['tourist_user_id'] || localStorage.getItem('tourist_user_id') || '';
      this.pricePerPax = +params['price'] || 0;

      console.log('✅ Captured Operator ID:', this.operatorId);

      this.calculateTotalPrice();

      // Fetch activity details
      if (this.activityId) {
        this.api.getActivityById(this.activityId).subscribe({
          next: (res) => {
            const activity = res.data || res;
            if (activity.price_per_pax || activity.price) {
              this.pricePerPax = activity.price_per_pax || activity.price;
              this.calculateTotalPrice();
            }
            this.activityDetails = activity;
          },
          error: (err) => console.error('Failed to load activity details:', err)
        });
      }

      // Prefill tourist user details
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        this.bookingForm.patchValue({
          contact_name: user.full_name || '',
          contact_phone: (user.contact_no || user.phone || '').trim(),
          nationality: (user.nationality || '').trim(),
        });
        this.touristUserId = user.tourist_user_id || this.touristUserId;
        localStorage.setItem('tourist_user_id', this.touristUserId);
      }

      // Recalculate total price
      this.bookingForm.get('no_of_pax')?.valueChanges.subscribe(() => {
        this.calculateTotalPrice();
      });
    });
  }

  onDateSelected(event: any) {
    const selectedDate = event.detail.value;
    this.bookingForm.patchValue({ date: selectedDate });
  }

  calculateTotalPrice() {
    const pax = this.bookingForm.get('no_of_pax')?.value || 0;
    this.totalPrice = this.pricePerPax * pax;
  }

  async confirmCancel() {
    const alert = await this.alertController.create({
      header: 'Cancel Booking',
      message: 'Are you sure you want to cancel the booking?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Yes!', handler: () => this.navCtrl.back() },
      ],
    });
    await alert.present();
  }

  async submitBooking() {
    if (this.bookingForm.invalid) {
      const alert = await this.alertController.create({
        header: 'Incomplete Form',
        message: 'Please fill in all required fields correctly.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    const bookingData = {
      activity_id: this.activityId,
      operator_id: this.operatorId,
      tourist_user_id: this.touristUserId,
      no_of_pax: this.bookingForm.value.no_of_pax,
      date: this.bookingForm.value.date,
      contact_name: this.bookingForm.value.contact_name,
      contact_phone: this.bookingForm.value.contact_phone,
      nationality: this.bookingForm.value.nationality,
      total_price: this.totalPrice,
      status: 'pending',
      activity_name: this.activityDetails?.activity_name || 'N/A',
      operator_name: this.activityDetails?.operator_name || 'N/A',
      location: this.activityDetails?.location || 'N/A',
      image: this.activityDetails?.image || 'assets/placeholder.jpg'
    };

    console.log('🚀 Passing booking data to confirm page:', bookingData);

    this.navCtrl.navigateForward('/tourist/confirm-booking-details', {
      state: bookingData,
    });
  }
}
