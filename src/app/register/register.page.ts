import { animate, style, transition, trigger } from '@angular/animations';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import { catchError, forkJoin, mergeMap, of } from 'rxjs';
import Swiper from 'swiper';
import { register } from 'swiper/element/bundle';
import { ApiService } from '../services/api.service';

register();

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms 100ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('300ms', style({ opacity: 0 }))]),
    ]),
  ],
})
export class RegisterPage implements AfterViewInit {
  @ViewChild('swiper')
  swiperRef: ElementRef | undefined;
  swiper?: Swiper;

  currentStep = 1; // Track the current step (1 = Step 1, 2 = Step 2, 3 = Step 3)
  selectedOption: string = '';
  page3Visited: Boolean = false;

  @ViewChild('form') form: any;

  confirmPass = {
    confPass: '',
  };

  formData = {
    user_id: '',
    username: '',
    business_name: '',
    user_email: '',
    password: '',
    full_name: '',
    securityQ1: '',
    securityQ2: '',
    district: '',
    company_logo: null,
  };

  activityData = {
    activity_id: '',
    activity_name: '',
    description: '',
    price: '',
    image: '', // Can be a filename or base64 path
    district: '',
    things_to_know: '',
    user_id: localStorage.getItem('uid'),
  };

  accomData = {
    homest_id: '',
    homest_name: '',
    location: '',
    user_id: '',
  };

  constructor(
    private router: Router,
    private apiService: ApiService,
    private navCtrl: NavController,
    private toastController: ToastController
  ) {}

