import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { NgForm } from '@angular/forms';
import { NavController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-reset-passs',
  templateUrl: './reset-passs.page.html',
  styleUrls: ['./reset-passs.page.scss'],
})
export class ResetPasssPage implements OnInit {

  resetUser = {
    username: '',
    answer:'',
    newPassword:''
  }

  confPass: string = ''

  constructor(
    private router: Router,
    private apiService: ApiService,
    private navCtrl: NavController,
    private toastController: ToastController
  ) { }

  questions: any;
  question: any;
  ngOnInit() {
   this.questions = ["q1", "q2"];
   this.question = this.questions[Math.floor(Math.random() * this.questions.length)];
  }

  toggleQuestion() {
    this.question = this.question === 'q1' ? 'q2' : 'q1';
  }

  //cancel button
  cancelButton = [
    {
      text: 'Tidak',
      role: 'cancel',
      handler: () => {
        console.log('Alert canceled');
      },
    },
    {
      text: 'Ya',
      role: 'confirm',
      handler: () => {
        this.navCtrl.navigateForward('/login', {
          animated: true,        // Enable animation
          animationDirection: 'back'  // Can be 'forward' or 'back' for custom direction
        });
      },
    },
  ];

  async errorToast(msg: any) {
    const toast = await this.toastController.create({
      message: "Nama Pengguna tidak ditemui/Jawapan Salah!",
      duration: 1500,
      position: "middle",
      cssClass: 'error-toast',
       icon: 'alert-circle'
    });

    await toast.present();
  }

  async successToast(msg: any) {
    const toast = await this.toastController.create({
      message: "Berjaya Ditetapkan!",
      duration: 1500,
      position: "middle",
      cssClass: 'success-toast',
    });

    await toast.present();
  }

  // Custom validator to check if password and confirm password match
  passwordMatchValidator(form: NgForm) {
    const password = form.controls['password'];
    const confirmPassword = form.controls['confPass'];
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      confirmPassword.setErrors(null);
    }
  }

  
  submitForm(form: NgForm){
    
    

    if(form.valid){
      this.apiService.resetPassword(this.resetUser.username, this.question, this.resetUser.answer, this.resetUser.newPassword).subscribe(
        (Response)=>{
          console.log("Password Reset Successfully: ", Response);
          this.successToast(Response.status)
          this.navCtrl.navigateBack('/login');
        },
        (error)=>{
          console.log("error: " , error);
          this.errorToast(error.status);
          
        }
      )
    }
  }



}
