import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-activity-operator-list',
  templateUrl: './activity-operator-list.page.html',
  styleUrls: ['./activity-operator-list.page.scss'],
})
export class ActivityOperatorListPage implements OnInit {
  activityId: string | null = null;
  operators: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.activityId = this.route.snapshot.paramMap.get('activityId') || '';
    if (this.activityId) {
      this.loadOperators(this.activityId);
    }
  }

  backHome() {
    this.navCtrl.navigateForward('/tourist/home', {
      animated: true,
      animationDirection: 'back',
    });
  }

  loadOperators(activityId: string) {
    this.api.getOperatorsByActivityId(activityId).subscribe(
      (res: any[]) => {
        console.log('Operators API response:', res); // DEBUG

        this.operators = res.map((op) => {
          // Support multiple possible slot arrays
          const slots = op.activity_slots || op.available_dates_list || [];

          // Extract prices safely
          const prices = slots.map((slot: any) =>
            Number(slot.price ?? slot.price_per_pax ?? 0)
          );

          const minPrice = prices.length > 0 ? Math.min(...prices) : null;
          const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

          return {
            ...op,
            business_name: op.business_name || op.rt_user?.business_name || 'No Business Name',
            minPrice,
            maxPrice,
          };
        });
      },
      (err) => {
        if (!environment.production) {
          console.error('Error fetching operators:', err);
        }
      }
    );
  }

  getOperatorImage(imagePath: string): string {
    if (!imagePath) {
      return 'assets/icon/placeholder.png';
    }

    if (
      imagePath.startsWith('assets/') ||
      imagePath.startsWith('http') ||
      imagePath.startsWith('data:image')
    ) {
      return imagePath;
    }

    return `${environment.API}/uploads/operator-activities/${imagePath}`;
  }

  goToOperatorDetail(operatorId: string) {
    this.navCtrl.navigateForward(`/tourist/activity-operator-detail/${operatorId}`);
  }
}
