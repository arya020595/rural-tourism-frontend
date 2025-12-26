import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-accomodation-detail',
  templateUrl: './accomodation-detail.page.html',
  styleUrls: ['./accomodation-detail.page.scss'],
})
export class AccomodationDetailPage implements OnInit {

  accommodationId!: string;
  accommodation: any = null;
  loading: boolean = true;
  errorMessage: string = '';
  showAllAmenities: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    this.accommodationId = this.route.snapshot.paramMap.get('id') || '';

    if (this.accommodationId) {
      this.loadAccommodation();
    } else {
      this.loading = false;
      this.errorMessage = 'Invalid accommodation ID.';
    }
  }

  goBack() {
    this.navCtrl.back();
  }

  loadAccommodation() {
    this.loading = true;

    this.apiService.getAccommodationById(this.accommodationId).subscribe({
      next: (res: any) => {
        this.accommodation = res;

        const provided = this.accommodation?.provided_accomodation || [];
        let amenities: string[] = [];

        if (Array.isArray(provided)) {
          provided.forEach((item: any) => {
            try {
              const parsed = typeof item === 'string' ? JSON.parse(item) : item;
              if (parsed?.title) amenities.push(parsed.title);
            } catch (err) {
              console.warn('Error parsing provided item:', item, err);
            }
          });
        } else if (typeof provided === 'string') {
          try {
            const parsedArray = JSON.parse(provided);
            parsedArray.forEach((item: any) => {
              if (item?.title) amenities.push(item.title);
            });
          } catch {
            amenities = provided.split(',').map(a => a.trim());
          }
        }

        this.accommodation.amenities = amenities || [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.errorMessage = 'Accommodation not found.';
        this.loading = false;
      }
    });
  }

  getAccommodationImage(imageData: string): string {
    if (!imageData) return 'assets/icon/placeholder.png';
    if (imageData.startsWith('http') || imageData.startsWith('data:image')) return imageData;
    return `http://localhost:3000/uploads/accommodations/${imageData}`;
  }

  toggleAmenities() {
    this.showAllAmenities = !this.showAllAmenities;
  }

  bookNow() {
    if (!this.accommodation || !this.accommodation.id) {
      console.error('Accommodation info missing');
      return;
    }

    const userData = localStorage.getItem('user');
    if (!userData) {
      this.showLoginAlert();
      return;
    }

    const user = JSON.parse(userData);
    const touristUserId = user.tourist_user_id;

    // ✅ send "no_of_pax" and keep "no_of_rooms" for compatibility
    this.navCtrl.navigateForward(['/tourist/accommodation-booking'], {
      queryParams: {
        accommodation_id: this.accommodation.id,
        price: this.accommodation.price,
        operator_id: this.accommodation.operator_id,
        tourist_user_id: touristUserId,
        no_of_pax: 1,      // new key
        no_of_rooms: 1     // keep this temporarily for backward compatibility
      },
    });
  }

  async showLoginAlert() {
    const alert = document.createElement('ion-alert');
    alert.header = 'Login Required';
    alert.message = 'You need to log in to book this accommodation.';
    alert.buttons = [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Login',
        handler: () => {
          this.navCtrl.navigateForward(['/tourist/login'], {
            queryParams: {
              redirect: '/tourist/accommodation-booking',
              accommodation_id: this.accommodation.id,
              operator_id: this.accommodation.operator_id,
              price: this.accommodation.price,
            },
          });
        },
      },
    ];
    document.body.appendChild(alert);
    await alert.present();
  }
}
