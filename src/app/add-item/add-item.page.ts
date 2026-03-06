import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import Swiper from 'swiper';
import { register } from 'swiper/element/bundle';
import { ApiService } from '../services/api.service';

register();

@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.page.html',
  styleUrls: ['./add-item.page.scss'],
})
export class AddItemPage implements OnInit {
  @ViewChild('swiper') swiperRef: ElementRef | undefined;
  swiper?: Swiper;

  currentStep = 1; // Track the current step
  selectedOption: string = '';

  activityTypes: any[] = []; // To hold activity master data
  isActivityTypesLoaded = false;
  districtList: string[] = [
    'Kiulu',
    'Kota Belud',
    'Kundasang',
    'Ranau',
    'Sandakan',
    'Tawau',
    'Kota Kinabalu',
  ];

  // ===== Activity Data =====
  activityData = {
    activity_id: '',
    activity_type_id: '',
    activity_name: '',
    location: '',
    description: '',
    //price: '',
    image: '',
    district: '',
    operator_logo: '' as string | ArrayBuffer | null,
    things_to_know: [] as { title: string; description: string }[],
    user_id: localStorage.getItem('uid'),
    address: '',
    showInSuggestions: false,
    available_dates_list: [] as { date: string; time: string; price: number }[],
    services_provided_list: [] as { title: string; description: string }[],
  };

  // Temporary slot before adding
  newTimeSlot = { startTime: '', endTime: '' };

  availableDateRangeEntry = {
    startDate: '', // e.g., '2026-01-01'
    endDate: '', // e.g., '2026-01-07'
    timeSlots: [] as { startTime: string; endTime: string }[],
    price: 0,
  };

  imagePreview: string | null = null;

  newService = { title: '', description: '' };
  newThingToKnow = { title: '', description: '' };
  newProvidedAccomodation = { title: '' };

  availableDateEntry = { date: '', time: '', price: 0 };

  // ===== Accommodation Data =====
  accomData = {
    accommodation_id: '',
    name: '',
    location: '',
    description: '',
    price: 0, // ✅ general display price
    image: '',
    address: '',
    district: '',
    provided_accomodation: [] as { title: string }[],
    user_id: localStorage.getItem('uid'),
    showAvailability: false,
    activity_id: '',
    startDate: '',
    endDate: '',
    available_dates_list: [] as Array<{ date: string; price: number }>,
  };

  // Separate price field for date range entries (not the general price)
  accomDateRangePrice: number = 0;

  // ===== Alert / Dialog =====
  isAlertOpen = false;
  alertButtons = [
    {
      text: 'OK',
      handler: () => {
        this.navController.navigateForward('/home', {
          animated: true,
          animationDirection: 'back',
        });
      },
    },
  ];

  cancelButton = [
    {
      text: 'Tidak',
      role: 'cancel',
      handler: () => console.log('Alert canceled'),
    },
    {
      text: 'Ya',
      role: 'confirm',
      handler: () => {
        this.navController.navigateForward('/home', {
          animated: true,
          animationDirection: 'back',
        });
      },
    },
  ];

