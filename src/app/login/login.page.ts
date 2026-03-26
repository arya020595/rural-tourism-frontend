import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
// import { NgForm } from '@angular/forms';
// import { ToastController } from '@ionic/angular';
// import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  // Legacy login fields kept commented for quick restore.
  // username: string = '';
  // password: string = '';
  // submitted = false;
  // showPassword: boolean = false;

  constructor(private navCtrl: NavController) {}

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

  /*
  Legacy login actions kept for post-meeting re-enable:

  async successToast(msg: string) { ... }

  async errorToast(msg: string) { ... }

  login(form: NgForm) {
    // original API login flow here
  }

  forgotPassword() {
    this.navCtrl.navigateForward(['/reset-passs']);
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
  */
}
