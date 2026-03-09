import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NavController, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-association-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  username = '';
  password = '';
  showPassword = false;

  constructor(
    private apiService: ApiService,
    private navCtrl: NavController,
    private toastController: ToastController,
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 1500,
      position: 'bottom',
      color,
    });
    await toast.present();
  }

  login(form: NgForm) {
    if (!form.valid) return;

    const credentials = {
      username: this.username,
      password: this.password,
    };

    this.apiService.loginAssociation(credentials).subscribe(
      async (res: any) => {
        if (res.success) {
          // Store user info
          localStorage.setItem('association_user', JSON.stringify(res.user));
          localStorage.setItem('association_user_id', res.user.id);

          await this.showToast('Login successful!', 'success');

          // ✅ Always navigate to dashboard
          this.navCtrl.navigateRoot('/association/dashboard');
        } else {
          await this.showToast(res.message || 'Login failed', 'danger');
        }
      },
      async () => {
        await this.showToast('Login failed', 'danger');
      },
    );
  }

  backRole() {
    this.navCtrl.navigateBack('/role');
  }
}
