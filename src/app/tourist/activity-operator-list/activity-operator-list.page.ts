import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { ActivityService } from 'src/app/services/activity.service';
import { FileUrlService } from 'src/app/services/file-url.service';
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
    private api: ActivityService,
    private fileUrlService: FileUrlService,
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
        if (!environment.production) {
          console.log('Operators API response:', res);
        }

        this.operators = res.map((op) => {
          // Support multiple possible slot arrays
          const slots = op.activity_slots || op.available_dates_list || [];

          // Extract prices safely
          const prices = slots.map((slot: any) =>
            Number(slot.price ?? slot.price_per_pax ?? 0),
          );

          const minPrice = prices.length > 0 ? Math.min(...prices) : null;
          const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

          return {
            ...op,
            business_name:
              op.business_name ||
              op.rt_user?.business_name ||
              'No Business Name',
            minPrice,
            maxPrice,
          };
        });
      },
      (err) => {
        if (!environment.production) {
          console.error('Error fetching operators:', err);
        }
      },
    );
  }

  getOperatorImage(imagePath: string): string {
    const resolved = this.fileUrlService.resolve(imagePath, {
      base64MimeType: 'image/jpeg',
      legacySubdir: 'operator-activities',
    });
    return resolved || 'assets/icon/placeholder.png';
  }

  goToOperatorDetail(operatorId: string) {
    this.navCtrl.navigateForward(
      `/tourist/activity-operator-detail/${operatorId}`,
    );
  }
}
