import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { register } from 'swiper/element/bundle';
import { Router } from '@angular/router';
import Swiper from 'swiper';
import { ApiService } from '../services/api.service';
import { NgForm } from '@angular/forms';
import { NavController } from '@ionic/angular';
import { Title } from '@angular/platform-browser';

register();

@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.page.html',
  styleUrls: ['./add-item.page.scss'],
})
export class AddItemPage implements OnInit {

  @ViewChild('swiper')
  swiperRef: ElementRef | undefined;
  swiper?: Swiper

  currentStep = 1; // Track the current step (1 = Step 1, 2 = Step 2, 3 = Step 3)
  selectedOption: string = '';


activityTypes: any[] = []; // To hold activity master data

districtList: string[] = [
  'Kiulu',
  'Kota Belud',
  'Kundasang',
  'Ranau',
  'Sandakan',
  'Tawau',
  'Kota Kinabalu'
  // add more districts here
];

  
activityData = {
  activity_id: '',
  activity_type_id: '',
  activity_name: '',
  location: '',
  description: '',
  price: '',
  image: '',        
  district: '',
   operator_logo: '' as string | ArrayBuffer | null,
  things_to_know: [] as { title: string; description: string }[],
  user_id: localStorage.getItem('uid'),
  address: '',
  showInSuggestions: false, 
  services_provided_list: [] as { title: string; description: string }[],
};

imagePreview: string | null = null;

newService = {
  title: '',
  description: ''
};


newThingToKnow = {
  title: '',
  description: ''
};

newProvidedAccomodation = {
  title: ''
}


  accomData = {
    accommodation_id: '',
    name: '',
    location: '',
    description: '',
    price: '',
    image: '',
    address: '',
    district: '',
    provided_accomodation: [] as { title: string;}[],
    user_id: localStorage.getItem('uid'),
    showAvailability : false,
    activity_id: ''
  };

  constructor(
    private router: Router,
    private apiService: ApiService,
    private navController: NavController
  ) { }

  ngAfterViewInit() {
    this.swiperReady();
  }

  ngOnInit() {
  this.loadActivityTypes();
}

selectActivity(activityId: string) {
  this.activityData.activity_id = activityId; // now it's set
  const selected = this.activityTypes.find(a => a.id === activityId);
  if (selected) {
    this.activityData.activity_name = selected.activity_name;
    this.activityData.district = selected.district || '';
  }
}





loadActivityTypes() {
  this.apiService.getAllActivityMasterData().subscribe((res: any) => {
    this.activityTypes = res;
    console.log('Activity types:', this.activityTypes);
  }, err => {
    console.error('Error fetching activity master data', err);
  });
}



  // ngOnInit() {
    
  // }

  //dialog box
  isAlertOpen = false;
  alertButtons = [
    {
      text: 'OK',
      handler: () => {
        // Navigate to the /home route when the button is pressed
        this.navController.navigateForward('/home', {
          animated: true,        // Enable animation
          animationDirection: 'back'  // Can be 'forward' or 'back' for custom direction
        });
      },
    },
  ];

  cancelButton = [
    {
      text: 'Tidak',
      role: 'cancel',
      handler: () => {
        console.log('Alert canceled');
      },
    },
    {
      text: 'Ya',
      role: 'confirm',
      handler: () => {
        this.navController.navigateForward('/home', {
          animated: true,        // Enable animation
          animationDirection: 'back'  // Can be 'forward' or 'back' for custom direction
        });
      },
    },
  ];

  setOpen(isOpen: boolean) {
    this.isAlertOpen = isOpen;
  }


addProvided() {
  const { title } = this.newProvidedAccomodation;
  if (title.trim()) {
    this.accomData.provided_accomodation.push({ title });
    this.newProvidedAccomodation = { title: ''}; // reset form
  }
}

removeProvided(index: number) {
  this.accomData.provided_accomodation.splice(index, 1);
}

addServiceProvided() {
  if(this.newService.title && this.newService.description) {
    this.activityData.services_provided_list.push({ 
      title: this.newService.title, 
      description: this.newService.description 
    });
    // Reset input fields after adding
    this.newService.title = '';
    this.newService.description = '';
  }
}

removeServiceProvided(index: number) {
  this.activityData.services_provided_list.splice(index, 1);
}

operatorLogoPreview: string | ArrayBuffer | null = null;

onOperatorLogoSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      this.activityData.operator_logo = reader.result; // Type now matches
      this.operatorLogoPreview = reader.result;       // for preview
    };
    reader.readAsDataURL(file);
  }
}

addThingToKnow() {
  const { title, description } = this.newThingToKnow;
  if (title.trim() && description.trim()) {
    this.activityData.things_to_know.push({ title, description });
    this.newThingToKnow = { title: '', description: '' }; // reset form
  }
}

removeThingToKnow(index: number) {
  this.activityData.things_to_know.splice(index, 1);
}


onImageSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;

      // Assign image to the correct data object
      if (this.selectedOption === 'activity') {
        this.activityData.image = this.imagePreview;
      } else if (this.selectedOption === 'accommodation') {
        this.accomData.image = this.imagePreview;
      }
    };
    reader.readAsDataURL(file);
  }
}


  generateAccommId(): string {
    const randomPart = Math.floor(Math.random() * 10000000); // Random number between 0 and 9999999 (7 digits)
    const formattedRandomPart = randomPart.toString().padStart(8, '0'); // Ensure it has 7 digits
    return `acc_${formattedRandomPart}`; // Concatenate 'RE' with the 7-digit random number
  }

  generateActId(): string {
    const randomPart = Math.floor(Math.random() * 10000000); // Random number between 0 and 9999999 (7 digits)
    const formattedRandomPart = randomPart.toString().padStart(8, '0'); // Ensure it has 7 digits
    return `act_${formattedRandomPart}`; // Concatenate 'RE' with the 7-digit random number
  }


   //initialize swiper
   swiperReady() {

    // Ensure swiperRef is initialized, and access the swiper instance
  if (this.swiperRef?.nativeElement) {
    this.swiper = this.swiperRef.nativeElement.swiper;

    // Check if swiper is initialized before modifying it
    if (this.swiper) {
      this.swiper.allowTouchMove = false; // Disable swiping
    }
  }
  }

  // swiper navigation
  goNext() {
    // this.swiper?.slideNext()
    this.swiper?.slideNext();
    console.log('here');
    
  }

  goPrev() {
    this.swiper?.slidePrev();
  }

   // Go to the next step
   goToStep(step: number) {
    this.currentStep = step;
  }

  // Set the selected option (Activity or Accommodation)
  selectOption(option: string) {
    this.selectedOption = option;
    this.goNext();
  }


onShowInAvailability() {
  console.log('Show Availability changed:', this.accomData.showAvailability);
}


  onShowInSuggestionsChange() {
  console.log('Show in Suggestions changed:', this.activityData.showInSuggestions);
}

  submitForm(){

  if (this.selectedOption === 'activity') {
    const dataToSend = {
      id: this.generateActId(),
      activity_id: parseInt(this.activityData.activity_id), // ensure integer
      rt_user_id: this.activityData.user_id,
      description: this.activityData.description || '',
      address: this.activityData.address || '',
      district: this.activityData.district, // must not be empty
      image: this.activityData.image || null,
      operator_logo: this.operatorLogoPreview || null,
      services_provided: JSON.stringify(this.activityData.services_provided_list),
      price_per_pax: this.activityData.price || null
    };

    this.apiService.createOperatorActivity(dataToSend).subscribe(
      (res) => {
        console.log('Activity created:', res);
        this.setOpen(true);
      },
      (err) => {
        console.error('Error creating activity:', err);
        alert('Error: ' + err);
      }
    );
  }


    

    // if (this.selectedOption === "activity") {
    //   this.activityData.activity_id = this.generateActId();

        // Convert array to JSON string if needed by backend
        // const dataToSend = {
        //   ...this.activityData,
        //   showInSuggestions: this.activityData.showInSuggestions ? 1 : 0,
        //   rt_user_id: this.activityData.user_id,  // current operator
        //   things_to_know: JSON.stringify(this.activityData.things_to_know),
        //   services_provided: JSON.stringify(this.activityData.services_provided_list)

        // };

        

    //       const dataToSend = {
    //         id: this.generateActId(), // Use `id` instead of activity_id
    //         activity_name: this.activityData.activity_name,
    //         location: this.activityData.location,
    //         description: this.activityData.description,
    //         price: this.activityData.price,
    //         image: this.activityData.image,
    //         showInSuggestions: this.activityData.showInSuggestions ? 1 : 0,
    //         rt_user_id: this.activityData.user_id,
    //         things_to_know: JSON.stringify(this.activityData.things_to_know),
    //         services_provided: JSON.stringify(this.activityData.services_provided_list)
    //       };


    //   this.apiService.createOperatorActivity(dataToSend).subscribe(
    //     (Response)=>{
    //       console.log(Response);
    //       console.log('Activity Data:', this.activityData);
    //       this.setOpen(true);
    //     },
    //     (error)=>{
    //       console.log(error);
    //       alert("Error: " +error)
    //     }
    //   )
      
    // }


if (this.selectedOption === "accommodation") {
  // Generate accommodation ID
  this.accomData.accommodation_id = this.generateAccommId();

  // Ensure required fields are included
  const dataToSend = {
    accommodation_id: this.accomData.accommodation_id,
    name: this.accomData.name || this.accomData.address, // fallback if name is empty
    location: this.accomData.location || this.accomData.address, // map address to location
    address: this.accomData.address,
    description: this.accomData.description,
    price: this.accomData.price,
    image: this.accomData.image,
    district: this.accomData.district,
    user_id: this.accomData.user_id, // required
    showAvailability: this.accomData.showAvailability ? 1 : 0,
    provided_accomodation: JSON.stringify(this.accomData.provided_accomodation),
    activity_id: this.accomData.activity_id
  };

  this.apiService.createAccom(dataToSend).subscribe(
    res => {
      console.log('Accommodation created:', res);
      this.setOpen(true);
    },
    err => {
      console.error('Error creating accommodation:', err);
      alert('Error: ' + JSON.stringify(err));
    }
  );
}

   
  }

   // checking
   onSlideChange(event: any) {
    // console.log(event)
  }

  // Add a method to check if the form is complete
  isFormComplete() {
    // Check if the required fields for the selected option are filled out
    if (this.selectedOption === 'accommodation') {
      return this.accomData.accommodation_id && this.accomData.location;
    } else if (this.selectedOption === 'activity') {
      return this.activityData.activity_name && this.activityData.activity_name;
    }
    return false;
  }


}
