import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-activity-and-accommodation-management',
  templateUrl: './activity-and-accommodation-management.page.html',
  styleUrls: ['./activity-and-accommodation-management.page.scss'],
})
export class ActivityAndAccommodationManagementPage implements OnInit {
  segment = 'activities';
  activities: any[] = [];
  accommodations: any[] = [];
  userId = localStorage.getItem('uid') || '';

  constructor(
    private apiService: ApiService,
    private navCtrl: NavController,
  ) {}

  ngOnInit() {
    this.loadActivities();
    this.loadAccommodations();
  }

  loadActivities() {
    this.apiService.getAllActByUser(this.userId).subscribe(
      (res: any) => {
        this.activities = res.data || res || [];
      },
      () => {
        this.activities = [];
      },
    );
  }

  loadAccommodations() {
    this.apiService.getAllAccomByUser(this.userId).subscribe(
      (res: any) => {
        this.accommodations = res.data || res || [];
      },
      () => {
        this.accommodations = [];
      },
    );
  }

  segmentChanged(event: any) {
    this.segment = event.detail.value;
  }

  goBack() {
    this.navCtrl.back();
  }
}