  operatorLogoPreview: string | ArrayBuffer | null = null;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private navController: NavController,
  ) {}

  ngOnInit() {
    // Refresh user_id from localStorage
    const currentUserId = localStorage.getItem('uid');
    this.activityData.user_id = currentUserId;
    this.accomData.user_id = currentUserId;

    console.log('Current user_id from localStorage:', currentUserId);

    this.loadActivityTypes();
  }

  ngAfterViewInit() {
    this.swiperReady();
  }

  // ===== Activity Type Methods =====
  loadActivityTypes() {
    this.isActivityTypesLoaded = false;
    this.apiService.getAllActivityMasterData().subscribe(
      (res: any) => {
        // API returns { data: [...], pagination: {...} } — extract the array
        if (Array.isArray(res)) {
          this.activityTypes = res;
        } else if (res && Array.isArray(res.data)) {
          this.activityTypes = res.data;
        } else {
          this.activityTypes = [];
        }
        this.isActivityTypesLoaded = true;
        console.log('Activity types loaded:', this.activityTypes);
      },
      (err) => {
        console.error('Error fetching activity master data', err);
        this.activityTypes = [];
        this.isActivityTypesLoaded = true;
      },
    );
  }

  addAvailableDateRangeForAccommodation() {
    if (
      this.accomData.startDate &&
      this.accomData.endDate &&
      this.accomDateRangePrice
    ) {
      const start = new Date(this.accomData.startDate);
      const end = new Date(this.accomData.endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const formattedDate = d.toISOString().split('T')[0];
        this.accomData.available_dates_list.push({
          date: formattedDate,
          price: this.accomDateRangePrice,
        });
      }

      // reset only the date range input fields, NOT the general price
      this.accomData.startDate = '';
      this.accomData.endDate = '';
      this.accomDateRangePrice = 0;
    }
  }

  selectActivity(activityId: string) {
    this.activityData.activity_id = activityId;
    const selected = this.activityTypes.find((a) => a.id === activityId);
    if (selected) {
      this.activityData.activity_name = selected.activity_name;
      this.activityData.district = selected.district || '';
    }
  }

  // ===== Swiper Methods =====
  swiperReady() {
    if (this.swiperRef?.nativeElement) {
      this.swiper = this.swiperRef.nativeElement.swiper;
      if (this.swiper) this.swiper.allowTouchMove = false;
    }
  }

  goNext() {
    this.swiper?.slideNext();
  }
  goPrev() {
    this.swiper?.slidePrev();
  }
  goToStep(step: number) {
    this.currentStep = step;
  }

  onSlideChange(event: any) {
    /* optional */
  }

  // ===== Option Selection =====
  selectOption(option: string) {
    this.selectedOption = option;
    this.goNext();
  }

  // ===== Activity / Accommodation Toggles =====
  onShowInAvailability() {
    console.log('Show Availability changed:', this.accomData.showAvailability);
  }

  onShowInSuggestionsChange() {
    console.log(
      'Show in Suggestions changed:',
      this.activityData.showInSuggestions,
    );
  }

  // ===== Available Dates =====

  addTimeSlot() {
    const { startTime, endTime } = this.newTimeSlot;

    // Validation
    if (!startTime || !endTime) {
      console.warn('Cannot add slot: start or end time missing');
      return;
    }

    // Optional: prevent overlapping slots
    const overlap = this.availableDateRangeEntry.timeSlots.some(
      (slot) =>
        (startTime >= slot.startTime && startTime < slot.endTime) ||
        (endTime > slot.startTime && endTime <= slot.endTime),
    );
    if (overlap) {
      alert('Time slot overlaps with an existing slot!');
      return;
    }

    // Add to timeSlots array
    this.availableDateRangeEntry.timeSlots.push({ ...this.newTimeSlot });
    console.log('Added time slot:', this.newTimeSlot);
    console.log('Current time slots:', this.availableDateRangeEntry.timeSlots);

    // Reset input
    this.newTimeSlot = { startTime: '', endTime: '' };
  }

  removeTimeSlot(index: number) {
    this.availableDateRangeEntry.timeSlots.splice(index, 1);
  }

  removeAccomAvailableDate(index: number) {
    this.accomData.available_dates_list.splice(index, 1);
  }

  addAvailableDateRange() {
    const { startDate, endDate, timeSlots, price } =
      this.availableDateRangeEntry;

    // Validation
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
      return;
    }
    if (price < 0) {
      alert('Price must be 0 or greater.');
      return;
    }

    const start = new Date(`${startDate}T00:00`);
    const end = new Date(`${endDate}T00:00`);

    if (start > end) {
      alert('Start date cannot be after end date.');
      return;
    }

    // Loop through dates
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = this.formatDateYYYYMMDD(d);
      if (timeSlots.length > 0) {
        // If time slots were added, create one entry per slot
        timeSlots.forEach((slot) => {
          this.activityData.available_dates_list.push({
            date: dateStr,
            time: `${slot.startTime} - ${slot.endTime}`,
            price: price,
          });
        });
      } else {
        // No time slots - create entry with 'Full Day' as default
        this.activityData.available_dates_list.push({
          date: dateStr,
          time: 'Full Day',
          price: price,
        });
      }
    }

    console.log('Added date range:', this.availableDateRangeEntry);
    console.log(
      'Current available dates list:',
      this.activityData.available_dates_list,
    );

    // Reset form
    this.availableDateRangeEntry = {
      startDate: '',
      endDate: '',
      timeSlots: [],
      price: 0,
    };
  }

  get isAvailableDateRangeValid() {
    const { startDate, endDate, price } = this.availableDateRangeEntry;
    return startDate && endDate && price >= 0;
  }

  addAvailableDate() {
    if (!this.isAvailableDateValid) return;

    this.activityData.available_dates_list.push({
      date: this.availableDateEntry.date,
      time: this.availableDateEntry.time,
      price: this.availableDateEntry.price,
    });

    // Reset fields after adding
    this.availableDateEntry = { date: '', time: '', price: 0 };
  }

  removeAvailableDate(index: number) {
    this.activityData.available_dates_list.splice(index, 1);
  }

  get isAvailableDateValid() {
    return (
      this.availableDateEntry.date &&
      this.availableDateEntry.time &&
      this.availableDateEntry.price >= 0
    );
  }

  formatDateYYYYMMDD(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ===== Services Provided =====
  addServiceProvided() {
    if (this.newService.title && this.newService.description) {
      this.activityData.services_provided_list.push({
        title: this.newService.title,
        description: this.newService.description,
      });
      this.newService = { title: '', description: '' };
    }
  }

  removeServiceProvided(index: number) {
    this.activityData.services_provided_list.splice(index, 1);
  }

  // ===== Things To Know =====
  addThingToKnow() {
    const { title, description } = this.newThingToKnow;
    if (title.trim() && description.trim()) {
      this.activityData.things_to_know.push({ title, description });
      this.newThingToKnow = { title: '', description: '' };
    }
  }

  removeThingToKnow(index: number) {
    this.activityData.things_to_know.splice(index, 1);
  }

  // ===== Provided Accommodations =====
  addProvided() {
    const { title } = this.newProvidedAccomodation;
    if (title.trim()) {
      this.accomData.provided_accomodation.push({ title });
      this.newProvidedAccomodation = { title: '' };
    }
  }

  removeProvided(index: number) {
    this.accomData.provided_accomodation.splice(index, 1);
  }

  // ===== File Uploads =====
  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        if (this.selectedOption === 'activity') {
          this.activityData.image = this.imagePreview;
        } else if (this.selectedOption === 'accommodation') {
          this.accomData.image = this.imagePreview;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  onOperatorLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.activityData.operator_logo = reader.result;
        this.operatorLogoPreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // ===== ID Generators =====
  generateAccommId(): string {
    const randomPart = Math.floor(Math.random() * 10000000);
    const formattedRandomPart = randomPart.toString().padStart(8, '0');
    return `acc_${formattedRandomPart}`;
  }

  generateActId(): string {
    const randomPart = Math.floor(Math.random() * 10000000);
    const formattedRandomPart = randomPart.toString().padStart(8, '0');
    return `act_${formattedRandomPart}`;
  }

  // ===== Alert Handling =====
  setOpen(isOpen: boolean) {
    this.isAlertOpen = isOpen;
  }

  // ===== Form Submission =====
  submitForm() {
    if (!this.selectedOption) {
      alert('Please select activity or accommodation.');
      return;
    }

    if (this.selectedOption === 'activity') {
      // --- Activity Submission ---
      const currentUid = localStorage.getItem('uid');
      const parsedUid = currentUid ? parseInt(currentUid, 10) : NaN;
      if (!currentUid || isNaN(parsedUid)) {
        alert('Error: User not logged in. Please login again.');
        this.router.navigate(['/login']);
        return;
      }

      const dataToSend = {
        activity_id: parseInt(this.activityData.activity_id, 10),
        rt_user_id: parsedUid,
        description: this.activityData.description || '',
        address: this.activityData.address || '',
        district: this.activityData.district || '',
        image: this.activityData.image || null,
        operator_logo: this.operatorLogoPreview || null,
        available_dates: this.activityData.available_dates_list || [],
        services_provided: JSON.stringify(
          this.activityData.services_provided_list || [],
        ),
      };

      console.log('Submitting activity:', dataToSend);

      this.apiService.createOperatorActivity(dataToSend).subscribe(
        (res) => {
          console.log('Activity created:', res);
          this.setOpen(true);
        },
        (err) => {
          console.error('Error creating activity:', err);
          alert('Error: ' + (err.error?.message || JSON.stringify(err)));
        },
      );
    }

    if (this.selectedOption === 'accommodation') {
      // --- Accommodation Submission ---

      if (!this.accomData.user_id) {
        alert('Error: User not logged in. Please login again.');
        this.router.navigate(['/login']);
        return;
      }

      this.accomData.accommodation_id = this.generateAccommId();

      // Ensure arrays are not null
      const providedArr = this.accomData.provided_accomodation || [];
      const availableDatesArr = this.accomData.available_dates_list || [];

      const dataToSend = {
        accommodation_id: this.accomData.accommodation_id,
        name: this.accomData.name || this.accomData.address || 'Unknown',
        location:
          this.accomData.location || this.accomData.address || 'Unknown',
        address: this.accomData.address || 'Unknown',
        description: this.accomData.description || '',
        price: this.accomData.price || 0,
        image: this.accomData.image || null,
        district: this.accomData.district || '',
        rt_user_id: this.accomData.user_id,
        show_availability: this.accomData.showAvailability ? 1 : 0,
        provided: JSON.stringify(providedArr),
        available_dates: this.accomData.available_dates_list,
        activity_id: this.accomData.activity_id || null,
      };

      console.log(
        'Submitting accommodation:',
        JSON.stringify(dataToSend, null, 2),
      );

      this.apiService.createAccom(dataToSend).subscribe(
        (res) => {
          console.log('Accommodation created:', res);
          this.setOpen(true);
        },
        (err) => {
          console.error('Error creating accommodation:', err);
          if (err.error?.message?.includes('foreign key constraint')) {
            alert(
              'Error: Your user account was not properly created. Please register again or contact support.',
            );
          } else {
            alert('Error: ' + (err.error?.message || JSON.stringify(err)));
          }
        },
      );
    }
  }

  // ===== Form Validation =====
  isFormComplete() {
    if (this.selectedOption === 'accommodation') {
      return this.accomData.accommodation_id && this.accomData.location;
    } else if (this.selectedOption === 'activity') {
      return this.activityData.activity_name && this.activityData.activity_name;
    }
    return false;
  }
}