  //cancel button
  cancelButton = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        console.log('Alert canceled');
      },
    },
    {
      text: 'Yes',
      role: 'confirm',
      handler: () => {
        this.navCtrl.navigateForward('/login', {
          animated: true, // Enable animation
          animationDirection: 'back', // Can be 'forward' or 'back' for custom direction
        });
      },
    },
  ];

  //dialog box
  isAlertOpen = false;
  alertButtons = [
    {
      text: 'OK',
      handler: () => {
        // Navigate to the /home route when the button is pressed
        this.router.navigate(['/home']);
      },
    },
  ];

  ngAfterViewInit() {
    this.swiperReady();
  }

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.formData.company_logo = file; // store the file
      console.log('Selected logo:', file);
    }
  }

  async errorToast(msg: any) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 1500,
      position: 'middle',
      cssClass: 'error-toast',
      icon: 'alert-circle',
    });

    await toast.present();
  }

  // Function to check and update the form validity
  checkFormValidity() {
    if (this.form) {
      this.form.form?.updateValueAndValidity(); // Revalidate the form
    }
  }

  generateUserId(): string {
    const randomPart = Math.floor(Math.random() * 10000000); // Random number between 0 and 9999999 (7 digits)
    const formattedRandomPart = randomPart.toString().padStart(8, '0'); // Ensure it has 7 digits
    return `U${formattedRandomPart}`; // Concatenate 'RE' with the 7-digit random number
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

  renderPg: boolean = false;
  // swiper navigation
  goNext() {
    this.swiper?.slideNext();
    this.checkFormValidity();
    this.renderPg = true;
  }

  goPrev() {
    this.swiper?.slidePrev();
    this.checkFormValidity();
  }

  goPrevFirst() {
    this.swiper?.slidePrev();
    this.selectedOption = '';
  }

  // checking
  onSlideChange(event: any) {
    // console.log(event)
  }

  // Go to the next step
  goToStep(step: number) {
    this.currentStep = step;
  }

  // Set the selected option (Activity or Accommodation)
  selectOption(option: string) {
    this.page3Visited = true;
    this.selectedOption = option;
    this.goNext();
  }

  // Custom validator to check if password and confirm password match
  passwordMatchValidator(form: NgForm) {
    const password = form.controls['password'];
    const confirmPassword = form.controls['confPass'];
    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      confirmPassword.setErrors(null);
    }
  }

  // Register the form data and log it
  // submitForm(form: NgForm) {

  //   if (form.valid) {

  //     const user_id = this.generateUserId()
  //     //generate user, accommodation & activity id
  //     this.formData.user_id = user_id

  //     console.log(this.confirmPass.confPass);

  //     //create new user
  //     this.apiService.createUser(this.formData).subscribe(
  //       (Response) => {
  //         console.log('User created successfully:', Response);

  //       },
  //       (error) => {
  //         console.log("Failed:", error);

  //       }
  //     )

  //     if (this.selectedOption == "activity") {
  //       console.log("activity");
  //       this.activityData.activity_id = this.generateActId();
  //       this.activityData.user_id = user_id;
  //       console.log(this.activityData);

  //       //add new activity
  //       this.apiService.createActivity(this.activityData).subscribe(
  //         (Response) => {
  //           console.log('Activity Registered Sucessfully: ', Response);
  //         },
  //         (error) => {
  //           console.log("Failed:", error);

  //         }
  //       )
  //     }

  //     if (this.selectedOption == "accommodation") {
  //       console.log("accomm");
  //       this.accomData.homest_id = this.generateAccommId();
  //       this.accomData.user_id = user_id;

  //       //add new accommodation
  //       this.apiService.createAccom(this.accomData).subscribe(
  //         (Response) => {
  //           console.log('Accommodation Registered Successfully: ', Response);

  //         },
  //         (error) => {
  //           console.log('Failed: ', error);

  //         }
  //       )
  //     }

  //     console.log('Form Data:', this.formData);
  //     console.log('Accomm Data:', this.accomData);
  //     console.log('activity Data:', this.activityData);
  //     this.setOpen(true);

  //   } else {
  //     alert("Ada Salah")
  //   }

  // }

  //registration form step by step check
  submitForm(form: NgForm) {
    if (form.valid) {
      const user_id = this.generateUserId();
      this.formData.user_id = user_id;

      // Prepare FormData for user creation
      const payload = new FormData();
      payload.append('user_id', this.formData.user_id);
      payload.append('business_name', this.formData.business_name);
      payload.append('district', this.formData.district);
      payload.append('full_name', this.formData.full_name);
      payload.append('username', this.formData.username);
      payload.append('user_email', this.formData.user_email);
      payload.append('password', this.formData.password);
      payload.append('securityQ1', this.formData.securityQ1);
      payload.append('securityQ2', this.formData.securityQ2);

      // Append logo if it exists
      if (this.formData.company_logo) {
        payload.append('company_logo', this.formData.company_logo);
      }

      // Step 1: Create the user first
      this.apiService
        .createUser(payload)
        .pipe(
          mergeMap((userResponse) => {
            console.log('User created successfully:', userResponse);

            let createActivity$ = of(null);
            let createAccommodation$ = of(null);

            if (this.selectedOption === 'activity') {
              console.log('activity');
              this.activityData.activity_id = this.generateActId();
              this.activityData.user_id = user_id;
              createActivity$ = this.apiService
                .createActivity(this.activityData)
                .pipe(
                  catchError((error) => {
                    console.log('Failed to create activity:', error);
                    return of(null);
                  })
                );
            }

            if (this.selectedOption === 'accommodation') {
              console.log('accommodation');
              this.accomData.homest_id = this.generateAccommId();
              this.accomData.user_id = user_id;
              createAccommodation$ = this.apiService
                .createAccom(this.accomData)
                .pipe(
                  catchError((error) => {
                    console.log('Failed to create accommodation:', error);
                    return of(null);
                  })
                );
            }

            return forkJoin([createActivity$, createAccommodation$]);
          })
        )
        .subscribe(
          (responses) => {
            const [activityResponse, accommodationResponse] = responses;
            if (activityResponse || accommodationResponse) {
              console.log('Activity or Accommodation created successfully');
            }

            this.setOpen(true);
            localStorage.setItem('uid', user_id);
          },
          (error) => {
            console.log('Registration failed:', error.error?.error || error);
            this.errorToast(error.error?.error || 'Registration failed');
          }
        );
    } else {
      alert('Error: Registration failed');
    }
  }

  // Add a method to check if the form is complete
  isFormComplete() {
    // Check if the required fields for the selected option are filled out
    if (this.selectedOption === 'accommodation') {
      return this.accomData.homest_name && this.accomData.location;
    } else if (this.selectedOption === 'activity') {
      return this.activityData.activity_name && this.activityData.activity_name;
    }
    return false;
  }

  setOpen(isOpen: boolean) {
    this.isAlertOpen = isOpen;
  }
}
