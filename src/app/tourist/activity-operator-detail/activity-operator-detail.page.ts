import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-activity-operator-detail',
  templateUrl: './activity-operator-detail.page.html',
  styleUrls: ['./activity-operator-detail.page.scss'],
})
export class ActivityOperatorDetailPage implements OnInit {
  operatorId: string | null = null;
  operatorData: any = null; // Holds all operator info
  isFavorite: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.operatorId = this.route.snapshot.paramMap.get('id');
    if (this.operatorId) {
      this.loadOperatorDetail(this.operatorId);
    } else {
      console.warn('No operator ID provided.');
    }
  }

  loadOperatorDetail(operatorId: string) {
    this.api.getOperatorById(operatorId).subscribe(
      (res: any) => {
        console.log('Operator detail:', res);

        // Parse services_provided_list if it's a string
        let services: any[] = [];
        if (res.services_provided_list) {
          try {
            services = Array.isArray(res.services_provided_list)
              ? res.services_provided_list
              : JSON.parse(res.services_provided_list);
          } catch (err) {
            console.error('Error parsing services_provided_list:', err);
            services = [];
          }
        }

        this.operatorData = {
          ...res,
          business_name: res.business_name || res.rt_user?.business_name || 'No Business Name',
          image: res.image || 'assets/default-operator.jpg',
          address: res.address || 'No address provided',
          district: res.district || '',
          description: res.description || 'No description available',
          services_provided_list: services,
          price_per_pax: res.price_per_pax || 0,
        };
      },
      (err) => console.error('Error loading operator details:', err)
    );
  }

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
    console.log('Favorite status:', this.isFavorite);
  }

  async proceed() {
    const userData = localStorage.getItem('user');

    // If user not logged in, prompt login
    if (!userData) {
      const alert = document.createElement('ion-alert');
      alert.header = 'Login Required';
      alert.message = 'You need to log in before making a booking.';
      alert.buttons = [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Login',
          handler: () => {
            // Pass redirect info and activity details
            this.navCtrl.navigateForward(['/tourist/login'], {
              queryParams: {
                redirect: '/tourist/activity-booking',
                activity_id: this.operatorData?.activity_id,
                operator_id: this.operatorId,
                price: this.operatorData?.price_per_pax || 0,
              },
            });
          },
        },
      ];
      document.body.appendChild(alert);
      await alert.present();
      return;
    }

    // Parse logged-in user
    const user = JSON.parse(userData);
    const touristUserId = user.tourist_user_id;

    // Ensure IDs exist
    if (!this.operatorData?.activity_id || !this.operatorId) {
      console.error('Missing activity_id or operator_id');
      return;
    }

    // Navigate to booking page with all parameters
    this.navCtrl.navigateForward(['/tourist/activity-booking'], {
      queryParams: {
        activity_id: this.operatorData.activity_id,
        operator_id: this.operatorId,
        tourist_user_id: touristUserId,
        price: this.operatorData.price_per_pax || 0,
      },
    });
  }

  backHome() {
    this.navCtrl.back();
  }
}
