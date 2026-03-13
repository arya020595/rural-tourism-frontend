import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ModalController, NavController } from '@ionic/angular';
import { DateModalComponent } from '../date-modal/date-modal.component';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';
import {
  AccommodationTouristOptionMapper,
  BookingFilter,
} from '../utils/booking.utils';

@Component({
  selector: 'app-acco-form',
  templateUrl: './acco-form.page.html',
  styleUrls: ['./acco-form.page.scss'],
})
export class AccoFormPage implements OnInit {
  //initialize
  form = {
    receipt_id: '',
    user_id: localStorage.getItem('uid'),
    citizenship: 'Warganegara',
    pax: 0,
    pax_domestik: '',
    pax_antarabangsa: '',
    activity_name: '',
    homest_name: '',
    location: '', //get location based on input
    activity_id: '',
    homest_id: '',
    total_rm: '',
    total_night: '',
    issuer: '',
    date: '',
    check_out: '',
    operator_user_id: '',
    booking_type: 'guest',
    manual_tourist_name: '',
  };

  accommodations: any[] = [];

  selectedAccommodation: any = null;

  // Tourist selection properties
  touristOptions: any[] = [];
  filteredTouristOptions: any[] = [];
  touristSearchQuery: string = '';
  showTouristList: boolean = false;
  touristSelected: boolean = false;
  selectedTouristUserId: string = ''; // actual user_id sent to backend
  selectedTouristBookingId: string = ''; // unique booking_id used by the dropdown
  selectedTouristDisplayText: string = '';
  selectedBookingId: number | null = null;
  preselectedBookingId: number | null = null;

  // Manual booking — tourist_users dropdown
  allTouristUsers: any[] = [];
  filteredManualTouristOptions: any[] = [];
  showManualTouristList: boolean = false;
  manualTouristSelected: boolean = false;
  selectedManualTouristUserId: string = '';
  selectedManualTouristContactPhone: string = '';
  selectedManualTouristEmail: string = '';
  selectedManualTouristNationality: string = '';

  // Already-booked dates for the selected accommodation in manual mode
  bookedAccommodationDates: string[] = [];
  // available_dates entries (date + price) from the selected accommodation
  accoAvailableDates: { date: string; price: number }[] = [];

  constructor(
    private apiService: ApiService,
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private modalCtrl: ModalController,
  ) {}

  // Create an array of numbers from 1 to 20
  numbers: number[] = Array.from({ length: 20 }, (_, i) => i + 1);

