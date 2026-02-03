import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NavController } from '@ionic/angular';
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
    citizenship: '',
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
    operator_user_id: '',
  };

  accommodations: any[] = [];

  selectedAccommodation: any = null;

  // Tourist selection properties
  touristOptions: any[] = [];
  selectedTouristUserId: string = '';
  selectedBookingId: number | null = null;

  constructor(
    private apiService: ApiService,
    private navCtrl: NavController,
  ) {}

  // Create an array of numbers from 1 to 20
  numbers: number[] = Array.from({ length: 20 }, (_, i) => i + 1);

  ngOnInit() {
    //load accomodation options
    this.loadAccom();
    this.autofillOperator();
    this.loadTouristsFromBookings();
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
        this.form.issuer = userData.username || userData.full_name || '';
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
      }
    }
  }

  // ---------------- Load Tourists from Bookings ----------------
  loadTouristsFromBookings() {
    const operatorUid = localStorage.getItem('uid')!;
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
      },
      (err) => {
        console.error('Failed to load tourists:', err);
        this.touristOptions = [];
      },
    );
  }

  // ---------------- Tourist Selection Change ----------------
  onTouristChange(selectedTouristUserId: string) {
    const booking = this.touristOptions.find(
      (t) => t.user_id === selectedTouristUserId,
    );
    if (!booking) {
      return;
    }

    // Store booking ID for later use
    this.selectedBookingId = booking.booking_id || null;

    // Autofill form fields from booking
    this.form.citizenship = booking.citizenship || '';
    this.form.total_rm = booking.total_price
      ? booking.total_price.toString()
      : '';
    this.form.total_night = booking.total_no_of_nights
      ? booking.total_no_of_nights.toString()
      : '';
    this.form.issuer = booking.operator_name || '';
    this.form.date = booking.check_in || '';

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
      if (!this.selectedTouristUserId) {
        alert('Please select a tourist.');
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
        tourist_user_id: this.selectedTouristUserId,
        operator_user_id: operatorUid,
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
        issuer: this.form.issuer || 'Unknown Operator',
        // Include accommodation_booking_id to trigger automatic status update
        accommodation_booking_id: this.selectedBookingId,
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
    this.selectedTouristUserId = '';
    this.selectedBookingId = null;
  }
}
