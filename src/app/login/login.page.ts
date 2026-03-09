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
  username: string = '';
  password: string = '';
  submitted = false;
  showPassword: boolean = false;

  constructor(
    private apiService: ApiService,
    private navCtrl: NavController,
    private toastController: ToastController,
  ) {}

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

  async errorToast(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 1500,
      position: 'bottom',
      cssClass: 'error-toast',
      icon: 'alert-circle',
    });
    await toast.present();
  }

  login(form: NgForm) {
    this.submitted = true;

    if (form.valid) {
      const credentials = { username: this.username, password: this.password };

      this.apiService.login(credentials).subscribe(
        (response) => {
          console.log('Login successful:', response);

          const operatorId =
            response.user_id ||
            response.id ||
            response.user?.user_id ||
            response.user?.id;

          if (!operatorId) {
            console.error('No operator_id found in response:', response);
            this.errorToast('Login failed: Invalid response from server');
            return;
          }

          // ✅ Store operator_id for notifications page
          localStorage.setItem('operator_id', operatorId.toString());
          localStorage.setItem('uid', operatorId.toString()); // optional
          localStorage.setItem('token', response.token);

          const userData = response.user || response;
          localStorage.setItem('user', JSON.stringify(userData));

          this.successToast('Login successful!');
          this.navCtrl.navigateRoot('/home');
        },
        (error) => {
          console.error('Login failed:', error);
          this.errorToast(
            error.error?.message || 'Invalid Username or Password',
          );
        },
      );
    }
  }

  ngOnInit() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      document.body.classList.add('standalone-app');
    } else {
      document.body.classList.remove('standalone-app');
    }
  }

  forgotPassword() {
    this.navCtrl.navigateForward(['/reset-passs']);
  }

  register() {
    this.navCtrl.navigateForward(['/register']);
  }

  backRole() {
    this.navCtrl.navigateForward('/role', {
      animated: true,
      animationDirection: 'back',
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
