import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import {
  PermissionItem,
  PermissionSection,
  Role,
} from '../../models/role-management.model';
import { RoleManagementService } from '../../services/role-management.service';

@Component({
  selector: 'app-role-view-modal',
  templateUrl: './role-view-modal.component.html',
})
export class RoleViewModalComponent implements OnInit {
  @Input() roleId!: number;

  isLoading = true;
  role: Role | null = null;
  sections: PermissionSection[] = [];

  constructor(
    private modalCtrl: ModalController,
    private roleService: RoleManagementService
  ) {}

  ngOnInit(): void {
    this.roleService.getRoleById(this.roleId).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.role = res.data;
        this.buildSections();
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  private buildSections(): void {
    if (!this.role) return;
    const map = new Map<string, PermissionItem[]>();
    for (const p of this.role.permissions) {
      if (!map.has(p.section)) map.set(p.section, []);
      map.get(p.section)!.push(p);
    }
    this.sections = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, permissions]) => ({ name, permissions }));
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

  dismiss(): void {
    this.modalCtrl.dismiss();
  }
}
