import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController, AlertController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-accommodation-booking',
  templateUrl: './accommodation-booking.page.html',
  styleUrls: ['./accommodation-booking.page.scss'],
})
export class AccommodationBookingPage implements OnInit {
  bookingForm: FormGroup;
  totalPrice = 0;
  numberOfNights = 1;
  pricePerNight = 0;
  accommodationId = '';
  operatorId = '';
  touristUserId = '';
  accommodationDetails: any = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: ApiService,
    private navCtrl: NavController,
    private alertController: AlertController
  ) {
    this.bookingForm = this.fb.group({
      no_of_pax: [1, [Validators.required, Validators.min(1)]],
      start_date: [new Date().toISOString().split('T')[0], Validators.required],
      end_date: [new Date().toISOString().split('T')[0], Validators.required],
      contact_name: ['', Validators.required],
      contact_phone: ['', [Validators.required, Validators.pattern('^[\\s0-9+()\\-]{8,20}$')]],
      nationality: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.accommodationId = params['accommodation_id'] || '';
      this.operatorId = params['operator_id'] || '';
      this.touristUserId = params['tourist_user_id'] || localStorage.getItem('tourist_user_id') || '';
      this.pricePerNight = +params['price'] || 0;

      // Recalculate total price initially
      this.calculateTotalPrice();

      // Load accommodation details from API
      if (this.accommodationId) {
        this.api.getAccommodationById(this.accommodationId).subscribe({
          next: (res) => {
            const acc = res.data || res;
            this.pricePerNight = acc.price_per_night || acc.price || acc.amount || this.pricePerNight;
            this.accommodationDetails = acc;

            // Recalculate total after API call
            this.calculateTotalPrice();
          },
          error: (err) => console.error('Failed to load accommodation details:', err)
        });
      }

      // Autofill user info
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

      // Recalculate total price whenever form changes
      this.bookingForm.valueChanges.subscribe(() => this.calculateTotalPrice());
    });
  }

  onStartDateSelected(event: any) {
    const startDate = event.detail.value;
    this.bookingForm.patchValue({ start_date: startDate });

    const endDate = new Date(this.bookingForm.get('end_date')?.value);
    if (new Date(startDate) > endDate) {
      this.bookingForm.patchValue({ end_date: startDate });
    }

    this.calculateTotalPrice();
  }

  onEndDateSelected(event: any) {
    this.bookingForm.patchValue({ end_date: event.detail.value });
    this.calculateTotalPrice();
  }

  calculateTotalPrice() {
    const startVal = this.bookingForm.get('start_date')?.value;
    const endVal = this.bookingForm.get('end_date')?.value;

    if (!startVal || !endVal) {
      this.totalPrice = 0;
      this.numberOfNights = 1;
      return;
    }

    const start = new Date(startVal);
    const end = new Date(endVal);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    let nights = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (nights < 1) nights = 1;

    this.numberOfNights = nights;

    // Total price is based only on nights (ignoring pax)
    this.totalPrice = this.pricePerNight * nights;
  }

async confirmCancel() {
  const alert = await this.alertController.create({
    header: 'Cancel Booking',
    message: 'Are you sure you want to cancel the booking?',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      { 
        text: 'Yes!', 
        handler: () => {
          // Navigate to Home page with sliding animation
          this.navCtrl.navigateRoot('/tourist/home', {
            animated: true,
            animationDirection: 'forward' // 'forward' slides left, 'back' slides right
          });
        } 
      },
    ],
  });
  await alert.present();
}


  logInvalidControls() {
    const invalid = [];
    const controls = this.bookingForm.controls;
    for (const name in controls) {
      if (controls[name].invalid) invalid.push(name);
    }
    console.log('Invalid controls:', invalid);
  }

  async submitBooking() {
    if (!this.touristUserId) {
      const alert = await this.alertController.create({
        header: 'Login Required',
        message: 'You need to log in to book this accommodation.',
        buttons: [
          { 
            text: 'Login', 
            handler: () => {
              this.navCtrl.navigateForward('/login', {
                queryParams: {
                  redirectTo: '/tourist/accommodation-booking',
                  accommodation_id: this.accommodationId,
                  operator_id: this.operatorId,
                  price: this.pricePerNight
                }
              });
            } 
          },
          { text: 'Cancel', role: 'cancel' }
        ],
      });
      await alert.present();
      return;
    }

    if (this.bookingForm.invalid) {
      this.logInvalidControls();
      const alert = await this.alertController.create({
        header: 'Incomplete Form',
        message: 'Please fill in all required fields correctly.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    if (!this.accommodationId) {
      const alert = await this.alertController.create({
        header: 'Missing Information',
        message: 'Accommodation ID is missing.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    const bookingData: any = {
      accommodation_id: this.accommodationId,
      operator_id: this.operatorId,
      tourist_user_id: this.touristUserId,
      no_of_pax: this.bookingForm.value.no_of_pax, 
      start_date: this.bookingForm.value.start_date,
      end_date: this.bookingForm.value.end_date,
      contact_name: this.bookingForm.value.contact_name,
      contact_phone: this.bookingForm.value.contact_phone,
      nationality: this.bookingForm.value.nationality,
      total_price: this.totalPrice, // ✅ correct total price
      number_of_nights: this.numberOfNights,
      status: 'pending',
      accommodation_name: this.accommodationDetails?.name || 'N/A',
      location: this.accommodationDetails?.address || 'N/A',
      image: this.accommodationDetails?.image || 'assets/placeholder.jpg',
      operator_name: 'N/A',
    };

    // ✅ Increment new booking notification counter
    const currentCount = parseInt(localStorage.getItem('newBookingCount') || '0', 10);
    localStorage.setItem('newBookingCount', (currentCount + 1).toString());


    this.navCtrl.navigateForward('/tourist/confirm-booking-accommodation-details', { state: bookingData });
  }
}