  get isGuestAutofilled(): boolean {
    return this.form.booking_type === 'guest' && !!this.selectedTouristUserId;
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['bookingId']) {
        this.preselectedBookingId = Number(params['bookingId']);
      }
    });
    //load accomodation options
    this.loadAccom();
    this.autofillOperator();
    this.loadTouristsFromBookings();
    this.loadAllTouristUsers();
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
    this.selectedManualTouristEmail = tourist.email || '';
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
    this.selectedManualTouristEmail = '';
    this.selectedManualTouristNationality = '';
    this.manualTouristSelected = false;
    this.filteredManualTouristOptions = [...this.allTouristUsers];
    this.showManualTouristList = false;
  }

  // ---------------- Date Modal ----------------
  async openDateModal(field: 'date' | 'check_out') {
    const currentValue =
      field === 'date' ? this.form.date : this.form.check_out;
    const modal = await this.modalCtrl.create({
      component: DateModalComponent,
      cssClass: 'date-picker-modal',
      componentProps: {
        selectedDate: currentValue || '',
        bookedDates: this.bookedAccommodationDates,
        availableDates: this.accoAvailableDates,
        minDate: field === 'check_out' ? this.form.date || '' : '',
      },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      const dateOnly = (data as string).substring(0, 10);
      if (field === 'date') {
        this.form.date = dateOnly;
        // If check-out is now on or before the new check-in, clear it
        if (this.form.check_out && this.form.check_out <= dateOnly) {
          this.form.check_out = '';
          this.form.total_night = '';
        }
      } else {
        this.form.check_out = dateOnly;
      }
      // Auto-calculate total nights whenever both dates are set
      this.recalcNights();
    }
  }

  private recalcNights() {
    if (this.form.date && this.form.check_out) {
      const msPerDay = 24 * 60 * 60 * 1000;
      const nights = Math.round(
        (new Date(this.form.check_out).getTime() -
          new Date(this.form.date).getTime()) /
          msPerDay,
      );
      this.form.total_night = nights > 0 ? nights.toString() : '';
    }
    // Auto-fill price based on updated nights
    if (this.form.date && this.accoAvailableDates.length > 0) {
      const entry = this.accoAvailableDates.find(
        (e) => e.date === this.form.date,
      );
      if (entry && Number(this.form.total_night) > 0) {
        this.form.total_rm = (
          entry.price * Number(this.form.total_night)
        ).toString();
      }
    }
  }

  // ---------------- Autofill Operator ----------------
  autofillOperator() {
    const operatorUid = localStorage.getItem('uid');
    if (!operatorUid) return;
    this.form.operator_user_id = operatorUid;

    // Get operator name from localStorage instead of API call
    const userDataString = localStorage.getItem('user');
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        this.form.issuer = userData.full_name || userData.username || '';
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
      }
    }
  }

  // ---------------- Load Tourists from Bookings ----------------
  loadTouristsFromBookings() {
    const operatorUid = localStorage.getItem('uid');
    if (!operatorUid) {
      this.touristOptions = [];
      return;
    }
    this.apiService.getOperatorAllBookings(operatorUid).subscribe(
      (res: any) => {
        const bookings: any[] = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];

        // Filter: Only show ACCOMMODATION bookings (exclude activity bookings)
        const accommodationBookings = bookings.filter(
          (b) => b.type === 'accommodation',
        );

        // Use BookingFilter utility to get unpaid bookings only
        const unpaidBookings = BookingFilter.getUnpaidBookings(
          accommodationBookings,
        );

        // Map to tourist options for dropdown
        this.touristOptions =
          AccommodationTouristOptionMapper.mapToOptions(unpaidBookings);
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

  // ---------------- Tourist Search ----------------
  filterTourists(query: string | null | undefined) {
    const q = (query || '').toLowerCase().trim();
    this.filteredTouristOptions = q
      ? this.touristOptions.filter((t) =>
          t.displayText.toLowerCase().includes(q),
        )
      : [...this.touristOptions];
  }

  onTouristSearchFocus() {
    this.touristSearchQuery = '';
    this.filteredTouristOptions = [...this.touristOptions];
    this.showTouristList = true;
  }

  onTouristSearchInput(query: string | null | undefined) {
    this.filterTourists(query);
    this.showTouristList = true;
  }

  onTouristSearchBlur() {
    setTimeout(() => {
      this.showTouristList = false;
    }, 150);
  }

  selectTouristOption(tourist: any) {
    this.showTouristList = false;
    this.touristSearchQuery = tourist.displayText;
    this.filteredTouristOptions = [...this.touristOptions];
    this.selectedTouristBookingId = tourist.booking_id;
    this.selectedTouristDisplayText = tourist.displayText;
    this.touristSelected = true;
    this.onTouristChange(tourist.booking_id);
  }

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

  // ---------------- Tourist Selection Change ----------------
  onTouristChange(selectedBookingId: string) {
    const booking = this.touristOptions.find(
      // eslint-disable-next-line eqeqeq
      (t) => t.booking_id == selectedBookingId,
    );
    if (!booking) {
      return;
    }

    // Store booking ID for later use
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
    this.form.total_rm = booking.total_price
      ? booking.total_price.toString()
      : '';
    this.form.total_night = booking.total_no_of_nights
      ? booking.total_no_of_nights.toString()
      : '';
    if (booking.operator_name) {
      this.form.issuer = booking.operator_name;
    }
    this.form.date = booking.check_in || '';
    this.form.check_out = booking.check_out || '';

    // Autofill pax — fill both fields with the same no_of_pax value
    const noOfPax = booking.no_of_pax ? booking.no_of_pax.toString() : '';
    this.form.pax_domestik = noOfPax;
    this.form.pax_antarabangsa = noOfPax;

    // Find matching accommodation from accommodations list
    let matchedAccommodation = this.accommodations.find(
      (a) => a.accommodation_id === booking.accommodation_id,
    );

    // Set selected accommodation for dropdown
    this.selectedAccommodation = matchedAccommodation || null;

    // Populate form fields if accommodation found
    if (this.selectedAccommodation) {
      this.form.homest_name =
        this.selectedAccommodation.name ||
        this.selectedAccommodation.homest_name;
      this.form.homest_id =
        this.selectedAccommodation.accommodation_id ||
        this.selectedAccommodation.homest_id;
      this.form.location =
        this.selectedAccommodation.location ||
        this.selectedAccommodation.address ||
        booking.location ||
        '';
    } else {
      // If no match found, use booking data directly
      this.form.homest_name = booking.accommodation_name || '';
      this.form.homest_id = booking.accommodation_id || '';
      this.form.location = booking.location || '';
    }
  }

  // ---------------- Booking Type Change ----------------
  onBookingTypeChange(type: string) {
    if (type === 'manual') {
      // Clear all autofilled data when switching to manual
      this.form.citizenship = 'Warganegara';
      this.form.pax_domestik = '';
      this.form.pax_antarabangsa = '';
      this.form.date = '';
      this.form.check_out = '';
      this.form.total_night = '';
      this.form.total_rm = '';
      this.form.homest_name = '';
      this.form.homest_id = '';
      this.form.location = '';
      this.selectedAccommodation = null;
      this.selectedBookingId = null;
      this.touristSelected = false;
      this.selectedTouristBookingId = '';
      this.selectedTouristDisplayText = '';
      this.selectedTouristUserId = '';
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
      this.bookedAccommodationDates = [];
      this.accoAvailableDates = [];
      this.autofillOperator();
    } else {
      // Switching back to guest — clear the manual name
      this.form.manual_tourist_name = '';
      this.manualTouristSelected = false;
      this.showManualTouristList = false;
    }
  }

  backHome() {
    this.navCtrl.navigateForward('/home', {
      animated: true, // Enable animation
      animationDirection: 'back', // Can be 'forward' or 'back' for custom direction
    });
  }

  // Function to generate a unique receipt_id with 7 random digits
  //'PE' for Accomodation forms/receipts.
  generateReceiptId(): string {
    const randomPart = Math.floor(Math.random() * 10000000); // Random number between 0 and 9999999 (7 digits)
    const formattedRandomPart = randomPart.toString().padStart(7, '0'); // Ensure it has 7 digits
    return `PE${formattedRandomPart}`; // Concatenate 'RE' with the 7-digit random number
  }

  //load accomodation options
  loadAccom() {
    // const user_id = localStorage.getItem('uid');
    //get all accommodations
    // this.apiService.getAllAccommodations().subscribe(
    //   (data) => {
    //     this.accommodations = data;
    //     console.log(data);
    //   },
    //   (error) => {
    //     console.log(error);
    //   }
    // )
    const uid = localStorage.getItem('uid') as string;
    //get all accommodations by user
    this.apiService.getAllAccomByUser(uid).subscribe(
      (data) => {
        this.accommodations = data;
        // console.log(data);
      },
      (error) => {
        console.log(error);
      },
    );
  }

  // Validate selected check-in/check-out range against already-booked dates
  hasDateConflict(checkIn: string, checkOut: string): boolean {
    if (!checkIn || !this.bookedAccommodationDates.length) return false;
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date(checkIn);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (this.bookedAccommodationDates.includes(dateStr)) return true;
    }
    return false;
  }

  //submit function
  // submitForm(form: NgForm) {

  //   // Generate a new unique receipt_id each time the form is submitted
  //   this.form.receipt_id = this.generateReceiptId();
  //   this.apiService.createForm(this.form).subscribe(
  //     (Response) => {
  //       console.log('Form created successfully:', Response);

  //       // Ensure receipt_id is generated before navigating
  //       this.form.receipt_id = Response.receipt_id || this.form.receipt_id;
  //       // Clear the form only after successful backend creation
  //       this.navCtrl.navigateForward('/receipt/' + this.form.receipt_id);
  //       this.clearForm(form);

  //     },
  //     (error) => {
  //       alert('Server Connection Error')
  //       console.log("Failed:", error)
  //     }
  //   )
  // }

  async submitForm(form: NgForm) {
    try {
      // Validate tourist selection
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

      // Validate date availability for manual accommodation bookings
      if (
        this.form.booking_type === 'manual' &&
        this.form.date &&
        this.hasDateConflict(this.form.date, this.form.check_out)
      ) {
        alert(
          'The selected dates conflict with an existing booking. Please choose different dates.',
        );
        return;
      }

      const operatorUid =
        this.form.operator_user_id || localStorage.getItem('uid')!;

      // Calculate total_pax by adding paxA and paxD
      const paxDomestik = parseInt(this.form.pax_domestik) || 0;
      const paxAntarabangsa = parseInt(this.form.pax_antarabangsa) || 0;
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

      // Build payload with accommodation_booking_id
      const payload = {
        receipt_id: this.generateReceiptId(),
        tourist_user_id:
          this.form.booking_type === 'guest'
            ? this.selectedTouristUserId
            : this.selectedManualTouristUserId,
        tourist_name: null,
        operator_user_id: operatorUid,
        booking_type: this.form.booking_type || 'guest',
        citizenship: this.form.citizenship,
        pax: totalPax,
        pax_domestik: paxDomestik,
        pax_antarabangsa: paxAntarabangsa,
        homest_name: this.form.homest_name,
        homest_id: this.form.homest_id,
        location: this.form.location || null,
        total_rm: totalPrice.toString(),
        total_night: this.form.total_night || null,
        date: this.form.date || null,
        check_out: this.form.check_out || null,
        issuer: this.form.issuer || 'Unknown Operator',
        contact_name:
          this.form.booking_type === 'manual'
            ? this.form.manual_tourist_name
            : null,
        contact_phone:
          this.form.booking_type === 'manual'
            ? this.selectedManualTouristContactPhone
            : null,
        contact_email:
          this.form.booking_type === 'manual'
            ? this.selectedManualTouristEmail
            : null,
        nationality:
          this.form.booking_type === 'manual'
            ? this.selectedManualTouristNationality
            : null,
        accommodation_booking_id:
          this.form.booking_type === 'guest' ? this.selectedBookingId : null,
      };

      console.debug('Submitting accommodation form payload:', payload);

      // Wait for the backend response using async/await
      const response: any = await this.apiService
        .createForm(payload)
        .toPromise();
      console.log('Form created successfully:', response);

      const receiptId = response?.data?.receipt_id || payload.receipt_id;

      // Clear the form only after successful backend creation
      this.clearForm(form);

      // Navigate to the receipt page after the data is saved
      this.navCtrl.navigateForward('/receipt/' + receiptId);
    } catch (error) {
      // Handle error gracefully
      console.error('Failed to save accommodation form.', error);
      alert('Failed to save form.');
    }
  }

  onAccommodationChange(selectedAccommodation: any) {
    if (selectedAccommodation.name || selectedAccommodation.homest_name) {
      this.form.homest_name =
        selectedAccommodation.name || selectedAccommodation.homest_name;
      this.form.location =
        selectedAccommodation.location || selectedAccommodation.address;
      this.form.homest_id =
        selectedAccommodation.accommodation_id ||
        selectedAccommodation.homest_id;
    }

    // In manual mode, load already-booked dates so the operator can avoid conflicts
    if (this.form.booking_type === 'manual' && selectedAccommodation) {
      // Store available_dates (date+price entries) from accommodation
      const rawDates = selectedAccommodation.available_dates || [];
      this.accoAvailableDates = Array.isArray(rawDates)
        ? rawDates.filter((e: any) => e.date && (e.price ?? 0) > 0)
        : [];

      const accommodationId = String(
        selectedAccommodation.accommodation_id ||
          selectedAccommodation.homest_id ||
          '',
      );
      if (accommodationId) {
        this.apiService
          .getBookedDatesByAccommodation(accommodationId)
          .subscribe(
            (res: any) => {
              this.bookedAccommodationDates = Array.isArray(res.data)
                ? res.data
                : [];
            },
            () => {
              this.bookedAccommodationDates = [];
            },
          );
      }
    } else {
      this.accoAvailableDates = [];
      this.bookedAccommodationDates = [];
    }
  }

  //for testing form object
  // submitForm(form: NgForm){

  //   // Generate a new unique receipt_id each time the form is submitted
  //   this.form.receipt_id = this.generateReceiptId();

  //   console.log(this.form)
  //   // this.clearForm(form);
  //   // this.navCtrl.navigateForward('/receipt/'+ this.form.receipt_id);
  // }

  clearForm(form: NgForm) {
    form.reset();
    this.selectedAccommodation = null;
    this.bookedAccommodationDates = [];
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

  compareWithFn(o1: any, o2: any) {
    return o1 && o2
      ? (o1.accommodation_id || o1.homest_id) ===
          (o2.accommodation_id || o2.homest_id)
      : o1 === o2;
  }
}
