import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { RoleListItem } from '../../models/role-management.model';
import { RoleManagementService } from '../../services/role-management.service';

@Component({
  selector: 'app-role-delete-modal',
  templateUrl: './role-delete-modal.component.html',
})
export class RoleDeleteModalComponent {
  @Input() role!: RoleListItem;

  isDeleting = false;
  errorMessage = '';

  constructor(
    private modalCtrl: ModalController,
    private roleService: RoleManagementService
  ) {}

  dismiss(): void {
    this.modalCtrl.dismiss(null);
  }

  confirm(): void {
    this.isDeleting = true;
    this.errorMessage = '';
    this.roleService.deleteRole(this.role.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.modalCtrl.dismiss({ deleted: true });
      },
      error: (err) => {
        this.isDeleting = false;
        this.errorMessage =
          err?.error?.message ||
          'Gagal memadam peranan / Failed to delete role.';
      },
    });
  }
}
