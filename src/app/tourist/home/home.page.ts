import { Component, OnInit } from '@angular/core';
import { MenuController, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  selectedSegment: string = 'activity'; 
  activities: any[] = [];
  accommodations: any[] = [];
  users: any[] = []; // List of all registered users
  user: any = null;  // For tracking logged-in user

  constructor(
    private apiService: ApiService,
    private menu: MenuController,
    private router: Router,
    private toastController: ToastController
    
  ) {}


  async logoutToast() {
    const toast = await this.toastController.create({
      message: "User Logged Out",
      duration: 1500,
      position: "bottom",
      cssClass: 'error-toast',
      icon: 'alert-circle'
    });
    await toast.present();
  }

  ngOnInit() {
    this.loadUser();
    this.loadActivities();
    this.loadAllUsers();
    this.loadAccommodations();
  }

  ionViewWillEnter() {
    this.loadUser();
    this.menu.enable(true, 'mainMenu'); // Enable the menu for this page
  }

loadUser() {
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      this.user = JSON.parse(userData);
      console.log('Loaded user:', this.user);

      if (this.user.tourist_user_id) {
        localStorage.setItem('tourist_user_id', this.user.tourist_user_id);
      }
    } catch (e) {
      console.error('Error parsing user data from localStorage', e);
      this.user = null;
    }
  } else {
    this.user = null;
  }
}

  logOut() {
    localStorage.removeItem('user');
    this.user = null;
    this.logoutToast();
    this.menu.close('mainMenu');
    this.router.navigate(['/tourist/home']); // Redirect to login/role selection page
  }

  selectSegment(segment: string) {
    this.selectedSegment = segment;
    this.menu.close('mainMenu'); // Close menu after selecting segment (optional)
  }

  goToOperatorList(id: string) {
    this.router.navigate(['/tourist/activity-operator-list', id]);
  }

  // getImageSource(image: string): string {
  //   // If the image is a base64 string without prefix, add it
  //   if (!image) return 'assets/default-image.png'; // fallback image
  //   return image.startsWith('data:image') ? image : `data:image/jpeg;base64,${image}`;
  // }

  // If your database stores only the filename, e.g., 'activity1.jpg'
getImageSource(imageName: string): string {
  if (!imageName) {
    return 'assets/icon/placeholder.png'; // fallback image
  }

  // Replace with your actual server path where images are hosted
  return `http://localhost:3000/uploads/activities/${imageName}`;
}


  get suggestedActivities() {
    return this.activities.filter(activity => {
      // Check both possible property names and common truthy values
      return [true, 1, '1'].includes(activity.show_in_suggestions)
          || [true, 1, '1'].includes(activity.showInSuggestions);
    });
  }

  closeMenu() {
  this.menu.close('mainMenu');
}

loadAllUsers() {
  this.apiService.getAllUser().subscribe({
    next: (res: any[]) => {
      this.users = res;
      console.log('All users loaded:', this.users);
    },
    error: (err) => console.error('Failed to load users', err)
  });
}


loadActivities() {
  this.apiService.getAllActivityMasterData().subscribe(data => {
  this.activities = data;
}, err => {
  console.error('Failed to load activities', err);
});

  // this.apiService.getAllActivity().subscribe(
  //   (data: any[]) => {
  //     this.activities = data;
  //     console.log('Loaded activities:', data);
  //   },
  //   (error: any) => {
  //     console.error('Failed to load activities:', error);
  //   }
  // );
}


 loadAccommodations() {
    this.apiService.getAllAccommodations().subscribe({
      next: (res: any[]) => {
        this.accommodations = res;
        console.log('Loaded accommodations:', res);
      },
      error: (err) => {
        console.error('Failed to load accommodations', err);
      }
    });
  }


getAccommodationImage(imageData: string): string {
  if (!imageData) {
    return 'assets/icon/placeholder.png'; // fallback image
  }

  // If already a full URL or Base64 string
  if (imageData.startsWith('http') || imageData.startsWith('data:image')) {
    return imageData;
  }

  // Otherwise, treat as filename stored in DB
  return `http://localhost:3000/uploads/accommodations/${imageData}`;
}

// Navigate to accommodation details
goToAccommodationDetails(accomId: string) {
  this.router.navigate(['/tourist/accommodation-detail', accomId]);
}




  // loadActivities() {
  //   this.apiService.getAllActivity().subscribe(
  //     (data: any[]) => {
  //       this.activities = data;
  //       console.log('Loaded activities:', data);
  //       data.forEach(act => console.log(act.activity_name, act.showInSuggestions));
  //     },
  //     (error: any) => {
  //       console.error('Failed to load activities:', error);
  //     }
  //   );
  // }
}
