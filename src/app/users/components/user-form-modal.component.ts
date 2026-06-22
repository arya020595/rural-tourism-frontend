import { Component, Input, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import {
  RoleItem,
  User,
  UserCreatePayload,
  UserUpdatePayload,
} from '../../models/user.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-form-modal',
  templateUrl: './user-form-modal.component.html',
})
export class UserFormModalComponent implements OnInit {
  /** Pass a user to enter edit mode; omit (null) for create mode */
  @Input() user: User | null = null;
  /** Pass true when the logged-in user is superadmin to show the role selector */
  @Input() isSuperadmin = false;

  isEditMode = false;
  isSaving = false;
  errorMessage = '';

  showPassword = false;
  showConfirmPassword = false;

  roles: RoleItem[] = [];

  form = {
    name: '',
    username: '',
    email: '',
    password: '',
    confirmed_password: '',
    role_id: null as number | null,
  };

  constructor(
    private modalCtrl: ModalController,
    private userService: UserService,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit(): void {
    this.isEditMode = this.user != null;
    if (this.isEditMode && this.user) {
      this.form.name = this.user.name;
      this.form.username = this.user.username;
      this.form.email = this.user.email;
    }

    if (this.isSuperadmin && !this.isEditMode) {
      this.userService.getRoles().subscribe({
        next: (res) => {
          this.roles = res.data ?? [];
        },
        error: () => {
          this.roles = [];
        },
      });
    }
  }

  get title(): string {
    return this.isEditMode
      ? 'Kemaskini Pengguna/Edit User'
      : 'Tambah Pengguna Baru/Add New User';
  }

  dismiss(): void {
    this.modalCtrl.dismiss(null);
  }

  async submit(formRef: NgForm): Promise<void> {
    if (formRef.invalid) return;

    if (
      !this.isEditMode &&
      this.form.password !== this.form.confirmed_password
    ) {
      this.errorMessage = 'Password and confirm password do not match.';
      return;
    }

    if (
      this.isEditMode &&
      this.form.password &&
      this.form.password !== this.form.confirmed_password
    ) {
      this.errorMessage = 'Password and confirm password do not match.';
      return;
    }

    this.errorMessage = '';
    this.isSaving = true;

    if (this.isEditMode && this.user) {
      const payload: UserUpdatePayload = {
        name: this.form.name,
        username: this.form.username,
        email: this.form.email,
      };
      if (this.form.password) {
        payload.password = this.form.password;
        payload.confirmed_password = this.form.confirmed_password;
      }
      this.userService.updateUser(this.user.id, payload).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.modalCtrl.dismiss({ saved: true, user: res.data });
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage = err?.error?.message || 'Failed to update user.';
        },
      });
    } else {
      const payload: UserCreatePayload = {
        name: this.form.name,
        username: this.form.username,
        email: this.form.email,
        password: this.form.password,
        confirmed_password: this.form.confirmed_password,
        ...(this.isSuperadmin && this.form.role_id != null
          ? { role_id: this.form.role_id }
          : {}),
      };
      this.userService.createUser(payload).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.modalCtrl.dismiss({ saved: true, user: res.data });
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage = err?.error?.message || 'Failed to create user.';
        },
      });
    }
  }
}
