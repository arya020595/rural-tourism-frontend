import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';
import { BookingFilter, TouristOptionMapper } from '../utils/booking.utils';

@Component({
  selector: 'app-activity-form',
  templateUrl: './activity-form.page.html',
  styleUrls: ['./activity-form.page.scss'],
})
export class ActivityFormPage implements OnInit {
  preselectedBookingId: number | null = null;

  constructor(
    private apiService: ApiService,
    private navCtrl: NavController,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['bookingId']) {
        this.preselectedBookingId = Number(params['bookingId']);
      }
    });
    this.loadActivities();
    this.autofillOperator();
    this.loadTouristsFromBookings();
    this.loadAllTouristUsers();
  }

  form = {
    receipt_id: '',
    user_id: localStorage.getItem('uid')!,
    citizenship: 'Warganegara',
    pax: 0,
    pax_domestik: '',
    pax_antarabangsa: '',
    activity_name: '',
    location: '',
    activity_id: '',
    total_rm: '',
    issuer: '',
    operator_user_id: '',
    date: '',
    time: '',
    booking_type: 'guest',
    manual_tourist_name: '',
  };

  activities: any[] = [];
  selectedActivity: any = null;
  availableTimeSlots: string[] = [];
  pricePerPax: number = 0;

  touristOptions: any[] = [];
  filteredTouristOptions: any[] = [];
  touristSearchQuery: string = '';
  showTouristList: boolean = false;
  touristSelected: boolean = false; // drives green border — explicit, not string-truthy
  selectedTouristUserId: string = ''; // actual user_id sent to backend
  selectedTouristBookingId: string = ''; // unique booking_id used by the dropdown
  selectedTouristDisplayText: string = ''; // label shown after selection
  selectedBookingId: number | null = null;

  // Manual booking — tourist_users dropdown
  allTouristUsers: any[] = [];
  filteredManualTouristOptions: any[] = [];
  showManualTouristList: boolean = false;
  manualTouristSelected: boolean = false;
  selectedManualTouristUserId: string = '';
  selectedManualTouristContactPhone: string = '';
  selectedManualTouristNationality: string = '';

  // Available (unbooked) dates for the selected activity in manual mode
  availableManualDates: string[] = [];

  numbers: number[] = Array.from({ length: 20 }, (_, i) => i + 1);

  get isGuestAutofilled(): boolean {
    return this.form.booking_type === 'guest' && !!this.selectedTouristUserId;
  }

  // ---------------- Load All Tourist Users (for manual booking) ----------------
  loadAllTouristUsers() {
    this.apiService.getAllTouristUsers().subscribe(
      (res: any) => {
        const list: any[] = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        this.allTouristUsers = list.filter((t) => t.is_active !== false);
        this.filteredManualTouristOptions = [...this.allTouristUsers];
      },
      (err) => {
        console.error('Failed to load tourist users:', err);
        this.allTouristUsers = [];
      },
    );
  }

  // ---------------- Manual Tourist Search ----------------
  onManualTouristSearchFocus() {
    this.filteredManualTouristOptions = this.allTouristUsers.filter((t) =>
      (t.full_name || t.username || '')
        .toLowerCase()
        .includes((this.form.manual_tourist_name || '').toLowerCase().trim()),
    );
    this.showManualTouristList = true;
  }

  onManualTouristSearchInput(query: string) {
    const q = (query || '').toLowerCase().trim();
    this.filteredManualTouristOptions = q
      ? this.allTouristUsers.filter((t) =>
          (t.full_name || t.username || '').toLowerCase().includes(q),
        )
      : [...this.allTouristUsers];
    this.showManualTouristList = true;
    this.manualTouristSelected = false;
  }

  onManualTouristSearchBlur() {
    setTimeout(() => {
      this.showManualTouristList = false;
    }, 150);
  }

  selectManualTouristOption(tourist: any) {
    const name = tourist.full_name || tourist.username || '';
    this.form.manual_tourist_name = name;
    this.selectedManualTouristUserId = String(tourist.tourist_user_id || '');
    this.selectedManualTouristContactPhone = tourist.contact_no || '';
    this.selectedManualTouristNationality = tourist.nationality || '';
    // Auto-fill citizenship from tourist nationality
    const nat = (tourist.nationality || '').toLowerCase();
    if (nat) {
      this.form.citizenship =
        nat === 'malaysian' ? 'Warganegara' : 'Bukan Warganegara';
    }
    this.manualTouristSelected = true;
    this.showManualTouristList = false;
    this.filteredManualTouristOptions = [...this.allTouristUsers];
  }

  clearManualTouristSelection() {
    this.form.manual_tourist_name = '';
    this.selectedManualTouristUserId = '';
    this.selectedManualTouristContactPhone = '';
    this.selectedManualTouristNationality = '';
    this.manualTouristSelected = false;
    this.filteredManualTouristOptions = [...this.allTouristUsers];
    this.showManualTouristList = false;
  }

  // ---------------- Load Activities ----------------
  loadActivities() {
    const uid = localStorage.getItem('uid')!;
    this.apiService.getAllActByUser(uid).subscribe(
      (data) => {
        this.activities = data;
        // Re-trigger tourist change if tourist was auto-selected before
        // activities finished loading (race condition fix)
        if (this.selectedTouristBookingId) {
          this.onTouristChange(this.selectedTouristBookingId);
        }
      },
      (error) => {
        console.error('Failed to load activities:', error);
        this.activities = [];
      },
    );
  }

  // ---------------- Load Tourists ----------------
  loadTouristsFromBookings() {
    const operatorUid = localStorage.getItem('uid')!;
    this.apiService.getOperatorAllBookings(operatorUid).subscribe(
      (res: any) => {
        const bookings: any[] = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];

        // Filter: Only show ACTIVITY bookings (exclude accommodation bookings)
        const activityBookings = bookings.filter((b) => b.type === 'activity');

        // SOLID: Use BookingFilter utility (Single Responsibility)
        const unpaidBookings =
          BookingFilter.getUnpaidBookings(activityBookings);

        // SOLID: Use TouristOptionMapper (Interface Segregation)
        this.touristOptions = TouristOptionMapper.mapToOptions(unpaidBookings);
        this.filteredTouristOptions = [...this.touristOptions];

        // Auto-select if navigated from operator-bookings with a bookingId
        if (this.preselectedBookingId) {
          const match = this.touristOptions.find(
            (t) => t.booking_id === this.preselectedBookingId,
          );
          if (match) {
            this.showTouristList = false;
            this.touristSearchQuery = match.displayText;
            this.filteredTouristOptions = [...this.touristOptions];
            this.selectedTouristBookingId = match.booking_id;
            this.selectedTouristDisplayText = match.displayText;
            this.touristSelected = true;
            this.onTouristChange(match.booking_id);
          }
        }
      },
      (err) => {
        console.error('Failed to load tourists:', err);
        this.touristOptions = [];
      },
    );
  }

  // ---------------- Autofill Operator ----------------
  autofillOperator() {
    const operatorUid = localStorage.getItem('uid');
    if (!operatorUid) return;
    this.form.operator_user_id = operatorUid;
  }

  // ---------------- Generate Receipt ----------------
  generateReceiptId(): string {
    const randomPart = Math.floor(Math.random() * 10000000);
    return `PE${randomPart.toString().padStart(7, '0')}`;
  }

  // ---------------- Tourist Search ----------------
  filterTourists(query: string | null | undefined) {
    const q = (query || '').toLowerCase().trim();
    this.filteredTouristOptions = q
      ? this.touristOptions.filter((t) =>
          t.displayText.toLowerCase().includes(q),
        )
      : [...this.touristOptions];
  }

  // Called when searchbar loses focus — close dropdown unless operator clicked a list item
  // (the 150ms delay lets the item's click event fire first)
  onTouristSearchBlur() {
    setTimeout(() => {
      this.showTouristList = false;
    }, 150);
  }

  // Called on searchbar focus — clear text so operator can type fresh,
  // show full list. Dropdown stays open until a name is picked.
  onTouristSearchFocus() {
    this.touristSearchQuery = '';
    this.filteredTouristOptions = [...this.touristOptions];
    this.showTouristList = true;
  }

  // Called on ionInput — filter list, keep dropdown open
  onTouristSearchInput(query: string | null | undefined) {
    this.filterTourists(query);
    this.showTouristList = true;
  }

  // Only called when operator explicitly picks a name
  selectTouristOption(tourist: any) {
    this.showTouristList = false;
    this.touristSearchQuery = tourist.displayText; // show selected name in searchbar
    this.filteredTouristOptions = [...this.touristOptions];
    this.selectedTouristBookingId = tourist.booking_id;
    this.selectedTouristDisplayText = tourist.displayText;
    this.touristSelected = true;
    this.onTouristChange(tourist.booking_id);
  }

  // Called when the X button is tapped — fully resets selection
  clearTouristSelection() {
    this.touristSelected = false;
    this.selectedTouristBookingId = '';
    this.selectedTouristDisplayText = '';
    this.selectedTouristUserId = '';
    this.selectedBookingId = null;
    this.touristSearchQuery = '';
    this.filteredTouristOptions = [...this.touristOptions];
    this.showTouristList = false;
  }

  // ---------------- Booking Type Change ----------------
  onBookingTypeChange(type: string) {
    if (type === 'manual') {
      // Clear all autofilled data when switching to manual
      this.form.citizenship = 'Warganegara';
      this.form.pax_domestik = '';
      this.form.pax_antarabangsa = '';
      this.form.date = '';
      this.form.time = '';
      this.form.total_rm = '';
      this.form.activity_name = '';
      this.form.activity_id = '';
      this.form.location = '';
      this.form.issuer = '';
      this.selectedActivity = null;
      this.availableTimeSlots = [];
      this.pricePerPax = 0;
      this.touristSelected = false;
      this.selectedTouristUserId = '';
      this.selectedTouristBookingId = '';
      this.selectedTouristDisplayText = '';
      this.selectedBookingId = null;
      this.touristSearchQuery = '';
      this.filteredTouristOptions = [...this.touristOptions];
      this.showTouristList = false;
      this.form.manual_tourist_name = '';
      this.selectedManualTouristUserId = '';
      this.selectedManualTouristContactPhone = '';
      this.selectedManualTouristNationality = '';
      this.manualTouristSelected = false;
      this.filteredManualTouristOptions = [...this.allTouristUsers];
      this.showManualTouristList = false;
      this.availableManualDates = [];
      this.autofillOperator();
    } else {
      // Switching back to guest — clear the manual name
      this.form.manual_tourist_name = '';
      this.manualTouristSelected = false;
      this.showManualTouristList = false;
    }
  }

  onTouristChange(selectedBookingId: string) {
    const booking = this.touristOptions.find(
      // eslint-disable-next-line eqeqeq
      (t) => t.booking_id == selectedBookingId,
    );
    if (!booking) {
      return;
    }

    // Store the actual user_id and booking_id for later use
    this.selectedTouristUserId = booking.user_id || '';
    this.selectedBookingId = booking.booking_id || null;

    // Autofill form fields from booking
    const nat = (booking.citizenship || '').toLowerCase();
    this.form.citizenship =
      nat === 'malaysian'
        ? 'Warganegara'
        : nat
          ? 'Bukan Warganegara'
          : 'Warganegara';
    this.form.date = booking.date || '';
    this.form.total_rm = booking.total_price
      ? booking.total_price.toString()
      : '';
    this.form.issuer = booking.operator_name || '';

    // Autofill pax — fill both fields with the same no_of_pax value
    const noOfPax = booking.no_of_pax ? booking.no_of_pax.toString() : '';
    this.form.pax_domestik = noOfPax;
    this.form.pax_antarabangsa = noOfPax;

    // Find matching activity from activities list
    // Strategy 0: Match by operator_activity_id — most precise, handles duplicate activity names
    let matchedActivity = booking.operator_activity_id
      ? this.activities.find((a) => a.id === booking.operator_activity_id)
      : null;

    // Strategy 1: Match booking.activity_id with activity_master.id
    if (!matchedActivity) {
      matchedActivity = this.activities.find(
        (a) => a.activity_master?.id === booking.activity_id,
      );
    }

    // Fallback: Try matching by activity name if ID match fails
    if (!matchedActivity && booking.activity_name) {
      console.warn(
        '[Data Quality] Activity ID mismatch - falling back to name match:',
        {
          booking_activity_id: booking.activity_id,
          booking_activity_name: booking.activity_name,
        },
      );
      matchedActivity = this.activities.find(
        (a) =>
          a.activity_name === booking.activity_name ||
          a.activity_master?.activity_name === booking.activity_name,
      );
    }

    // Last resort: Try matching by operator_activities.id
    if (!matchedActivity) {
      console.warn(
        '[Data Quality] Activity name mismatch - falling back to operator activity ID:',
        {
          booking_activity_id: booking.activity_id,
          available_activities: this.activities.length,
        },
      );
      matchedActivity = this.activities.find(
        (a) => a.id === booking.activity_id,
      );
    }

    // Set selected activity for dropdown
    this.selectedActivity = matchedActivity || null;

    // Populate time slots from the matched activity so the time dropdown works
    if (this.selectedActivity) {
      const dates = this.selectedActivity.available_dates || [];
      const parsed = typeof dates === 'string' ? JSON.parse(dates) : dates;
      const slots = parsed
        .map(
          (entry: any) =>
            entry.time ??
            (entry.startTime && entry.endTime
              ? `${entry.startTime} - ${entry.endTime}`
              : null),
        )
        .filter((t: any) => !!t);
      this.availableTimeSlots = [...new Set<string>(slots)];
      // Set time after slots are populated so ion-select can resolve the value
      setTimeout(() => {
        this.form.time = booking.time || '';
      }, 0);
    } else {
      // No matched activity — still try to set time from booking
      this.form.time = booking.time || '';
    }

    // Populate form fields if activity found
    if (this.selectedActivity) {
      this.form.activity_name = this.selectedActivity.activity_name;
      // ✅ Use activity_master.id (master table ID), not operator_activities.id
      this.form.activity_id =
        this.selectedActivity.activity_master?.id ||
        this.selectedActivity.activity_id;
      this.form.location =
        this.selectedActivity.address ||
        this.selectedActivity.location ||
        booking.location ||
        '';
    } else {
      // If no match found, use booking data directly
      this.form.activity_name = booking.activity_name || '';
      this.form.activity_id = booking.activity_id || '';
      this.form.location = booking.location || '';
      this.form.time = booking.time || '';
    }
  }

  // ---------------- Activity Change ----------------
  onActivityChange(selectedActivity: any) {
    if (!selectedActivity) return;
    this.form.activity_name = selectedActivity.activity_name;
    this.form.activity_id =
      selectedActivity.activity_master?.id || selectedActivity.activity_id;
    this.form.location =
      selectedActivity.address || selectedActivity.location || '';

    // Extract unique time slots from available_dates
    const dates = selectedActivity.available_dates || [];
    const parsed = typeof dates === 'string' ? JSON.parse(dates) : dates;
    const slots = parsed
      .map(
        (entry: any) =>
          entry.time ??
          (entry.startTime && entry.endTime
            ? `${entry.startTime} - ${entry.endTime}`
            : null),
      )
      .filter((t: any) => !!t);
    this.availableTimeSlots = [...new Set<string>(slots)];

    // Reset time if previously selected slot no longer exists
    if (!this.availableTimeSlots.includes(this.form.time)) {
      this.form.time = '';
    }

    // For manual bookings, auto-fill date, time, price and operator name
    if (this.form.booking_type === 'manual') {
      // Compute all dates defined in available_dates
      const allDates = [
        ...new Set<string>(
          parsed.map((e: any) => e.date).filter((d: any) => !!d),
        ),
      ];

      // Load already-booked dates from backend and compute the available subset
      this.apiService
        .getBookedDatesByOperatorActivity(String(selectedActivity.id))
        .subscribe(
          (res: any) => {
            const booked: any[] = Array.isArray(res.data) ? res.data : [];
            const bookedDateSet = new Set(
              booked
                .map((b: any) => (b.date ? b.date.split('T')[0] : null))
                .filter(Boolean),
            );
            this.availableManualDates = allDates.filter(
              (d) => !bookedDateSet.has(d),
            );
            // Pick first available date, reset if previously picked is gone
            if (
              !this.form.date ||
              !this.availableManualDates.includes(this.form.date)
            ) {
              this.form.date = this.availableManualDates[0] || '';
            }
          },
          () => {
            // On error, fall back to all dates
            this.availableManualDates = allDates;
            const firstSlot = parsed.find((entry: any) => !!entry.date);
            if (!this.form.date && firstSlot?.date) {
              this.form.date = firstSlot.date;
            }
          },
        );

      // Auto-fill first available time slot
      if (this.availableTimeSlots.length > 0) {
        this.form.time = this.availableTimeSlots[0];
      }

      // Auto-fill price from price_per_pax × current pax
      if (selectedActivity.price_per_pax) {
        this.pricePerPax = Number(selectedActivity.price_per_pax);
        const currentPax =
          (Number(this.form.pax_domestik) || 0) +
          (Number(this.form.pax_antarabangsa) || 0);
        this.form.total_rm = (this.pricePerPax * (currentPax || 1)).toString();
      }

      // Auto-fill operator name from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.form.issuer = user.full_name || user.username || '';
    } else {
      this.availableManualDates = [];
    }
  }

  // ---------------- Pax Change (recalculate manual total) ----------------
  onManualPaxChange() {
    if (this.form.booking_type !== 'manual' || !this.pricePerPax) return;
    const pax =
      (Number(this.form.pax_domestik) || 0) +
      (Number(this.form.pax_antarabangsa) || 0);
    if (pax > 0) {
      this.form.total_rm = (this.pricePerPax * pax).toString();
    }
  }

  // ---------------- Submit Form ----------------
  async submitForm(form: NgForm) {
    try {
      if (this.form.booking_type === 'guest' && !this.selectedTouristUserId) {
        alert('Please select a tourist.');
        return;
      }
      if (
        this.form.booking_type === 'manual' &&
        !this.selectedManualTouristUserId
      ) {
        alert('Please select a tourist from the list.');
        return;
      }

      const operatorUid =
        this.form.operator_user_id || localStorage.getItem('uid')!;
      const paxDomestik = Number(this.form.pax_domestik) || 0;
      const paxAntarabangsa = Number(this.form.pax_antarabangsa) || 0;
      const totalPax = paxDomestik + paxAntarabangsa;
      const totalPrice = Number(this.form.total_rm);

      if (totalPax <= 0) {
        alert('Please enter at least 1 pax.');
        return;
      }
      if (totalPrice <= 0) {
        alert('Invalid Total RM.');
        return;
      }

      const payload = {
        receipt_id: this.generateReceiptId(),
        tourist_user_id:
          this.form.booking_type === 'guest'
            ? this.selectedTouristUserId
            : this.selectedManualTouristUserId,
        operator_user_id: operatorUid,
        citizenship: this.form.citizenship,
        pax: totalPax,
        pax_domestik: paxDomestik,
        pax_antarabangsa: paxAntarabangsa,
        activity_id: this.form.activity_id,
        activity_name: this.form.activity_name,
        location: this.form.location || null,
        total_rm: totalPrice.toString(),
        date: this.form.date || null,
        time: this.form.time || null,
        issuer: this.form.issuer || 'Unknown Operator',
        operator_activity_id: this.selectedActivity?.id || null,
        contact_name:
          this.form.booking_type === 'manual'
            ? this.form.manual_tourist_name
            : null,
        contact_phone:
          this.form.booking_type === 'manual'
            ? this.selectedManualTouristContactPhone
            : null,
        nationality:
          this.form.booking_type === 'manual'
            ? this.selectedManualTouristNationality
            : null,
        activity_booking_id:
          this.form.booking_type === 'guest' ? this.selectedBookingId : null,
        booking_type: this.form.booking_type || 'guest',
      };

      console.debug('Submitting activity form payload:', payload);
      const response: any = await this.apiService
        .createForm(payload)
        .toPromise();
      const receiptId = response?.data?.receipt_id || payload.receipt_id;

      this.clearForm(form);
      this.navCtrl.navigateForward('/receipt-activity/' + receiptId);
    } catch (error: any) {
      console.error('Failed to save activity form.', error);
      alert('Failed to save form.');
    }
  }

  // ---------------- Clear Form ----------------
  clearForm(form: NgForm) {
    form.reset();
    this.selectedActivity = null;
    this.availableTimeSlots = [];
    this.availableManualDates = [];
    this.touristSelected = false;
    this.selectedTouristUserId = '';
    this.selectedTouristBookingId = '';
    this.selectedTouristDisplayText = '';
    this.selectedBookingId = null;
    this.touristSearchQuery = '';
    this.filteredTouristOptions = [...this.touristOptions];
    this.showTouristList = false;
    this.manualTouristSelected = false;
    this.selectedManualTouristUserId = '';
    this.selectedManualTouristContactPhone = '';
    this.selectedManualTouristNationality = '';
    this.filteredManualTouristOptions = [...this.allTouristUsers];
    this.showManualTouristList = false;
  }

  // ---------------- Navigation ----------------
  backHome() {
    this.navCtrl.navigateForward('/home', {
      animated: true,
      animationDirection: 'back',
    });
  }

  compareWithFn(o1: any, o2: any) {
    // Compare using the operator activity's own unique id (not activity_master.id)
    // to correctly distinguish two activities of the same type (e.g. two Island Hopping)
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
  }
}
