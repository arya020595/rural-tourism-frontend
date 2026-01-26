import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, AlertController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';

interface AvailableDate {
  date: string;
  price?: number;
  time?: string;
  startTime?: string;
  endTime?: string;
}

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
    private api: ApiService,
    private alertController: AlertController // ✅ proper Ionic alerts
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

        let services: any[] = [];
        if (res.services_provided_list) {
          try {
            services = Array.isArray(res.services_provided_list)
              ? res.services_provided_list
              : JSON.parse(res.services_provided_list);
          } catch {
            services = [];
          }
        }

        // Set base operator data
        this.operatorData = {
          ...res,
          activity_id: res.activity_id || null,
          business_name: res.business_name || res.rt_user?.business_name || 'No Business Name',
          image: res.image || 'assets/default-operator.jpg',
          operator_logo: null,
          address: res.address || 'No address provided',
          district: res.district || '',
          description: res.description || 'No description available',
          services_provided_list: services,
          price_per_pax: res.price_per_pax || 0,
        };

        // Fetch full user data for logo
        if (res.rt_user_id) {
          this.api.getAccommodationOperatorById(res.rt_user_id).subscribe(
            (userRes: any) => {
              if (userRes?.company_logo) {
                this.operatorData.operator_logo =
                  userRes.company_logo.startsWith('data:')
                    ? userRes.company_logo
                    : 'data:image/png;base64,' + userRes.company_logo;
              }
            },
            err => console.error('Error loading operator logo:', err)
          );
        }
      },
      err => console.error('Error loading operator details:', err)
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
      const pendingBooking = {
        activityId: this.operatorData.activity_id,
        operatorId: this.operatorId,
        price: this.operatorData.price_per_pax || 0,
        availableDates: this.operatorData.available_dates_list,
        activityName: this.operatorData.business_name,
        image: this.operatorData.image,
      };
      localStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));

      const alert = await this.alertController.create({
        header: 'Login Required',
        message: 'You need to log in before making a booking.',
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Login',
            handler: () => {
              this.navCtrl.navigateForward(['/tourist/login']);
            },
          },
        ],
      });
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

    // Map available dates into proper format
    const mappedDates = (this.operatorData.available_dates_list as AvailableDate[] || []).map(d => ({
      date: d.date,
      price: d.price ?? this.operatorData.price_per_pax ?? 0,
      time: d.time || '',
      startTime: d.startTime || '',
      endTime: d.endTime || '',
    }));

    // Navigate to booking page with all parameters
    this.navCtrl.navigateForward(['/tourist/activity-booking'], {
      state: {
        activityId: this.operatorData.activity_id,
        operatorId: this.operatorId,
        touristUserId: touristUserId,
        price: +this.operatorData.price_per_pax || 0,
        availableDates: mappedDates,
        activityName: this.operatorData.business_name,
        image: this.operatorData.image,
      },
    });
  }

  backHome() {
    this.navCtrl.back();
  }
}
