import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-activity-detail',
  templateUrl: './activity-detail.page.html',
  styleUrls: ['./activity-detail.page.scss'],
})
export class ActivityDetailPage implements OnInit {
  activityId: string = '';
  activityData: any;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.activityId = this.route.snapshot.paramMap.get('id') || '';
    console.log('Loaded activityId:', this.activityId);  // Debug this
    this.loadActivity();
  }

  backHome(){
    this.navCtrl.navigateForward('/tourist/home', {
      animated: true,        // Enable animation
      animationDirection: 'back'  // Can be 'forward' or 'back' for custom direction
    });
  }


goToOperatorList() {
  this.router.navigate(['/tourist/activity-operator-list', this.activityId]);
}



  loadActivity() {
  this.api.getActivityById(this.activityId).subscribe(
    (data) => {
      // Ensure things_to_know is an array of {title, description}
      if (data.things_to_know) {
        if (typeof data.things_to_know === 'string') {
          try {
            data.things_to_know = JSON.parse(data.things_to_know);
          } catch (e) {
            console.warn('Failed to parse things_to_know', e);
            data.things_to_know = [];
          }
        }

        // Convert object to array if necessary
        if (!Array.isArray(data.things_to_know) && typeof data.things_to_know === 'object') {
          data.things_to_know = Object.entries(data.things_to_know).map(([key, value]) => ({
            title: key.replace(/_/g, ' '), // optional formatting
            description: value
          }));
        }
      } else {
        data.things_to_know = [];
      }

      this.activityData = data;
    },
    (error) => {
      console.error('Error fetching activity:', error);
    }
  );
}


//   loadActivity() {
//   this.api.getActivityById(this.activityId).subscribe(
//     (data) => {
//       // If things_to_know is a string, parse it
//       if (typeof data.things_to_know === 'string') {
//         try {
//           data.things_to_know = JSON.parse(data.things_to_know);
//         } catch (e) {
//           console.warn('Failed to parse things_to_know', e);
//           data.things_to_know = []; // fallback
//         }
//       }

//       this.activityData = data;
//     },
//     (error) => {
//       console.error('Error fetching activity:', error);
//     }
//   );
// }



  // loadActivity() {
  //   this.api.getActivityById(this.activityId).subscribe(
  //     (data) => {
  //       this.activityData = data;
  //     },
  //     (error) => {
  //       console.error('Error fetching activity:', error);
  //     }
  //   );
  // }
}
