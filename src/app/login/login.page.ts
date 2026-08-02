import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import { AuthService, UserRoleName } from '../services/auth.service';
import { SyncService } from '../services/sync.service';

interface PendingActivityBooking {
  activityId: string;
  operatorId: string;
  price: number;
  availableDates: any[];
  activityName: string;
  image: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  username = '';
  password = '';
  submitted = false;
  showPassword = false;

  constructor(
    private authService: AuthService,
    private syncService: SyncService,
    private navCtrl: NavController,
    private toastController: ToastController,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      document.body.classList.add('standalone-app');
    } else {
      document.body.classList.remove('standalone-app');
    }
  }

  register() {
    this.navCtrl.navigateForward(['/register']);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async successToast(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 1500,
      position: 'bottom',
      color: 'success',
    });
    await toast.present();
  }

  async errorToast(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 1500,
      position: 'bottom',
      color: 'danger',
    });
    await toast.present();
  }

  login(form: NgForm) {
    this.submitted = true;
    if (!form.valid) return;

    const credentials = { username: this.username, password: this.password };
    this.authService.login(credentials).subscribe(
      async (res: any) => {
        if (res.success && res.data?.user) {
          await this.handleSuccessfulLogin();
          return;
        }

        await this.errorToast(res.message || 'Login failed');
      },
      async (err) => {
        await this.errorToast(err.error?.message || 'Login failed');
      },
    );
  }

  private async handleSuccessfulLogin(): Promise<void> {
    const redirectUrl = this.route.snapshot.queryParamMap.get('redirect');
    const role: UserRoleName | null = this.authService.getCurrentRole();

    if (role === 'tourist') {
      const touristUserId = this.authService.getTouristUserId();

      if (!touristUserId) {
        await this.errorToast('Login failed');
        return;
      }

      await this.successToast('Login successful!');
      this.redirectTouristAfterLogin(touristUserId);
      return;
    }

    await this.successToast('Login successful!');

    // Pre-warm all caches immediately after login so offline mode works right away
    void this.syncService.prewarmCaches();

    if (role === 'superadmin') {
      this.navCtrl.navigateRoot(redirectUrl || '/admin/dashboard');
      return;
    }

    if (role === 'association') {
      this.navCtrl.navigateRoot(redirectUrl || '/association/dashboard');
      return;
    }

    if (role === 'operator_admin') {
      this.navCtrl.navigateRoot('/home');
      return;
    }

    if (role === 'operator_staff') {
      this.navCtrl.navigateRoot('/booking-home');
      return;
    }

    this.navCtrl.navigateRoot(redirectUrl || '/home');
  }

  private redirectTouristAfterLogin(touristUserId: string): void {
    const pendingBooking = this.safeParseJson<PendingActivityBooking>(
      localStorage.getItem('pendingBooking'),
    );

    if (pendingBooking) {
      localStorage.removeItem('pendingBooking');

      this.navCtrl.navigateForward(['/tourist/activity-booking'], {
        state: {
          activityId: pendingBooking.activityId,
          operatorId: pendingBooking.operatorId,
          touristUserId,
          price: pendingBooking.price,
          availableDates: pendingBooking.availableDates,
          activityName: pendingBooking.activityName,
          image: pendingBooking.image,
        },
      });
      return;
    }

    const redirectUrl = this.route.snapshot.queryParamMap.get('redirect');

    if (redirectUrl) {
      const activity_id = this.route.snapshot.queryParamMap.get('activity_id');
      const accommodation_id =
        this.route.snapshot.queryParamMap.get('accommodation_id');
      const operator_id = this.route.snapshot.queryParamMap.get('operator_id');
      const price = this.route.snapshot.queryParamMap.get('price');
      const no_of_pax = this.route.snapshot.queryParamMap.get('no_of_pax');
      const no_of_rooms = this.route.snapshot.queryParamMap.get('no_of_rooms');
      const availableDates = this.safeParseJson<any[]>(
        this.route.snapshot.queryParamMap.get('availableDates'),
      );

      this.navCtrl.navigateForward([redirectUrl], {
        state: {
          tourist_user_id: touristUserId,
          activity_id,
          accommodation_id,
          operator_id,
          price,
          no_of_pax,
          no_of_rooms,
          available_dates_list: availableDates || [],
        },
      });
      return;
    }

    this.navCtrl.navigateRoot('/tourist/home');
  }

  private safeParseJson<T>(value: string | null): T | null {
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  forgotPassword() {
    this.navCtrl.navigateForward(['/reset-passs']);
  }
}
