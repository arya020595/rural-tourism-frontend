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

  constructor(
    private apiService: ApiService,
    private navCtrl: NavController,
    private toastController: ToastController
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

  submitted = false;

  login(form: NgForm) {
    this.submitted = true;

    if (form.valid) {
      // console.log(this.password)
      const credentials = { username: this.username, password: this.password };

      this.apiService.login(credentials).subscribe(
        (response) => {
          console.log('Login successful:', response);
          localStorage.setItem('token', response.token);
          localStorage.setItem('uid', response.id);
          // Store user data in localStorage for fallback
          if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
          }
          this.successToast('Login successful!');
          this.navCtrl.navigateRoot('/home');
        },
        (error) => {
          console.error('Login failed:', error);
          this.errorToast(
            error.error?.message || 'Invalid Username or Password'
          );
        }
      );
    }
  }

  ngOnInit() {
    this.checkStandaloneMode();
  }

  checkStandaloneMode() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      // Add 'standalone-app' class to body for full-screen behavior
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
      animated: true, // Enable animation
      animationDirection: 'back', // Can be 'forward' or 'back' for custom direction
    });
  }
}
