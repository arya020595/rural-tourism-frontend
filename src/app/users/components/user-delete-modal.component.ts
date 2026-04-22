import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-delete-modal',
  templateUrl: './user-delete-modal.component.html',
})
export class UserDeleteModalComponent {
  @Input() user!: User;

  isDeleting = false;
  errorMessage = '';

  constructor(
    private modalCtrl: ModalController,
    private userService: UserService,
  ) {}

  dismiss(): void {
    this.modalCtrl.dismiss(null);
  }

  confirm(): void {
    this.isDeleting = true;
    this.errorMessage = '';
    this.userService.deleteUser(this.user.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.modalCtrl.dismiss({ deleted: true });
      },
      error: (err) => {
        this.isDeleting = false;
        this.errorMessage = err?.error?.message || 'Failed to delete user.';
      },
    });
  }
}
