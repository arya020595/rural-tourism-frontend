import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController,
  NavController,
  ToastController,
} from '@ionic/angular';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  username = '';
  password = '';
  submitted = false;

  constructor(
    private apiService: ApiService,
    private navCtrl: NavController,
    private http: HttpClient,
    private router: Router,
    private alertCtrl: AlertController,
    private toastController: ToastController,
    private route: ActivatedRoute, // For redirect query params
  ) {}

  ngOnInit() {}

  // ✅ Error Toast
  async errorToast(msg: string) {
    const toast = await this.toastController.create({
      message: msg || 'Invalid username or password',
      duration: 1500,
      position: 'bottom',
      cssClass: 'error-toast',
      icon: 'alert-circle',
    });
    await toast.present();
  }

  // ✅ Success Toast
  async successToast(msg: string) {
    const toast = await this.toastController.create({
      message: msg || 'Login successful!',
      duration: 2000,
      position: 'bottom',
      cssClass: 'success-toast',
      icon: 'checkmark-circle',
    });
    await toast.present();
  }

  login(form: NgForm) {
    this.submitted = true;
    if (!form.valid) return;

    const credentials = { username: this.username, password: this.password };

    this.apiService.loginTourist(credentials).subscribe(
      async (res: any) => {
        // ✅ Check if user is suspended/inactive
        if (res.user && res.user.is_active === false) {
          if (res.user.suspended_at) {
            const now = new Date();
            const suspendedAt = new Date(res.user.suspended_at);
            const diffDays = Math.floor(
              (now.getTime() - suspendedAt.getTime()) / (1000 * 60 * 60 * 24),
            );

            if (diffDays >= 3) {
              // Auto-reactivate after 3 days
              res.user.is_active = true;
              res.user.suspended_at = null;
              localStorage.setItem('user', JSON.stringify(res.user));
            } else {
              const daysLeft = 3 - diffDays;
              const alert = await this.alertCtrl.create({
                header: 'Account Suspended',
                message: `Your account is suspended. Please try again in ${daysLeft} day(s).`,
                buttons: [{ text: 'OK', role: 'cancel' }],
              });
              await alert.present();
              return;
            }
          } else {
            const alert = await this.alertCtrl.create({
              header: 'Account Suspended',
              message: 'Your account is suspended. Please contact support.',
              buttons: [{ text: 'OK', role: 'cancel' }],
            });
            await alert.present();
            return;
          }
        }

        // ✅ If login success
        if (res.success) {
          // Save user info
          localStorage.setItem('user', JSON.stringify(res.user));
          localStorage.setItem('tourist_user_id', res.user.tourist_user_id);

          await this.successToast('Login successful!');

          // Handle pending booking if exists
          const pendingBooking = localStorage.getItem('pendingBooking');
          if (pendingBooking) {
            const booking = JSON.parse(pendingBooking);
            localStorage.removeItem('pendingBooking');

            this.navCtrl.navigateForward(['/tourist/activity-booking'], {
              state: {
                activityId: booking.activityId,
                operatorId: booking.operatorId,
                touristUserId: res.user.tourist_user_id,
                price: booking.price,
                availableDates: booking.availableDates,
                activityName: booking.activityName,
                image: booking.image,
              },
            });
            return;
          }

          // Redirect query param handling
          const redirectUrl = this.route.snapshot.queryParamMap.get('redirect');
          if (redirectUrl) {
            const activity_id =
              this.route.snapshot.queryParamMap.get('activity_id');
            const operator_id =
              this.route.snapshot.queryParamMap.get('operator_id');
            const price = this.route.snapshot.queryParamMap.get('price');
            const availableDates =
              this.route.snapshot.queryParamMap.get('availableDates');

            this.navCtrl.navigateForward([redirectUrl], {
              state: {
                tourist_user_id: res.user.tourist_user_id,
                activity_id,
                operator_id,
                price,
                available_dates_list: availableDates
                  ? JSON.parse(availableDates)
                  : [],
              },
            });
            return;
          }

          // Default landing page
          this.navCtrl.navigateRoot('/tourist/home');
        } else {
          await this.errorToast(res.message || 'Login failed');
        }
      },
      async (err) => {
        // Only show general login failed toast, do not show backend inactive message
        await this.errorToast(err.error?.message || 'Login failed');
      },
    );
  }

  // ✅ Navigate back to role selection page
  backRole() {
    this.navCtrl.navigateBack('/role', {
      animated: true,
      animationDirection: 'back',
    });
  }
}
