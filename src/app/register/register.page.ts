import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NavController, ToastController } from '@ionic/angular';
import { ApiService } from '../services/api.service';

interface AssociationItem {
  id: number;
  name: string;
  image: string;
}

type UploadField =
  | 'operator_logo_image'
  | 'motac_license_file'
  | 'trading_operation_license'
  | 'homestay_certificate';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  currentSection = 1;
  isSuccessAlertOpen = false;
  showPassword = false;
  showConfirmPassword = false;

  associations: AssociationItem[] = [];

  formData: {
    business_name: string;
    associationId: string;
    business_address: string;
    location: string;
    owner_full_name: string;
    contact_no: string;
    no_of_full_time_staff: string;
    no_of_part_time_staff: string;
    username: string;
    email_address: string;
    password: string;
    confirmed_password: string;
  } = {
    business_name: '',
    associationId: '',
    business_address: '',
    location: '',
    owner_full_name: '',
    contact_no: '',
    no_of_full_time_staff: '',
    no_of_part_time_staff: '',
    username: '',
    email_address: '',
    password: '',
    confirmed_password: '',
  };

  selectedFiles: Partial<Record<UploadField, File>> = {};
  selectedFileNames: Partial<Record<UploadField, string>> = {};

  successAlertButtons = [
    {
      text: 'Tutup',
      handler: () => {
        this.isSuccessAlertOpen = false;
        this.navCtrl.navigateRoot('/login');
      },
    },
  ];

  constructor(
    private apiService: ApiService,
    private navCtrl: NavController,
    private toastController: ToastController,
  ) {}

  ngOnInit() {
    this.loadAssociations();
  }

  get passwordMismatch(): boolean {
    return (
      !!this.formData.password &&
      !!this.formData.confirmed_password &&
      this.formData.password !== this.formData.confirmed_password
    );
  }

  loadAssociations() {
    this.apiService.getAssociationList().subscribe({
      next: (res) => {
        this.associations = res || [];
      },
      error: () => {
        this.showError('Failed to load association list.');
      },
    });
  }

  onFileSelected(event: Event, field: UploadField) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const isLogo = field === 'operator_logo_image';
    const acceptsImageOrPdf = !isLogo;
    const allowedTypes = acceptsImageOrPdf
      ? ['application/pdf', 'image/jpeg', 'image/png']
      : ['image/jpeg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      this.showError(
        isLogo
          ? 'Logo only accepts JPG or PNG files.'
          : 'This document only accepts PDF, JPG, or PNG files.',
      );
      input.value = '';
      return;
    }

    this.selectedFiles[field] = file;
    this.selectedFileNames[field] = file.name;
  }

  isSection1Valid(): boolean {
    const requiredTextFields = [
      this.formData.business_name,
      this.formData.associationId,
      this.formData.business_address,
      this.formData.location,
      this.formData.owner_full_name,
      this.formData.contact_no,
      this.formData.no_of_full_time_staff,
      this.formData.no_of_part_time_staff,
    ];

    const requiredFilesSelected =
      !!this.selectedFiles.operator_logo_image &&
      !!this.selectedFiles.motac_license_file;

    return (
      requiredTextFields.every(
        (value) => !!value && value.toString().trim().length > 0,
      ) && requiredFilesSelected
    );
  }

  isSection2Valid(): boolean {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      this.formData.email_address,
    );

    return (
      !!this.formData.username.trim() &&
      validEmail &&
      this.formData.password.length >= 8 &&
      !this.passwordMismatch
    );
  }

  goToSection2() {
    if (!this.isSection1Valid()) {
      this.showError('Please complete all required fields in section 1.');
      return;
    }
    this.currentSection = 2;
  }

  goBackToSection1() {
    this.currentSection = 1;
  }

  cancel() {
    this.navCtrl.navigateBack('/login');
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  submitRegistration(form: NgForm) {
    if (!form.valid || !this.isSection1Valid() || !this.isSection2Valid()) {
      this.showError('Please complete all required fields before submit.');
      return;
    }

    const payload = new FormData();
    payload.append('business_name', this.formData.business_name);
    payload.append('associationId', this.formData.associationId);
    payload.append('business_address', this.formData.business_address);
    payload.append('location', this.formData.location);
    payload.append('owner_full_name', this.formData.owner_full_name);
    payload.append('contact_no', this.formData.contact_no);
    payload.append(
      'no_of_full_time_staff',
      this.formData.no_of_full_time_staff,
    );
    payload.append(
      'no_of_part_time_staff',
      this.formData.no_of_part_time_staff,
    );
    payload.append('username', this.formData.username);
    payload.append('email_address', this.formData.email_address);
    payload.append('password', this.formData.password);
    payload.append('confirmed_password', this.formData.confirmed_password);

    if (this.selectedFiles.operator_logo_image) {
      payload.append(
        'operator_logo_image',
        this.selectedFiles.operator_logo_image,
      );
    }
    if (this.selectedFiles.motac_license_file) {
      payload.append(
        'motac_license_file',
        this.selectedFiles.motac_license_file,
      );
    }
    if (this.selectedFiles.trading_operation_license) {
      payload.append(
        'trading_operation_license',
        this.selectedFiles.trading_operation_license,
      );
    }
    if (this.selectedFiles.homestay_certificate) {
      payload.append(
        'homestay_certificate',
        this.selectedFiles.homestay_certificate,
      );
    }

    this.apiService.createUser(payload).subscribe({
      next: () => {
        this.isSuccessAlertOpen = true;
      },
      error: (error) => {
        this.showError(error?.error?.error || 'Registration failed.');
      },
    });
  }

  private async showError(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 1800,
      position: 'middle',
      cssClass: 'error-toast',
      icon: 'alert-circle',
    });
    await toast.present();
  }
}
