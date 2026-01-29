import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';

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

  countries = [
    { name: 'Afghanistan', dial_code: '+93' },
    { name: 'Albania', dial_code: '+355' },
    { name: 'Algeria', dial_code: '+213' },
    { name: 'Andorra', dial_code: '+376' },
    { name: 'Angola', dial_code: '+244' },
    { name: 'Antigua and Barbuda', dial_code: '+1-268' },
    { name: 'Argentina', dial_code: '+54' },
    { name: 'Armenia', dial_code: '+374' },
    { name: 'Australia', dial_code: '+61' },
    { name: 'Austria', dial_code: '+43' },
    { name: 'Azerbaijan', dial_code: '+994' },
    { name: 'Bahamas', dial_code: '+1-242' },
    { name: 'Bahrain', dial_code: '+973' },
    { name: 'Bangladesh', dial_code: '+880' },
    { name: 'Barbados', dial_code: '+1-246' },
    { name: 'Belarus', dial_code: '+375' },
    { name: 'Belgium', dial_code: '+32' },
    { name: 'Belize', dial_code: '+501' },
    { name: 'Benin', dial_code: '+229' },
    { name: 'Bhutan', dial_code: '+975' },
    { name: 'Bolivia', dial_code: '+591' },
    { name: 'Bosnia and Herzegovina', dial_code: '+387' },
    { name: 'Botswana', dial_code: '+267' },
    { name: 'Brazil', dial_code: '+55' },
    { name: 'Brunei', dial_code: '+673' },
    { name: 'Bulgaria', dial_code: '+359' },
    { name: 'Burkina Faso', dial_code: '+226' },
    { name: 'Burundi', dial_code: '+257' },
    { name: 'Cambodia', dial_code: '+855' },
    { name: 'Cameroon', dial_code: '+237' },
    { name: 'Canada', dial_code: '+1' },
    { name: 'Cape Verde', dial_code: '+238' },
    { name: 'Central African Republic', dial_code: '+236' },
    { name: 'Chad', dial_code: '+235' },
    { name: 'Chile', dial_code: '+56' },
    { name: 'China', dial_code: '+86' },
    { name: 'Colombia', dial_code: '+57' },
    { name: 'Comoros', dial_code: '+269' },
    { name: 'Congo (Brazzaville)', dial_code: '+242' },
    { name: 'Congo (Kinshasa)', dial_code: '+243' },
    { name: 'Costa Rica', dial_code: '+506' },
    { name: 'Croatia', dial_code: '+385' },
    { name: 'Cuba', dial_code: '+53' },
    { name: 'Cyprus', dial_code: '+357' },
    { name: 'Czech Republic', dial_code: '+420' },
    { name: 'Denmark', dial_code: '+45' },
    { name: 'Djibouti', dial_code: '+253' },
    { name: 'Dominica', dial_code: '+1-767' },
    { name: 'Dominican Republic', dial_code: '+1-809' },
    { name: 'Ecuador', dial_code: '+593' },
    { name: 'Egypt', dial_code: '+20' },
    { name: 'El Salvador', dial_code: '+503' },
    { name: 'Equatorial Guinea', dial_code: '+240' },
    { name: 'Eritrea', dial_code: '+291' },
    { name: 'Estonia', dial_code: '+372' },
    { name: 'Eswatini', dial_code: '+268' },
    { name: 'Ethiopia', dial_code: '+251' },
    { name: 'Fiji', dial_code: '+679' },
    { name: 'Finland', dial_code: '+358' },
    { name: 'France', dial_code: '+33' },
    { name: 'Gabon', dial_code: '+241' },
    { name: 'Gambia', dial_code: '+220' },
    { name: 'Georgia', dial_code: '+995' },
    { name: 'Germany', dial_code: '+49' },
    { name: 'Ghana', dial_code: '+233' },
    { name: 'Greece', dial_code: '+30' },
    { name: 'Grenada', dial_code: '+1-473' },
    { name: 'Guatemala', dial_code: '+502' },
    { name: 'Guinea', dial_code: '+224' },
    { name: 'Guinea-Bissau', dial_code: '+245' },
    { name: 'Guyana', dial_code: '+592' },
    { name: 'Haiti', dial_code: '+509' },
    { name: 'Honduras', dial_code: '+504' },
    { name: 'Hungary', dial_code: '+36' },
    { name: 'Iceland', dial_code: '+354' },
    { name: 'India', dial_code: '+91' },
    { name: 'Indonesia', dial_code: '+62' },
    { name: 'Iran', dial_code: '+98' },
    { name: 'Iraq', dial_code: '+964' },
    { name: 'Ireland', dial_code: '+353' },
    { name: 'Israel', dial_code: '+972' },
    { name: 'Italy', dial_code: '+39' },
    { name: 'Jamaica', dial_code: '+1-876' },
    { name: 'Japan', dial_code: '+81' },
    { name: 'Jordan', dial_code: '+962' },
    { name: 'Kazakhstan', dial_code: '+7' },
    { name: 'Kenya', dial_code: '+254' },
    { name: 'Kiribati', dial_code: '+686' },
    { name: 'Korea, North', dial_code: '+850' },
    { name: 'Korea, South', dial_code: '+82' },
    { name: 'Kuwait', dial_code: '+965' },
    { name: 'Kyrgyzstan', dial_code: '+996' },
    { name: 'Laos', dial_code: '+856' },
    { name: 'Latvia', dial_code: '+371' },
    { name: 'Lebanon', dial_code: '+961' },
    { name: 'Lesotho', dial_code: '+266' },
    { name: 'Liberia', dial_code: '+231' },
    { name: 'Libya', dial_code: '+218' },
    { name: 'Liechtenstein', dial_code: '+423' },
    { name: 'Lithuania', dial_code: '+370' },
    { name: 'Luxembourg', dial_code: '+352' },
    { name: 'Malaysia', dial_code: '+60' },
    { name: 'Maldives', dial_code: '+960' },
    { name: 'Malta', dial_code: '+356' },
    { name: 'Mexico', dial_code: '+52' },
    { name: 'Netherlands', dial_code: '+31' },
    { name: 'New Zealand', dial_code: '+64' },
    { name: 'Nigeria', dial_code: '+234' },
    { name: 'Norway', dial_code: '+47' },
    { name: 'Pakistan', dial_code: '+92' },
    { name: 'Philippines', dial_code: '+63' },
    { name: 'Poland', dial_code: '+48' },
    { name: 'Portugal', dial_code: '+351' },
    { name: 'Qatar', dial_code: '+974' },
    { name: 'Romania', dial_code: '+40' },
    { name: 'Russia', dial_code: '+7' },
    { name: 'Saudi Arabia', dial_code: '+966' },
    { name: 'Singapore', dial_code: '+65' },
    { name: 'South Africa', dial_code: '+27' },
    { name: 'Spain', dial_code: '+34' },
    { name: 'Sweden', dial_code: '+46' },
    { name: 'Switzerland', dial_code: '+41' },
    { name: 'Thailand', dial_code: '+66' },
    { name: 'Turkey', dial_code: '+90' },
    { name: 'United Arab Emirates', dial_code: '+971' },
    { name: 'United Kingdom', dial_code: '+44' },
    { name: 'United States', dial_code: '+1' },
    { name: 'Vietnam', dial_code: '+84' },
  ];

  selectedCountryName: string = '';

  nationalities: string[] = [
    'Afghan',
    'Albanian',
    'Algerian',
    'American',
    'Andorran',
    'Angolan',
    'Antiguan and Barbudan',
    'Argentine',
    'Armenian',
    'Australian',
    'Austrian',
    'Azerbaijani',
    'Bahamian',
    'Bahraini',
    'Bangladeshi',
    'Barbadian',
    'Belarusian',
    'Belgian',
    'Belizean',
    'Beninese',
    'Bhutanese',
    'Bolivian',
    'Bosnian',
    'Botswanan',
    'Brazilian',
    'British',
    'Bruneian',
    'Bulgarian',
    'Burkinabé',
    'Burmese',
    'Canadian',
    'Cape Verdean',
    'Chilean',
    'Chinese',
    'Colombian',
    'Costa Rican',
    'Croatian',
    'Cuban',
    'Cypriot',
    'Czech',
    'Danish',
    'Dutch',
    'Ecuadorian',
    'Egyptian',
    'Emirati',
    'English',
    'Estonian',
    'Finnish',
    'French',
    'German',
    'Ghanaian',
    'Greek',
    'Guatemalan',
    'Honduran',
    'Hungarian',
    'Icelandic',
    'Indian',
    'Indonesian',
    'Iranian',
    'Iraqi',
    'Irish',
    'Israeli',
    'Italian',
    'Jamaican',
    'Japanese',
    'Jordanian',
    'Kazakh',
    'Kenyan',
    'Kuwaiti',
    'Latvian',
    'Lebanese',
    'Lithuanian',
    'Luxembourgish',
    'Malaysian',
    'Mexican',
    'Nepalese',
    'New Zealander',
    'Nigerian',
    'Norwegian',
    'Pakistani',
    'Philippine',
    'Polish',
    'Portuguese',
    'Qatari',
    'Romanian',
    'Russian',
    'Saudi',
    'Singaporean',
    'South Korean',
    'Spanish',
    'Swedish',
    'Swiss',
    'Thai',
    'Turkish',
    'Ukrainian',
    'United States',
  ];

  // Mapping nationality → country name
  nationalityToCountry: { [key: string]: string } = {
    Afghan: 'Afghanistan',
    Albanian: 'Albania',
    Algerian: 'Algeria',
    American: 'United States',
    Andorran: 'Andorra',
    Angolan: 'Angola',
    'Antiguan and Barbudan': 'Antigua and Barbuda',
    Argentine: 'Argentina',
    Armenian: 'Armenia',
    Australian: 'Australia',
    Austrian: 'Austria',
    Azerbaijani: 'Azerbaijan',
    Bahamian: 'Bahamas',
    Bahraini: 'Bahrain',
    Bangladeshi: 'Bangladesh',
    Barbadian: 'Barbados',
    Belarusian: 'Belarus',
    Belgian: 'Belgium',
    Belizean: 'Belize',
    Beninese: 'Benin',
    Bhutanese: 'Bhutan',
    Bolivian: 'Bolivia',
    Bosnian: 'Bosnia and Herzegovina',
    Botswanan: 'Botswana',
    Brazilian: 'Brazil',
    British: 'United Kingdom',
    Bruneian: 'Brunei',
    Bulgarian: 'Bulgaria',
    Burkinabé: 'Burkina Faso',
    Burmese: 'Burma', // you might need 'Myanmar'
    Canadian: 'Canada',
    'Cape Verdean': 'Cape Verde',
    Chilean: 'Chile',
    Chinese: 'China',
    Colombian: 'Colombia',
    'Costa Rican': 'Costa Rica',
    Croatian: 'Croatia',
    Cuban: 'Cuba',
    Cypriot: 'Cyprus',
    Czech: 'Czech Republic',
    Danish: 'Denmark',
    Dutch: 'Netherlands',
    Ecuadorian: 'Ecuador',
    Egyptian: 'Egypt',
    Emirati: 'United Arab Emirates',
    English: 'United Kingdom',
    Estonian: 'Estonia',
    Finnish: 'Finland',
    French: 'France',
    German: 'Germany',
    Ghanaian: 'Ghana',
    Greek: 'Greece',
    Guatemalan: 'Guatemala',
    Honduran: 'Honduras',
    Hungarian: 'Hungary',
    Icelandic: 'Iceland',
    Indian: 'India',
    Indonesian: 'Indonesia',
    Iranian: 'Iran',
    Iraqi: 'Iraq',
    Irish: 'Ireland',
    Israeli: 'Israel',
    Italian: 'Italy',
    Jamaican: 'Jamaica',
    Japanese: 'Japan',
    Jordanian: 'Jordan',
    Kazakh: 'Kazakhstan',
    Kenyan: 'Kenya',
    Kuwaiti: 'Kuwait',
    Latvian: 'Latvia',
    Lebanese: 'Lebanon',
    Lithuanian: 'Lithuania',
    Luxembourgish: 'Luxembourg',
    Malaysian: 'Malaysia',
    Mexican: 'Mexico',
    Nepalese: 'Nepal',
    'New Zealander': 'New Zealand',
    Nigerian: 'Nigeria',
    Norwegian: 'Norway',
    Pakistani: 'Pakistan',
    Philippine: 'Philippines',
    Polish: 'Poland',
    Portuguese: 'Portugal',
    Qatari: 'Qatar',
    Romanian: 'Romania',
    Russian: 'Russia',
    Saudi: 'Saudi Arabia',
    Singaporean: 'Singapore',
    'South Korean': 'Korea, South',
    Spanish: 'Spain',
    Swedish: 'Sweden',
    Swiss: 'Switzerland',
    Thai: 'Thailand',
    Turkish: 'Turkey',
    Ukrainian: 'Ukraine',
    'United States': 'United States',
  };

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private http: HttpClient,
    private alertController: AlertController,
  ) {}

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

  onNationalityChange() {
    const countryName = this.nationalityToCountry[this.nationality];
    if (!countryName) {
      this.phonePrefix = '';
      return;
    }

    const match = this.countries.find((c) => c.name === countryName);
    this.phonePrefix = match ? match.dial_code : '';
  }

  onCountryCodeChange(event: any) {
    const selected = this.countries.find(
      (c) => c.dial_code === event.detail.value,
    );
    if (selected) {
      this.selectedCountryName = selected.name;
    }
  }

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

    const fullContactNo = `${this.phonePrefix}${this.contact_no}`;

    const data = {
      full_name: this.full_name,
      email: this.email_address,
      contact_no: fullContactNo,
      username: this.username,
      password: this.password,
      nationality: this.nationality,
    };

    try {
      const response: any = await this.http
        .post('http://localhost:3000/api/tourists/register', data)
        .toPromise();

      if (response && response.message) {
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
          if (response.user.tourist_user_id) {
            localStorage.setItem(
              'tourist_user_id',
              response.user.tourist_user_id,
            );
          }
        }
        await this.showAlert('Success', response.message);
        this.navCtrl.navigateForward('/tourist/login');
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
