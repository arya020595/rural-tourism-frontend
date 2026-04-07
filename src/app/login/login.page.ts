import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NavController, ToastController } from '@ionic/angular';
import { ApiService } from '../services/api.service';

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
    private apiService: ApiService,
    private navCtrl: NavController,
    private toastController: ToastController,
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

    this.apiService.login(credentials).subscribe(
      async (res: any) => {
        if (res.success && res.user) {
          localStorage.setItem('user', JSON.stringify(res.user));
          localStorage.setItem('uid', String(res.user.id));
          await this.successToast('Login successful!');
          this.navCtrl.navigateRoot('/home');
          return;
        }

        await this.errorToast(res.message || 'Login failed');
      },
      async (err) => {
        await this.errorToast(err.error?.message || 'Login failed');
      },
    );
  }
}
