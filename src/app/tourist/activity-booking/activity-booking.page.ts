import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  selectedDate: string = '';

  monthYearOptions: { label: string; value: string }[] = [];
  filteredDates: any[] = []; // always initialized to empty array

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: ApiService,
    private navCtrl: NavController,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef
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
    const state = history.state;

    if (state && Object.keys(state).length > 0) {
      this.activityId = state.activityId || '';
      this.operatorId = state.operatorId || '';
      this.touristUserId =
        state.touristUserId || localStorage.getItem('tourist_user_id') || '';
      this.pricePerPax = +state.price || 0;

      if (state.availableDates && Array.isArray(state.availableDates)) {
        this.activityDetails = {
          ...state,
          available_dates_list: state.availableDates,
        };

        this.filteredDates = [...this.activityDetails.available_dates_list];
        if (this.activityDetails.available_dates_list.length > 0) {
          this.generateMonthYearOptions();
          this.selectBookingDate(this.activityDetails.available_dates_list[0]);
        }
      }
    }

    // ✅ Handle queryParams fallback (for login redirects)
    this.route.queryParams.subscribe((params) => {
      if (!this.activityId) this.activityId = params['activity_id'] || '';
      if (!this.operatorId) this.operatorId = params['operator_id'] || '';
      if (!this.touristUserId)
        this.touristUserId =
          params['tourist_user_id'] || localStorage.getItem('tourist_user_id') || '';
      if (!this.pricePerPax) this.pricePerPax = +params['price'] || 0;

      // Parse availableDates from queryParams if activityDetails not set
      if (!this.activityDetails) {
        let availableDates: any[] = [];
        if (params['availableDates']) {
          try {
            const dates = JSON.parse(params['availableDates']);
            availableDates = Array.isArray(dates) ? dates : [];
          } catch (err) {
            console.error('Failed to parse availableDates from queryParams:', err);
          }
        }

        if (this.activityId) {
          // Fetch activity details from API
          this.api.getActivityById(this.activityId).subscribe({
            next: (res) => {
              const activity =
                res?.data && Array.isArray(res.data) ? res.data[0] : res || {};

              // Merge availableDates from queryParams if exists
              if (availableDates.length > 0) {
                activity.available_dates_list = availableDates;
              } else if (Array.isArray(activity.available_dates_list)) {
                // already exists
              } else if (typeof activity.available_dates === 'string') {
                try {
                  activity.available_dates_list = JSON.parse(activity.available_dates);
                } catch {
                  activity.available_dates_list = [];
                }
              } else if (Array.isArray(activity.available_dates)) {
                activity.available_dates_list = activity.available_dates;
              } else {
                activity.available_dates_list = [];
              }

              this.activityDetails = activity;
              this.filteredDates = this.activityDetails.available_dates_list || [];

              if (this.filteredDates.length > 0) {
                this.selectBookingDate(this.filteredDates[0]);
              }

              this.generateMonthYearOptions();
              this.cdr.detectChanges();
              this.calculateTotalPrice();
            },
            error: (err) => console.error('Failed to load activity details:', err),
          });
        }
      }
    });

    // Fill user info if available
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

    this.bookingForm.get('no_of_pax')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });

    this.calculateTotalPrice();
  }


  monthYearSelectOptions = {
  header: 'Select Month & Year', // This is the header text
  message: '', // optional message
};


  selectBookingDate(dateEntry: any) {
    this.selectedDate = dateEntry.date;
    this.bookingForm.patchValue({ date: dateEntry.date });
    this.pricePerPax = +dateEntry.price || this.pricePerPax;
    this.calculateTotalPrice();
  }

  formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  // Convert 24-hour time string to 12-hour format with AM/PM
formatTime(timeStr: string): string {
  if (!timeStr) return '';
  
  // If timeStr is like "14:30"
  const [hourStr, minStr] = timeStr.split(':');
  const hour = Number(hourStr);
  const min = Number(minStr);
  const date = new Date();
  date.setHours(hour, min);

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}


  generateMonthYearOptions() {
    const monthsSet = new Set<string>();
    this.activityDetails?.available_dates_list.forEach((d: any) => {
      const date = new Date(d.date);
      monthsSet.add(`${date.getFullYear()}-${date.getMonth() + 1}`);
    });

    this.monthYearOptions = Array.from(monthsSet)
      .map((val) => {
        const [year, month] = val.split('-').map(Number);
        const label = new Date(year, month - 1).toLocaleString('en-GB', {
          month: 'long',
          year: 'numeric',
        });
        return { label, value: val };
      })
      .sort((a, b) => new Date(a.value) > new Date(b.value) ? 1 : -1);
  }

  onMonthYearChange(event: any) {
    const selected = event.detail.value;
    const [year, month] = selected.split('-').map(Number);

    this.filteredDates = this.activityDetails.available_dates_list.filter((d: any) => {
      const date = new Date(d.date);
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    });

    if (this.filteredDates.length > 0) {
      this.selectBookingDate(this.filteredDates[0]);
    }
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
        {
          text: 'Yes!',
          handler: () => {
            this.navCtrl.navigateRoot('/tourist/home', {
              animated: true,
              animationDirection: 'forward',
            });
          },
        },
      ],
    });
    await alert.present();
  }

  submitBooking() {
    if (this.bookingForm.invalid) {
      console.warn('Form is invalid');
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
      image: this.activityDetails?.image || 'assets/images/placeholder.jpg',
    };

    console.log('🚀 Activity booking data:', bookingData);

    // ✅ Increment new booking notification counter
    const currentCount = parseInt(localStorage.getItem('newBookingCount') || '0', 10);
    localStorage.setItem('newBookingCount', (currentCount + 1).toString());

    this.navCtrl.navigateForward('/tourist/confirm-booking-details', {
      state: bookingData,
    });
  }
}
