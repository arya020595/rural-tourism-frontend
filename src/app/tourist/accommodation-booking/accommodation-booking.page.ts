import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-accommodation-booking',
  templateUrl: './accommodation-booking.page.html',
  styleUrls: ['./accommodation-booking.page.scss'],
})
export class AccommodationBookingPage implements OnInit {
  bookingForm: FormGroup;

  totalPrice = 0;
  numberOfNights = 0;
  pricePerNight = 0;
  selectedNightBreakdown: { date: string; price: number }[] = [];
  hasBookableRange = true;
  roomOptions: number[] = [1];
  maxRoomsForSelection = 1;

  accommodationId = '';
  operatorId = '';
  touristUserId = '';
  accommodationDetails: any = null;
  mappedDatePrice: { [key: string]: number } = {};
  mappedDateQuota: { [key: string]: number } = {};

  // Calendar properties
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarDays: {
    date: string;
    day: number;
    available: boolean;
    isPast?: boolean;
    isBooked?: boolean;
    price?: number;
    isCheckIn?: boolean;
    isCheckOut?: boolean;
    inRange?: boolean;
  }[] = [];
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  currentMonthLabel: string = '';

  // Date selection
  checkInDate: string = '';
  checkOutDate: string = '';
  bookedDates: string[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: ApiService,
    private navCtrl: NavController,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef,
  ) {
    this.bookingForm = this.fb.group({
      no_of_rooms: [1, [Validators.required, Validators.min(1)]],
      contact_name: ['', Validators.required],
      contact_email: ['', [Validators.required, Validators.email]],
      contact_phone: [
        '',
        [Validators.required, Validators.pattern('^[\\s0-9+()\\-]{8,20}$')],
      ],
      nationality: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.accommodationId = params['accommodation_id'] || '';
      this.operatorId = params['operator_id'] || '';
      this.touristUserId =
        params['tourist_user_id'] ||
        localStorage.getItem('tourist_user_id') ||
        '';
      this.pricePerNight = +params['price'] || 0;
      const initialRoomCount = +(params['no_of_rooms'] || 1);
      this.bookingForm.patchValue({
        no_of_rooms: initialRoomCount >= 1 ? initialRoomCount : 1,
      });

      // Load accommodation details from API
      if (this.accommodationId) {
        this.api.getAccommodationById(this.accommodationId).subscribe({
          next: (res) => {
            const acc = res.data || res;
            this.pricePerNight =
              acc.price_per_night ||
              acc.price ||
              acc.amount ||
              this.pricePerNight;
            this.accommodationDetails = acc;
            this.loadBookedDates();

            // mapped date to price
            this.mappedDatePrice = (this.accommodationDetails?.availabilities ?? []).reduce((acc: { [x: string]: any; }, item: { date: string; price: any; }) => {
              const date = item.date.split('T')[0];
              acc[date] = item.price;
              return acc;
            }, {} as { [key: string]: number });

            // mapped date to room quota (fallback to 1 when field is missing)
            this.mappedDateQuota = (this.accommodationDetails?.availabilities ?? []).reduce((acc: { [x: string]: any; }, item: any) => {
              const date = item.date.split('T')[0];
              acc[date] = this.extractAvailabilityQuota(item);
              return acc;
            }, {} as { [key: string]: number });
          },
          error: (err) => {
            console.error('Failed to load accommodation details:', err);
            // Initialize calendar even if accommodation details fail to load
            this.generateCalendar();
          },
        });
      } else {
        // Initialize calendar even if no accommodationId is provided
        this.generateCalendar();
      }

      // Autofill user info
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        this.bookingForm.patchValue({
          contact_name: user.full_name || '',
          contact_email: user.email || user.user_email || '',
          contact_phone: (user.contact_no || user.phone || '').trim(),
          nationality: (user.nationality || '').trim(),
        });
        this.touristUserId = user.tourist_user_id || this.touristUserId;
        localStorage.setItem('tourist_user_id', this.touristUserId);
      }

      // Recalculate total price whenever number of rooms changes
      this.bookingForm
        .get('no_of_rooms')
        ?.valueChanges.subscribe(() => this.calculateTotalPrice());
    });
  }

  loadBookedDates() {
    if (!this.accommodationId) return;

    this.api.getBookedDatesByAccommodation(this.accommodationId).subscribe({
      next: (res) => {
        this.bookedDates = res?.data || [];
        this.generateCalendar();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load booked dates:', err);
        this.bookedDates = [];
        this.generateCalendar();
      },
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      this.calendarDays.push({ date: '', day: 0, available: false });
    }
    
    
    for (let day = 1; day <= lastDate; day++) {
      const dateObj = new Date(this.currentYear, this.currentMonth, day);
      const dateStr = this.formatDateToYYYYMMDD(dateObj);

      // Check if date is in the past
      const isPast = dateObj < today;

      // Check if date is already booked
      const isBooked = this.bookedDates.includes(dateStr);

      // Date is available if not in the past and not booked
      const isAvailable = !isPast && !isBooked;

      // Check if this date is check-in, check-out, or in range
      const isCheckIn = dateStr === this.checkInDate;
      const isCheckOut = dateStr === this.checkOutDate;
      const inRange = this.isDateInRange(dateStr);

      this.calendarDays.push({
        date: dateStr,
        day,
        available:
          isAvailable &&
          this.mappedDatePrice[dateStr] !== undefined &&
          (this.mappedDateQuota[dateStr] ?? 1) >= 1,
        isPast,
        isBooked,
        // price: isAvailable ? this.pricePerNight : undefined,
        price:  this.mappedDatePrice[dateStr] ?? undefined,
        isCheckIn,
        isCheckOut,
        inRange,
      });
    }

    this.currentMonthLabel = new Date(
      this.currentYear,
      this.currentMonth,
    ).toLocaleString('en-GB', {
      month: 'long',
      year: 'numeric',
    });
    this.hasBookableRange = this.hasAtLeastOneBookableRange();
    this.updateRoomOptions();
  }

  isDateInRange(dateStr: string): boolean {
    if (!this.checkInDate || !this.checkOutDate) return false;
    return dateStr > this.checkInDate && dateStr < this.checkOutDate;
  }

  parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  addDays(dateStr: string, days: number): string {
    const date = this.parseLocalDate(dateStr);
    date.setDate(date.getDate() + days);
    return this.formatDateToYYYYMMDD(date);
  }

  isDateBookable(dateStr: string): boolean {
    if (!dateStr || this.mappedDatePrice[dateStr] === undefined) return false;
    if (this.bookedDates.includes(dateStr)) return false;
    if ((this.mappedDateQuota[dateStr] ?? 1) < 1) return false;

    const date = this.parseLocalDate(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    return date >= today;
  }

  isDateRangeBookable(startDate: string, endDate: string): boolean {
    if (!startDate || !endDate || endDate <= startDate) return false;

    let cursor = startDate;
    while (cursor < endDate) {
      if (!this.isDateBookable(cursor)) return false;
      cursor = this.addDays(cursor, 1);
    }
    return true;
  }

  hasAtLeastOneBookableRange(): boolean {
    const availableDates = Object.keys(this.mappedDatePrice).filter((date) =>
      this.isDateBookable(date),
    );
    const availableDateSet = new Set(availableDates);

    return availableDates.some((date) => availableDateSet.has(this.addDays(date, 1)));
  }

  extractAvailabilityQuota(item: any): number {
    const quotaCandidates = [
      item?.quota,
      item?.room_quota,
      item?.rooms,
      item?.no_of_rooms,
      item?.available_rooms,
      item?.room_available,
      item?.max_rooms,
      item?.capacity,
    ];

    for (const candidate of quotaCandidates) {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed) && parsed >= 0) {
        return Math.floor(parsed);
      }
    }

    return 1;
  }

  updateRoomOptions() {
    const hasSelectedRange = !!this.checkInDate && !!this.checkOutDate;
    let nextMaxRooms = 1;

    if (hasSelectedRange) {
      const quotas: number[] = [];
      let dateCursor = this.checkInDate;

      while (dateCursor < this.checkOutDate) {
        const dailyQuota = this.mappedDateQuota[dateCursor] ?? 1;
        quotas.push(Math.max(0, dailyQuota));
        dateCursor = this.addDays(dateCursor, 1);
      }

      nextMaxRooms = quotas.length ? Math.min(...quotas) : 1;
    }

    this.maxRoomsForSelection = Math.max(1, nextMaxRooms);
    this.roomOptions = Array.from(
      { length: this.maxRoomsForSelection },
      (_, idx) => idx + 1,
    );

    const currentRooms = Number(this.bookingForm.get('no_of_rooms')?.value) || 1;
    const clampedRooms = Math.min(
      Math.max(1, currentRooms),
      this.maxRoomsForSelection,
    );

    if (clampedRooms !== currentRooms) {
      this.bookingForm.patchValue(
        { no_of_rooms: clampedRooms },
        { emitEvent: false },
      );
    }
  }

  formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDateForDisplay(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  async selectDate(day: { date: string; available: boolean }) {
    if (!day.available || !day.date) return;

    // If clicking on the same check-in date, unselect it
    if (day.date === this.checkInDate && !this.checkOutDate) {
      this.checkInDate = '';
      this.checkOutDate = '';
      this.calculateTotalPrice();
      this.generateCalendar();
      return;
    }

    // If clicking on the check-out date, unselect it
    if (day.date === this.checkOutDate) {
      this.checkOutDate = '';
      this.calculateTotalPrice();
      this.generateCalendar();
      return;
    }

    if (!this.checkInDate) {
      // First click - set check-in date
      this.checkInDate = day.date;
    } else if (!this.checkOutDate) {
      // Second click - set check-out date
      if (day.date <= this.checkInDate) {
        // If clicked date is before or same as check-in, reset and set as new check-in
        this.checkInDate = day.date;
        this.checkOutDate = '';
      } else {
        if (!this.isDateRangeBookable(this.checkInDate, day.date)) {
          const alert = await this.alertController.create({
            header: 'Invalid Date Range',
            message:
              'Some nights in this range are unavailable. Please select another check-out date.',
            buttons: ['OK'],
          });
          await alert.present();
          return;
        }
        this.checkOutDate = day.date;
      }
    } else {
      // Third click - reset and start over
      this.checkInDate = day.date;
      this.checkOutDate = '';
    }

    this.generateCalendar();
    this.calculateTotalPrice();
  }

  handleKeyPress(
    event: KeyboardEvent,
    day: { date: string; available: boolean },
  ) {
    // Handle Enter or Space key to select date
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectDate(day);
    }
  }

  getAriaLabel(day: any): string {
    if (!day.date) return '';

    const date = new Date(day.date);
    const dateStr = date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let status = '';
    if (day.isPast) {
      status = 'Past date, not available';
    } else if (day.isBooked) {
      status = 'Already booked, not available';
    } else if (day.isCheckIn) {
      status = 'Selected as check-in date';
    } else if (day.isCheckOut) {
      status = 'Selected as check-out date';
    } else if (day.inRange) {
      status = 'In selected range';
    } else if (day.available) {
      status = `Available, RM ${day.price} per night`;
    } else {
      status = 'Not available';
    }

    return `${dateStr}, ${status}`;
  }

  calculateTotalPrice() {
    if (!this.checkInDate || !this.checkOutDate) {
      this.totalPrice = 0;
      this.numberOfNights = 0;
      this.selectedNightBreakdown = [];
      return;
    }

    const start = new Date(this.checkInDate);
    const end = new Date(this.checkOutDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    let nights = Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (nights < 1) nights = 1;

    const selectedNights: { date: string; price: number }[] = [];
    let runningDate = this.checkInDate;
    let total = 0;
    const selectedRooms = Number(this.bookingForm.get('no_of_rooms')?.value) || 1;

    while (runningDate < this.checkOutDate) {
      const nightlyPrice = this.mappedDatePrice[runningDate] ?? this.pricePerNight;
      selectedNights.push({ date: runningDate, price: nightlyPrice });
      total += nightlyPrice;
      runningDate = this.addDays(runningDate, 1);
    }

    this.numberOfNights = nights;
    this.selectedNightBreakdown = selectedNights;
    this.totalPrice = total * selectedRooms;
  }

  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
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

  logInvalidControls() {
    const invalid = [];
    const controls = this.bookingForm.controls;
    for (const name in controls) {
      if (controls[name].invalid) invalid.push(name);
    }
    console.log('Invalid controls:', invalid);
  }

  async submitBooking() {
    if (!this.hasBookableRange) {
      const alert = await this.alertController.create({
        header: 'No Valid Stay Range',
        message:
          'At least two consecutive available dates are required to book 1 night.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }
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
                  price: this.pricePerNight,
                },
              });
            },
          },
          { text: 'Cancel', role: 'cancel' },
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

    if (!this.checkInDate || !this.checkOutDate) {
      const alert = await this.alertController.create({
        header: 'Select Dates',
        message: 'Please select check-in and check-out dates.',
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
      no_of_rooms: this.bookingForm.value.no_of_rooms,
      no_of_pax: this.bookingForm.value.no_of_rooms,
      start_date: this.checkInDate,
      end_date: this.checkOutDate,
      contact_name: this.bookingForm.value.contact_name,
      contact_email: this.bookingForm.value.contact_email,
      contact_phone: this.bookingForm.value.contact_phone,
      nationality: this.bookingForm.value.nationality,
      total_price: this.totalPrice,
      number_of_nights: this.numberOfNights,
      status: 'pending',
      accommodation_name: this.accommodationDetails?.name || 'N/A',
      location: this.accommodationDetails?.address || 'N/A',
      image: this.accommodationDetails?.image || 'assets/placeholder.jpg',
      operator_name: 'N/A',
    };

    // Increment new booking notification counter
    const currentCount = parseInt(
      localStorage.getItem('newBookingCount') || '0',
      10,
    );
    localStorage.setItem('newBookingCount', (currentCount + 1).toString());

    this.navCtrl.navigateForward(
      '/tourist/confirm-booking-accommodation-details',
      { state: bookingData },
    );
  }
}
