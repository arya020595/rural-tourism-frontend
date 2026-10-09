import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import { AuthService, UserRoleName } from '../services/auth.service';
import { RememberedLoginService } from '../services/remembered-login.service';
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
  /** "Ingat saya / Remember me" — unticked unless a login is already saved. */
  rememberMe = false;
  /** The saved password that was filled in, to spot one that stopped working. */
  private savedPassword = '';

  constructor(
    private authService: AuthService,
    private syncService: SyncService,
    private navCtrl: NavController,
    private toastController: ToastController,
    private route: ActivatedRoute,
    private rememberedLogin: RememberedLoginService,
  ) {}

  ngOnInit() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      document.body.classList.add('standalone-app');
    } else {
      document.body.classList.remove('standalone-app');
    }
  }

  /** Fill in the remembered login each time the page is shown. */
  async ionViewWillEnter() {
    const saved = await this.rememberedLogin.load();
    if (!saved) {
      this.rememberMe = false;
      this.savedPassword = '';
      return;
    }
    this.rememberMe = true;
    this.username = saved.username;
    this.password = saved.password;
    this.savedPassword = saved.password;
  }

  /** Unticking forgets the saved login straight away. */
  async onRememberMeChange() {
    if (!this.rememberMe) {
      this.savedPassword = '';
      await this.rememberedLogin.clear();
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
          if (this.rememberMe) {
            await this.rememberedLogin.save(credentials.username, credentials.password);
          } else {
            await this.rememberedLogin.clear();
          }
          this.savedPassword = '';
          await this.handleSuccessfulLogin();
          return;
        }

        await this.errorToast(res.message || 'Login failed');
      },
      async (err) => {
        // A remembered password that no longer works (changed or reset):
        // forget it so the user isn't stuck retrying, keep the username.
        if (
          err?.status === 401 &&
          this.savedPassword &&
          credentials.password === this.savedPassword
        ) {
          this.savedPassword = '';
          this.password = '';
          await this.rememberedLogin.forgetPassword();
          await this.errorToast(
            'Kata laluan yang disimpan tidak lagi sah. Sila masukkan kata laluan anda. / The saved password no longer works. Please enter your password.',
          );
          return;
        }
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
