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

  // ✅ NEW: password visibility toggle
  showPassword = false;

  constructor(
    private apiService: ApiService,
    private navCtrl: NavController,
    private http: HttpClient,
    private router: Router,
    private alertCtrl: AlertController,
    private toastController: ToastController,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {}

  // ✅ Toggle password visibility
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

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
        // ⬇️ YOUR EXISTING LOGIC (UNCHANGED)
        if (res.user && res.user.is_active === false) {
          if (res.user.suspended_at) {
            const now = new Date();
            const suspendedAt = new Date(res.user.suspended_at);
            const diffDays = Math.floor(
              (now.getTime() - suspendedAt.getTime()) / (1000 * 60 * 60 * 24),
            );

            if (diffDays >= 3) {
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

        if (res.success) {
          localStorage.setItem('user', JSON.stringify(res.user));
          localStorage.setItem('tourist_user_id', res.user.tourist_user_id);

          await this.successToast('Login successful!');

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

          this.navCtrl.navigateRoot('/tourist/home');
        } else {
          await this.errorToast(res.message || 'Login failed');
        }
      },
      async (err) => {
        await this.errorToast(err.error?.message || 'Login failed');
      },
    );
  }

  forgotPassword() {
    this.navCtrl.navigateForward(['/reset-passs']);
  }

  backRole() {
    this.navCtrl.navigateBack('/role', {
      animated: true,
      animationDirection: 'back',
    });
  }
}
