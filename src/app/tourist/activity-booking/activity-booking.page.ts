import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';

interface Slot {
  date: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  price?: number;
  operator_id?: string;
  operator_activity_id?: string;
}

interface BookedSlot {
  date: string;
  time?: string;
  startTime?: string;
  endTime?: string;
}

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
  filteredDates: Slot[] = [];
  availableTimes: string[] = [];

  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  bookedSlots: BookedSlot[] = [];
  calendarDays: {
    date: string;
    day: number;
    available: boolean;
    price?: number;
  }[] = [];

  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  currentMonthLabel: string = '';

  monthYearOptions: { label: string; value: string }[] = [];

  monthYearSelectOptions = {
    header: 'Select Month & Year',
    buttons: [
      {
        text: 'Submit',
        handler: () => true,
        cssClass: 'red-text-left', // Custom class for red text
      },
      {
        text: 'Cancel',
        role: 'cancel',
      },
    ],
  };

  timeSelectOptions = {
    header: 'Select Available Scheduled Time',
    buttons: [
      {
        text: 'Submit',
        handler: () => true,
        cssClass: 'red-text-left',
      },
      {
        text: 'Cancel',
        role: 'cancel',
      },
    ],
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: ApiService,
    private navCtrl: NavController,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef,
  ) {
    this.bookingForm = this.fb.group({
      no_of_pax: [1, [Validators.required, Validators.min(1)]],
      date: [this.formatDateToYYYYMMDD(new Date()), Validators.required],
      time: ['', Validators.required],
      contact_name: ['', Validators.required],
      contact_phone: [
        '',
        [Validators.required, Validators.pattern('^[\\s0-9+()\\-]{8,20}$')],
      ],
      nationality: ['', Validators.required],
    });
  }

  ngOnInit() {
    const state = history.state || {};

    this.activityId =
      state.activityId ||
      this.route.snapshot.queryParamMap.get('activity_id') ||
      '';

    this.operatorId =
      state.operatorId ||
      state.rt_user_id ||
      this.route.snapshot.queryParamMap.get('operator_id') ||
      '';

    this.operatorActivityId = state.operatorActivityId || '';
    this.touristUserId =
      state.touristUserId || localStorage.getItem('tourist_user_id') || '';

    this.pricePerPax = +state.price || 0;

    if (state.availableDates && Array.isArray(state.availableDates)) {
      this.activityDetails = {
        ...state,
        available_dates_list: state.availableDates,
      };
      this.filteredDates = [...this.activityDetails.available_dates_list];
    }

    if (!this.activityDetails && this.activityId) {
      this.api.getActivityById(this.activityId).subscribe((res) => {
        const activity =
          res?.data && Array.isArray(res.data) ? res.data[0] : res || {};

        activity.available_dates_list = Array.isArray(
          activity.available_dates_list,
        )
          ? activity.available_dates_list
          : [];

        this.activityDetails = activity;
        this.filteredDates = activity.available_dates_list;

        this.generateMonthYearOptions();
        this.loadBookedSlots();
        this.generateCalendar();
        this.autoSelectFirstAvailableDate();
        this.setCalendarToFirstAvailableDate();
        this.calculateTotalPrice();
        this.cdr.detectChanges();
      });
    } else {
      this.generateMonthYearOptions();
      this.loadBookedSlots();
      this.generateCalendar();
      this.autoSelectFirstAvailableDate();
      this.setCalendarToFirstAvailableDate();
      this.calculateTotalPrice();
    }

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

    this.bookingForm
      .get('no_of_pax')
      ?.valueChanges.subscribe(() => this.calculateTotalPrice());
  }

  normalizeTime(slot: Slot | BookedSlot): string {
    return (
      slot.time ??
      (slot.startTime && slot.endTime
        ? `${slot.startTime} - ${slot.endTime}`
        : '')
    );
  }

  updateAvailableTimes(date: string) {
    const slotsForDate: Slot[] =
      this.activityDetails.available_dates_list.filter(
        (d: Slot) => d.date === date,
      );

    this.availableTimes = slotsForDate
      .filter((slot: Slot) => {
        const slotTime = this.normalizeTime(slot);
        return !this.bookedSlots.some(
          (b: BookedSlot) =>
            b.date === date && this.normalizeTime(b) === slotTime,
        );
      })
      .map((slot: Slot) => this.normalizeTime(slot));

    this.selectedDate = date;
    this.selectedTime = this.availableTimes[0] || '';
    this.bookingForm.patchValue({ date, time: this.selectedTime });

    const selectedSlot = slotsForDate.find(
      (slot: Slot) => this.normalizeTime(slot) === this.selectedTime,
    );

    if (selectedSlot) {
      this.operatorId = selectedSlot.operator_id || this.operatorId;
      this.operatorActivityId =
        selectedSlot.operator_activity_id || this.operatorActivityId;
      this.pricePerPax = Number(selectedSlot.price ?? this.pricePerPax);
    }

    this.calculateTotalPrice();
  }

  setCalendarToFirstAvailableDate() {
    if (!this.activityDetails?.available_dates_list?.length) return;

    const sortedDates = [...this.activityDetails.available_dates_list].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const firstDate = new Date(sortedDates[0].date);
    this.currentYear = firstDate.getFullYear();
    this.currentMonth = firstDate.getMonth();
  }

  autoSelectFirstAvailableDate() {
    for (const dateEntry of this.filteredDates) {
      const slotsForDate = this.activityDetails.available_dates_list.filter(
        (d: Slot) => d.date === dateEntry.date,
      );

      const hasAvailableSlot = slotsForDate.some(
        (slot: Slot) =>
          !this.bookedSlots.some(
            (b: BookedSlot) =>
              b.date === dateEntry.date &&
              this.normalizeTime(b) === this.normalizeTime(slot),
          ),
      );

      if (hasAvailableSlot) {
        this.updateAvailableTimes(dateEntry.date);
        return;
      }
    }

    this.availableTimes = [];
    this.selectedTime = '';
  }

  selectBookingDate(dateEntry: Slot) {
    this.updateAvailableTimes(dateEntry.date);
  }

  calculateTotalPrice() {
    const pax = this.bookingForm.get('no_of_pax')?.value || 0;
    this.totalPrice = this.pricePerPax * pax;
  }

  formatDateToYYYYMMDD(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(date.getDate()).padStart(2, '0')}`;
  }

  generateMonthYearOptions() {
    const monthsSet = new Set<string>();
    this.activityDetails?.available_dates_list.forEach((d: Slot) => {
      const date = new Date(d.date);
      monthsSet.add(`${date.getFullYear()}-${date.getMonth() + 1}`);
    });

    this.monthYearOptions = Array.from(monthsSet).map((val) => {
      const [year, month] = val.split('-').map(Number);
      return {
        label: new Date(year, month - 1).toLocaleString('en-GB', {
          month: 'long',
          year: 'numeric',
        }),
        value: val,
      };
    });
  }

  generateCalendar() {
    this.calendarDays = [];

    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const lastDate = new Date(
      this.currentYear,
      this.currentMonth + 1,
      0,
    ).getDate();

    for (let i = 0; i < firstDay; i++) {
      this.calendarDays.push({ date: '', day: 0, available: false });
    }

    for (let day = 1; day <= lastDate; day++) {
      const dateStr = this.formatDateToYYYYMMDD(
        new Date(this.currentYear, this.currentMonth, day),
      );

      const slotsForDate =
        this.activityDetails?.available_dates_list?.filter(
          (d: Slot) => d.date === dateStr,
        ) || [];

      const isFullyBooked =
        slotsForDate.length > 0 &&
        slotsForDate.every((slot: Slot) =>
          this.bookedSlots.some(
            (b: BookedSlot) =>
              b.date === dateStr &&
              this.normalizeTime(b) === this.normalizeTime(slot),
          ),
        );

      this.calendarDays.push({
        date: dateStr,
        day,
        available: slotsForDate.length > 0 && !isFullyBooked,
        price: slotsForDate[0]?.price ?? 0,
      });
    }

    this.currentMonthLabel = new Date(
      this.currentYear,
      this.currentMonth,
    ).toLocaleString('en-GB', {
      month: 'long',
      year: 'numeric',
    });
  }

  loadBookedSlots() {
    if (!this.activityId) return;

    this.api.getBookedDatesByActivity(this.activityId).subscribe((res) => {
      this.bookedSlots = res?.data || [];
      this.generateCalendar();
      this.autoSelectFirstAvailableDate();
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

  onMonthYearChange(event: any) {
    const [year, month] = event.detail.value.split('-').map(Number);

    this.filteredDates = this.activityDetails.available_dates_list.filter(
      (d: Slot) => {
        const date = new Date(d.date);
        return date.getFullYear() === year && date.getMonth() + 1 === month;
      },
    );

    this.currentYear = year;
    this.currentMonth = month - 1;
    this.generateCalendar();
    this.autoSelectFirstAvailableDate();
  }

  prevMonth() {
    this.currentMonth === 0
      ? ((this.currentMonth = 11), this.currentYear--)
      : this.currentMonth--;

    this.generateCalendar();
    this.autoSelectFirstAvailableDate();
  }

  nextMonth() {
    this.currentMonth === 11
      ? ((this.currentMonth = 0), this.currentYear++)
      : this.currentMonth++;

    this.generateCalendar();
    this.autoSelectFirstAvailableDate();
  }

  submitBooking() {
    if (this.bookingForm.invalid) return;

    if (!this.operatorId) {
      this.alertController
        .create({
          header: 'Booking Error',
          message: 'Operator information is missing.',
          buttons: ['OK'],
        })
        .then((a) => a.present());
      return;
    }

    this.navCtrl.navigateForward('/tourist/confirm-booking-details', {
      state: {
        activity_id: this.activityId,
        operator_activity_id: this.operatorActivityId,
        operator_id: this.operatorId,
        tourist_user_id: this.touristUserId,
        ...this.bookingForm.value,
        total_price: this.totalPrice,
        available_dates_list: this.filteredDates,
        status: 'Booked',
        activity_name: this.activityDetails?.activity_name || '',
        operator_name: this.activityDetails?.rt_user_name || '',
        operator_image: this.activityDetails?.image || '',
        location: this.activityDetails?.location || '',
      },
    });
  }
}
