import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-activity-operator-list',
  templateUrl: './activity-operator-list.page.html',
  styleUrls: ['./activity-operator-list.page.scss'],
})
export class ActivityOperatorListPage implements OnInit {

  activityId: string | null = null;
  operators: any[] = [];
  operatorsUpdated: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private api: ApiService
  ) {}

ngOnInit() {
  this.activityId = this.route.snapshot.paramMap.get('activityId') || '';
  console.log('Activity ID:', this.activityId);
  if (this.activityId) {
    this.loadOperators(this.activityId);
  }
}





  backHome() {
    this.navCtrl.navigateForward('/tourist/home', {
      animated: true,
      animationDirection: 'back'
    });
  }

getOperatorImage(image: string | null | undefined): string {
  if (!image) {
    return 'assets/default-operator.jpg';
  }

  // Already full URL or base64
  if (image.startsWith('http') || image.startsWith('data:image')) {
    return image;
  }

  // Assume filename from backend
  return `http://localhost:3000/uploads/operators/${image}`;
}


loadOperators(activityId: string) {
  this.api.getOperatorsByActivityId(activityId).subscribe(
    (res: any[]) => {
      console.log('Operators from API:', res);

      this.operators = res.map(op => ({
        ...op,
        // Use operator.business_name first, fallback to rt_user.business_name
        business_name: op.business_name || op.rt_user?.business_name || 'No Business Name'
      }));
    },
    (err) => console.error('Error fetching operators:', err)
  );
}

goToOperatorDetail(operatorId: string) {
  this.navCtrl.navigateForward(`/tourist/activity-operator-detail/${operatorId}`);
}





}
