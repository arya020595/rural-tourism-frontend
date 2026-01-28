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
  operatorActivityId = '';
  touristUserId = '';
  activityDetails: any = null;

  selectedDate: string = '';
  selectedTime: string = '';
  filteredDates: any[] = [];
  availableTimes: string[] = [];

  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  bookedSlots: { date: string; time: string }[] = [];
  calendarDays: { date: string; day: number; available: boolean; price?: number; time?: string }[] = [];
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  currentMonthLabel: string = '';

  monthYearOptions: { label: string; value: string }[] = [];
  monthYearSelectOptions = { header: 'Select Month & Year', message: '' };

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
      date: [this.formatDateToYYYYMMDD(new Date()), Validators.required],
      time: ['', Validators.required],
      contact_name: ['', Validators.required],
      contact_phone: ['', [Validators.required, Validators.pattern('^[\\s0-9+()\\-]{8,20}$')]],
      nationality: ['', Validators.required],
    });
  }

  ngOnInit() {
    const state = history.state || {};

    // Core IDs
    this.activityId = state.activityId || this.route.snapshot.queryParamMap.get('activity_id') || '';
    this.operatorId = state.operatorId || state.rt_user_id || this.route.snapshot.queryParamMap.get('operator_id') || '';
    this.operatorActivityId = state.operatorActivityId || '';
    this.touristUserId = state.touristUserId || localStorage.getItem('tourist_user_id') || '';
    this.pricePerPax = +state.price || 0;

    // Load preloaded available dates
    if (state.availableDates && Array.isArray(state.availableDates)) {
      this.activityDetails = { ...state, available_dates_list: state.availableDates };
      this.filteredDates = [...this.activityDetails.available_dates_list];
      if (!this.operatorActivityId && state.operatorActivityId) this.operatorActivityId = state.operatorActivityId;
    }

    // Fetch activity details if not provided
    if (!this.activityDetails && this.activityId) {
      this.api.getActivityById(this.activityId).subscribe(res => {
        const activity = res?.data && Array.isArray(res.data) ? res.data[0] : res || {};
        activity.available_dates_list = Array.isArray(activity.available_dates_list) ? activity.available_dates_list : [];

        this.activityDetails = activity;
        this.filteredDates = activity.available_dates_list;

        // Generate calendar and month-year options
        this.generateMonthYearOptions();
        this.loadBookedSlots();
        this.generateCalendar();
        this.calculateTotalPrice();
        this.cdr.detectChanges();

        // Preselect first available date
        if (this.filteredDates.length > 0) this.selectBookingDate(this.filteredDates[0]);
      });
    } else {
      // Already have dates
      if (this.filteredDates.length > 0) this.selectBookingDate(this.filteredDates[0]);
      this.generateMonthYearOptions();
      this.loadBookedSlots();
      this.generateCalendar();
      this.calculateTotalPrice();
    }

    // Prefill tourist info
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

    // Update total price when pax changes
    this.bookingForm.get('no_of_pax')?.valueChanges.subscribe(() => this.calculateTotalPrice());
  }

  selectBookingDate(dateEntry: { date: string }) {
    this.selectedDate = dateEntry.date;
    this.bookingForm.patchValue({ date: this.selectedDate });

    const slotsForDate = this.activityDetails.available_dates_list.filter(
      (d: { date: string }) => d.date === dateEntry.date
    );

    // Map available times
    this.availableTimes = slotsForDate
      .map((slot: { time?: string; startTime?: string; endTime?: string }) =>
        slot.time ?? (slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}` : '')
      )
      .filter((time: string) => !this.bookedSlots.some(b => b.date === dateEntry.date && b.time === time));

    // Default selection
    this.selectedTime = this.availableTimes[0] || '';
    this.bookingForm.patchValue({ time: this.selectedTime });

    // Find the selected slot to assign operator info
const selectedSlot = slotsForDate.find((slot: {
  time?: string;
  startTime?: string;
  endTime?: string;
  price?: number;
  operator_id?: string;
  operator_activity_id?: string;
}) =>
  (slot.time ?? (slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}` : '')) === this.selectedTime
);

    if (selectedSlot) {
      this.operatorId = selectedSlot.operator_id || this.operatorId;
      this.operatorActivityId = selectedSlot.operator_activity_id || this.operatorActivityId;
      this.pricePerPax = Number(selectedSlot.price ?? this.pricePerPax);
    }

    this.calculateTotalPrice();
  }

  calculateTotalPrice() {
    const pax = this.bookingForm.get('no_of_pax')?.value || 0;
    this.totalPrice = this.pricePerPax * pax;
  }

  formatDateToYYYYMMDD(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  generateMonthYearOptions() {
    const monthsSet = new Set<string>();
    this.activityDetails?.available_dates_list.forEach((d: any) => {
      const date = new Date(d.date);
      monthsSet.add(`${date.getFullYear()}-${date.getMonth() + 1}`);
    });

    this.monthYearOptions = Array.from(monthsSet).map(val => {
      const [year, month] = val.split('-').map(Number);
      return {
        label: new Date(year, month - 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
        value: val
      };
    });
  }

  generateCalendar() {
    this.calendarDays = [];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const lastDate = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) this.calendarDays.push({ date: '', day: 0, available: false });

    for (let day = 1; day <= lastDate; day++) {
      const dateObj = new Date(this.currentYear, this.currentMonth, day);
      const dateStr = this.formatDateToYYYYMMDD(dateObj);

      const slotsForDate = this.activityDetails?.available_dates_list?.filter((d: any) => d.date === dateStr) || [];
      const bookedForDate = this.bookedSlots.filter(b => b.date === dateStr);

      const isFullyBooked = slotsForDate.every((slot: any) => {
        const slotTime = slot.time ?? (slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}` : '');
        return bookedForDate.some(booked => booked.time === slotTime);
      });

      this.calendarDays.push({
        date: dateStr,
        day,
        available: slotsForDate.length > 0 && !isFullyBooked,
        price: Number(slotsForDate[0]?.price ?? 0),
      });
    }

    this.currentMonthLabel = new Date(this.currentYear, this.currentMonth).toLocaleString('en-GB', {
      month: 'long',
      year: 'numeric',
    });
  }

  loadBookedSlots() {
    if (!this.activityId) return;

    // ✅ Use operator-scoped bookings if needed:
    this.api.getBookedDatesByActivity(this.activityId).subscribe(res => {
      this.bookedSlots = res?.data || [];
      this.generateCalendar();
      this.cdr.detectChanges();
    });
  }

  async confirmCancel() {
    const alert = await this.alertController.create({
      header: 'Cancel Booking',
      message: 'Are you sure you want to cancel the booking?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Yes!',
          handler: () => this.navCtrl.navigateRoot('/tourist/home', { animated: true, animationDirection: 'forward' }),
        },
      ],
    });
    await alert.present();
  }

  onMonthYearChange(event: any) {
    const [year, month] = event.detail.value.split('-').map(Number);
    this.filteredDates = this.activityDetails.available_dates_list.filter((d: any) => {
      const date = new Date(d.date);
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    });

    if (this.filteredDates.length > 0) this.selectBookingDate(this.filteredDates[0]);
    this.currentYear = year;
    this.currentMonth = month - 1;
    this.generateCalendar();
  }

  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else this.currentMonth--;
    this.generateCalendar();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else this.currentMonth++;
    this.generateCalendar();
  }

  submitBooking() {
    if (this.bookingForm.invalid) return;

    if (!this.operatorId) {
      this.alertController.create({
        header: 'Booking Error',
        message: 'Operator information is missing. Please try again later.',
        buttons: ['OK']
      }).then(alert => alert.present());
      return;
    }

    const bookingData = {
      activity_id: this.activityId,
      operator_activity_id: this.operatorActivityId,
      operator_id: this.operatorId,
      tourist_user_id: this.touristUserId,
      no_of_pax: this.bookingForm.value.no_of_pax,
      date: this.bookingForm.value.date,
      time: this.bookingForm.value.time,
      contact_name: this.bookingForm.value.contact_name,
      contact_phone: this.bookingForm.value.contact_phone,
      nationality: this.bookingForm.value.nationality,
      total_price: this.totalPrice,
      available_dates_list: this.filteredDates,
      status: 'pending',

      activity_name: this.activityDetails?.activity_name || '',
      operator_name: this.activityDetails?.rt_user_name || '',
      operator_image: this.activityDetails?.image || '',
      location: this.activityDetails?.location || ''
    };

    this.navCtrl.navigateForward('/tourist/confirm-booking-details', { state: bookingData });
  }
}
