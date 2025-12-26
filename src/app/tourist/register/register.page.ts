import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  full_name = '';
  email_address = '';
  contact_no = '';
  username = '';
  password = '';
  confirm_password = '';
  nationality = '';
  phonePrefix = '';
  phoneExample = '';
  
  // Simple example mapping (you can extend this)
countries = [
  { name: 'Malaysia', dial_code: '+60' },
  { name: 'Brunei', dial_code: '+673' },
  { name: 'Singapore', dial_code: '+65' },
  { name: 'Indonesia', dial_code: '+62' },
  { name: 'Philippines', dial_code: '+63' },
  { name: 'Thailand', dial_code: '+66' },
  { name: 'Vietnam', dial_code: '+84' },
  { name: 'India', dial_code: '+91' },
  { name: 'China', dial_code: '+86' },
  { name: 'United Kingdom', dial_code: '+44' },
  { name: 'United States', dial_code: '+1' },
  // ✅ Add more as needed (you can have a full 200-country list here)
];

selectedCountryName: string = ''; // e.g., 'Malaysia'

  nationalities: string[] = [
    'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Antiguan and Barbudan',
    'Argentine', 'Armenian', 'Australian', 'Austrian', 'Azerbaijani', 'Bahamian', 'Bahraini',
    'Bangladeshi', 'Barbadian', 'Belarusian', 'Belgian', 'Belizean', 'Beninese', 'Bhutanese',
    'Bolivian', 'Bosnian', 'Botswanan', 'Brazilian', 'British', 'Bruneian', 'Bulgarian', 'Burkinabé',
    'Burmese', 'Burundian', 'Cambodian', 'Cameroonian', 'Canadian', 'Cape Verdean', 'Central African',
    'Chadian', 'Chilean', 'Chinese', 'Colombian', 'Comoran', 'Congolese (Congo-Brazzaville)',
    'Congolese (Congo-Kinshasa)', 'Costa Rican', 'Croatian', 'Cuban', 'Cypriot', 'Czech',
    'Danish', 'Djiboutian', 'Dominican', 'Dutch', 'Ecuadorian', 'Egyptian', 'Emirati', 'English',
    'Equatorial Guinean', 'Eritrean', 'Estonian', 'Ethiopian', 'Fijian', 'Finnish', 'French',
    'Gabonese', 'Gambian', 'Georgian', 'German', 'Ghanaian', 'Greek', 'Grenadian', 'Guatemalan',
    'Guinean', 'Guyanese', 'Haitian', 'Honduran', 'Hungarian', 'Icelandic', 'Indian', 'Indonesian',
    'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian', 'Ivorian', 'Jamaican', 'Japanese', 'Jordanian',
    'Kazakh', 'Kenyan', 'Kittitian and Nevisian', 'Kuwaiti', 'Kyrgyz', 'Lao', 'Latvian', 'Lebanese',
    'Liberian', 'Libyan', 'Liechtensteiner', 'Lithuanian', 'Luxembourgish', 'Malagasy', 'Malawian',
    'Malaysian', 'Maldivian', 'Malian', 'Maltese', 'Marshallese', 'Mauritanian', 'Mauritian',
    'Mexican', 'Micronesian', 'Moldovan', 'Monacan', 'Mongolian', 'Montenegrin', 'Moroccan',
    'Mozambican', 'Namibian', 'Nauruan', 'Nepalese', 'New Zealander', 'Nicaraguan', 'Nigerien',
    'Nigerian', 'North Korean', 'North Macedonian', 'Norwegian', 'Omani', 'Pakistani', 'Palauan',
    'Palestinian', 'Panamanian', 'Papua New Guinean', 'Paraguayan', 'Peruvian', 'Philippine',
    'Polish', 'Portuguese', 'Qatari', 'Romanian', 'Russian', 'Rwandan', 'Saint Lucian',
    'Salvadoran', 'Samoan', 'San Marinese', 'Sao Tomean', 'Saudi', 'Scottish', 'Senegalese',
    'Serbian', 'Seychellois', 'Sierra Leonean', 'Singaporean', 'Slovak', 'Slovenian', 'Solomon Islander',
    'Somali', 'South African', 'South Korean', 'Spanish', 'Sri Lankan', 'Sudanese', 'Surinamese',
    'Swazi', 'Swedish', 'Swiss', 'Syrian', 'Taiwanese', 'Tajik', 'Tanzanian', 'Thai', 'Togolese',
    'Tongan', 'Trinidadian and Tobagonian', 'Tunisian', 'Turkish', 'Turkmen', 'Tuvaluan', 'Ugandan',
    'Ukrainian', 'Uruguayan', 'Uzbek', 'Vanuatuan', 'Venezuelan', 'Vietnamese', 'Welsh', 'Yemeni',
    'Zambian', 'Zimbabwean'
  ];

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private http: HttpClient,
    private alertController: AlertController
  ) {}

  // Cancel button alert options
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
        this.navCtrl.navigateForward('/role', {
          animated: true,
          animationDirection: 'back',
        });
      },
    },
  ];

  ngOnInit() {}

  // when nationality changes, update phone prefix
onNationalityChange() {
  const match = this.countries.find(c =>
    this.nationality.toLowerCase().includes(c.name.toLowerCase())
  );

  if (match) {
    this.phonePrefix = match.dial_code;
  } else {
    this.phonePrefix = '';
  }
}

onCountryCodeChange(event: any) {
  const selected = this.countries.find(c => c.dial_code === event.detail.value);
  if (selected) {
    this.selectedCountryName = selected.name; // store name internally
  }
}



  //Function to register user
  async registerUser() {
    if (
      !this.full_name ||
      !this.email_address ||
      !this.contact_no ||
      !this.username ||
      !this.password ||
      !this.confirm_password ||
      !this.nationality
    ) {
      this.showAlert('Error', 'Please fill in all fields.');
      return;
    }

    if (this.password !== this.confirm_password) {
      this.showAlert('Error', 'Passwords do not match.');
      return;
    }

    //Combine country code and user input
    const fullContactNo = `${this.phonePrefix}${this.contact_no}`;

    // Prepare the data to send
    const data = {
      full_name: this.full_name,
      user_email: this.email_address,
      contact_no: fullContactNo,
      username: this.username,
      password: this.password,
      nationality: this.nationality
    };

try {
  const response: any = await this.http
    .post('http://localhost:3000/api/tourists/register', data)
    .toPromise();

  if (response && response.message) {
    // Save the user to localStorage
    if (response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));

      // Optional: save tourist_user_id separately
      if (response.user.tourist_user_id) {
        localStorage.setItem('tourist_user_id', response.user.tourist_user_id);
      }
    }

    await this.showAlert('Success', response.message);

    // Navigate to HomePage
    this.navCtrl.navigateForward('/tourist/home');
  }
} catch (error: any) {
  console.error(error);
  const errMsg = error.error?.error || 'Registration failed.';
  this.showAlert('Error', errMsg);
}

  }

  // Helper function for alerts
  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
