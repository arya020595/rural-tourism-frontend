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
  private readonly maxFileSizeBytes = 1 * 1024 * 1024;
  private readonly maxTotalUploadSizeBytes = 10 * 1024 * 1024;

  currentSection = 1;
  isSuccessAlertOpen = false;
  showPassword = false;
  showConfirmPassword = false;

  associations: AssociationItem[] = [];

  formData: {
    business_name: string;
    associationId: string;
    business_address: string;
    poscode: string;
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
    poscode: '',
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

  get hasConfirmedPassword(): boolean {
    return this.formData.confirmed_password.trim().length > 0;
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

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      this.showError('This document only accepts PDF, JPG, or PNG files.');
      input.value = '';
      return;
    }

    if (file.size > this.maxFileSizeBytes) {
      this.showError('Each file must be 1MB or smaller.');
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
      this.formData.poscode,
      this.formData.location,
      this.formData.owner_full_name,
      this.formData.contact_no,
    ];

    const isValidPoscode = /^\d{5}$/.test(this.formData.poscode.trim());
    const hasValidFullTimeStaff = this.isValidStaffCount(
      this.formData.no_of_full_time_staff,
    );
    const hasValidPartTimeStaff = this.isValidStaffCount(
      this.formData.no_of_part_time_staff,
    );

    return (
      requiredTextFields.every(
        (value) =>
          value !== null &&
          value !== undefined &&
          value.toString().trim().length > 0,
      ) &&
      isValidPoscode &&
      hasValidFullTimeStaff &&
      hasValidPartTimeStaff
    );
  }

  isSection2Valid(): boolean {
    const normalizedUsername = this.normalizeInput(this.formData.username);
    const normalizedEmail = this.normalizeInput(this.formData.email_address);
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

    return (
      normalizedUsername.length > 0 &&
      validEmail &&
      this.formData.password.length >= 8 &&
      this.hasConfirmedPassword &&
      !this.passwordMismatch
    );
  }

  private normalizeInput(value: unknown): string {
    return `${value ?? ''}`.trim();
  }

  private isValidStaffCount(value: string | number): boolean {
    const normalized = `${value ?? ''}`.trim();

    if (normalized.length === 0) {
      return false;
    }

    return /^\d+$/.test(normalized);
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

  onContactNoInput(event: Event) {
    const ionEvent = event as CustomEvent<{ value?: string | null }>;
    const rawValue = (ionEvent.detail?.value || '').toString();
    this.formData.contact_no = rawValue.replace(/\D+/g, '');
  }

  onContactNoKeydown(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
      'Home',
      'End',
    ];

    const isShortcut =
      (event.ctrlKey || event.metaKey) &&
      ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase());

    if (allowedKeys.includes(event.key) || isShortcut) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onContactNoPaste(event: ClipboardEvent) {
    const pastedText = event.clipboardData?.getData('text') || '';

    if (/\D/.test(pastedText)) {
      event.preventDefault();
      const sanitized = pastedText.replace(/\D+/g, '');
      this.formData.contact_no = `${this.formData.contact_no}${sanitized}`;
    }
  }

  onPoscodeInput(event: Event) {
    const ionEvent = event as CustomEvent<{ value?: string | null }>;
    const rawValue = (ionEvent.detail?.value || '').toString();
    this.formData.poscode = rawValue.replace(/\D+/g, '').slice(0, 5);
  }

  onPoscodeKeydown(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
      'Home',
      'End',
    ];

    const isShortcut =
      (event.ctrlKey || event.metaKey) &&
      ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase());

    if (allowedKeys.includes(event.key) || isShortcut) {
      return;
    }

    if (!/^\d$/.test(event.key) || this.formData.poscode.length >= 5) {
      event.preventDefault();
    }
  }

  onPoscodePaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const sanitized = pastedText.replace(/\D+/g, '');

    const nextValue = `${this.formData.poscode}${sanitized}`.slice(0, 5);
    this.formData.poscode = nextValue;
  }

  submitRegistration(form: NgForm) {
    if (!form.valid || !this.isSection1Valid() || !this.isSection2Valid()) {
      this.showError('Please complete all required fields before submit.');
      return;
    }

    const totalUploadSize = Object.values(this.selectedFiles).reduce(
      (sum, file) => sum + (file?.size || 0),
      0,
    );

    if (totalUploadSize > this.maxTotalUploadSizeBytes) {
      this.showError(
        'Total upload size is too large. Please keep it under 10MB.',
      );
      return;
    }

    const payload = new FormData();
    payload.append('business_name', this.formData.business_name);
    payload.append('associationId', this.formData.associationId);
    payload.append('business_address', this.formData.business_address);
    payload.append('poscode', this.formData.poscode);
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
        if (error?.status === 413) {
          this.showError(
            'Upload too large. Please keep each file under 1MB and total uploads under 10MB.',
          );
          return;
        }

        this.showError(
          error?.error?.message || error?.error?.error || 'Registration failed.',
        );
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
