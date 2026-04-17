import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-reset-passs',
  templateUrl: './reset-passs.page.html',
  styleUrls: ['./reset-passs.page.scss'],
})
export class ResetPasssPage implements OnInit {
  viewMode: 'request' | 'reset' = 'request';
  email = '';
  resetToken = '';
  newPassword = '';
  confirmPassword = '';
  isSendingResetLink = false;
  isResettingPassword = false;
  emailSentAlertOpen = false;
  emailSentHeader = 'Email Successfully Sent!';
  emailSentMessage = [
    'Pautan tetapan semula kata laluan telah dihantar. Sila semak peti masuk anda dan klik pautan dalam e-mel untuk menukar kata laluan anda.',
    'Jika e-mel tidak dijumpai, sila semak folder spam/junk anda.',
    '',
    'The password reset link has been sent. Please check your inbox and click the link in the email to change your password.',
    'If you cannot find the email, please check your spam/junk folder.',
  ].join('\n');
  emailSentButtons = [
    {
      text: 'Continue/Seterusnya',
      role: 'confirm',
      handler: () => {
        this.backToLogin();
      },
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private toastController: ToastController,
  ) {}

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.email = params['email'] ?? '';
        this.resetToken = params['token'] ?? '';

        if (params['step'] === 'reset' && !this.resetToken) {
          this.router.navigate(['/login'], { replaceUrl: true });
          return;
        }

        this.viewMode = this.resetToken ? 'reset' : 'request';
      });
  }

  async errorToast(message = 'Sila semak semula maklumat yang anda masukkan.') {
    const toast = await this.toastController.create({
      message,
      duration: 1500,
      position: 'middle',
      cssClass: 'error-toast',
      icon: 'alert-circle',
    });

    await toast.present();
  }

  async successToast() {
    const toast = await this.toastController.create({
      message: 'Berjaya ditetapkan!',
      duration: 1500,
      position: 'middle',
      cssClass: 'success-toast',
    });

    await toast.present();
  }

  sendResetLink(form: NgForm) {
    if (!form.valid || this.isSendingResetLink) {
      return;
    }

    this.isSendingResetLink = true;
    this.apiService.requestPasswordReset(this.email.trim().toLowerCase()).subscribe({
      next: () => {
        this.isSendingResetLink = false;
        this.emailSentAlertOpen = true;
      },
      error: () => {
        this.isSendingResetLink = false;
        this.errorToast('Gagal menghantar pautan reset. Sila cuba lagi.');
      },
    });
  }

  backToLogin() {
    this.emailSentAlertOpen = false;
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  submitNewPassword(form: NgForm) {
    if (
      !form.valid ||
      this.newPassword !== this.confirmPassword ||
      !this.resetToken ||
      this.isResettingPassword
    ) {
      this.errorToast(
        !this.resetToken
          ? 'Pautan reset tidak sah. Sila buka semula pautan daripada e-mel anda.'
          : 'Sila semak semula maklumat yang anda masukkan.',
      );
      return;
    }

    this.isResettingPassword = true;
    this.apiService.resetPasswordWithToken(this.resetToken, this.newPassword).subscribe({
      next: async () => {
        this.isResettingPassword = false;
        await this.successToast();
        this.router.navigate(['/login'], { replaceUrl: true });
      },
      error: () => {
        this.isResettingPassword = false;
        this.errorToast(
          'Pautan reset telah tamat tempoh atau tidak sah. Sila minta pautan baharu.',
        );
      },
    });
  }
}
