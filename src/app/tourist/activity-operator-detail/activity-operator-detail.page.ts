import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
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
    private alertController: AlertController,
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

        // Parse services list safely
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

        // Calculate min/max price from available dates or activity slots
        const slots = res.activity_slots || res.available_dates_list || [];
        const prices = slots.map((slot: any) =>
          Number(slot.price ?? slot.price_per_pax ?? 0),
        );
        const minPrice = prices.length > 0 ? Math.min(...prices) : null;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

        // Set operator data
        this.operatorData = {
          ...res,
          activity_id: res.activity_id || null,
          business_name:
            res.business_name ||
            res.rt_user?.business_name ||
            'No Business Name',
          image: res.image || 'assets/default-operator.jpg',
          operator_logo: null,
          address: res.address || 'No address provided',
          district: res.district || '',
          description: res.description || 'No description available',
          services_provided_list: services,
          price_per_pax: res.price_per_pax || 0,
          minPrice,
          maxPrice,
          available_dates_list: res.available_dates_list || [],
        };

        // Fetch operator logo if exists
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
            (err) => console.error('Error loading operator logo:', err),
          );
        }
      },
      (err) => console.error('Error loading operator details:', err),
    );
  }

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
    console.log('Favorite status:', this.isFavorite);
  }

  async proceed() {
    const userData = localStorage.getItem('user');

    if (!userData) {
      const pendingBooking = {
        activityId: this.operatorData.activity_id,
        operatorId: this.operatorId,
        price: this.operatorData.minPrice || 0,
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

    const user = JSON.parse(userData);
    const touristUserId = user.tourist_user_id;

    if (!this.operatorData?.activity_id || !this.operatorId) {
      console.error('Missing activity_id or operator_id');
      return;
    }

    const mappedDates = (
      (this.operatorData.available_dates_list as AvailableDate[]) || []
    ).map((d) => ({
      date: d.date,
      price: d.price ?? this.operatorData.minPrice ?? 0,
      time: d.time || '',
      startTime: d.startTime || '',
      endTime: d.endTime || '',
    }));

    this.navCtrl.navigateForward(['/tourist/activity-booking'], {
      state: {
        activityId: this.operatorData.activity_id,
        operatorId: this.operatorId,
        touristUserId,
        price: this.operatorData.minPrice || 0,
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
