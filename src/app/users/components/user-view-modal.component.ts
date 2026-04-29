import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-view-modal',
  templateUrl: './user-view-modal.component.html',
})
export class UserViewModalComponent {
  @Input() user!: User;

  constructor(private modalCtrl: ModalController) {}

  dismiss(): void {
    this.modalCtrl.dismiss();
  }

  formatUserId(id: number): string {
    return `ID_${String(id).padStart(3, '0')}`;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getRoleBadgeColor(roleName: string | undefined): string {
    const map: Record<string, string> = {
      superadmin: 'danger',
      operator_admin: 'primary',
      operator_staff: 'secondary',
      tourist: 'success',
      association: 'warning',
    };
    return map[roleName ?? ''] ?? 'medium';
  }
}
