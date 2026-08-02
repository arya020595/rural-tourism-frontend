import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import {
  PermissionItem,
  PermissionsBySection,
  Role,
  RoleListItem,
} from '../../models/role-management.model';
import { RoleManagementService } from '../../services/role-management.service';

@Component({
  selector: 'app-role-form-modal',
  templateUrl: './role-form-modal.component.html',
})
export class RoleFormModalComponent implements OnInit {
  /** Pass a role to enter edit mode; omit (null) for create mode */
  @Input() role: RoleListItem | null = null;

  isEditMode = false;
  isSaving = false;
  isLoadingPermissions = false;
  errorMessage = '';

  roleName = '';

  permissionsBySection: PermissionsBySection = {};
  sectionKeys: string[] = [];
  selectedPermissionIds = new Set<number>();

  constructor(
    private modalCtrl: ModalController,
    private roleService: RoleManagementService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.isEditMode = this.role != null;
    this.loadPermissions();
  }

  get title(): string {
    return this.isEditMode
      ? 'Kemaskini Peranan / Edit Role'
      : 'Tambah Peranan Baru / Add New Role';
  }

  private loadPermissions(): void {
    this.isLoadingPermissions = true;
    this.roleService.getPermissionsBySection().subscribe({
      next: (res) => {
        this.isLoadingPermissions = false;
        this.permissionsBySection = res.data ?? {};
        this.sectionKeys = Object.keys(this.permissionsBySection).sort();

        // If editing, pre-load role detail to get current permissions
        if (this.isEditMode && this.role) {
          this.roleName = this.role.name;
          this.prefillPermissions(this.role.id);
        }
      },
      error: () => {
        this.isLoadingPermissions = false;
        this.errorMessage =
          'Gagal memuatkan kebenaran / Failed to load permissions.';
      },
    });
  }

  private prefillPermissions(roleId: number): void {
    this.roleService.getRoleById(roleId).subscribe({
      next: (res) => {
        const role: Role = res.data;
        this.selectedPermissionIds = new Set(role.permissions.map((p) => p.id));
      },
      error: () => {
        this.errorMessage =
          'Gagal memuatkan peranan / Failed to load role details.';
      },
    });
  }

  getPermissionsForSection(section: string): PermissionItem[] {
    return this.permissionsBySection[section] ?? [];
  }

  isChecked(permissionId: number): boolean {
    return this.selectedPermissionIds.has(permissionId);
  }

  togglePermission(permissionId: number): void {
    if (this.selectedPermissionIds.has(permissionId)) {
      this.selectedPermissionIds.delete(permissionId);
    } else {
      this.selectedPermissionIds.add(permissionId);
    }
  }

  isSectionAllChecked(section: string): boolean {
    const perms = this.getPermissionsForSection(section);
    return (
      perms.length > 0 &&
      perms.every((p) => this.selectedPermissionIds.has(p.id))
    );
  }

  toggleSection(section: string): void {
    const perms = this.getPermissionsForSection(section);
    if (this.isSectionAllChecked(section)) {
      perms.forEach((p) => this.selectedPermissionIds.delete(p.id));
    } else {
      perms.forEach((p) => this.selectedPermissionIds.add(p.id));
    }
  }

  dismiss(): void {
    this.modalCtrl.dismiss(null);
  }

  submit(): void {
    const trimmedName = this.roleName.trim();
    if (!trimmedName) {
      this.errorMessage = 'Nama peranan diperlukan / Role name is required.';
      return;
    }

    this.errorMessage = '';
    this.isSaving = true;
    const permissionIds = Array.from(this.selectedPermissionIds);

    if (this.isEditMode && this.role) {
      this.roleService
        .updateRole(this.role.id, { name: trimmedName, permissionIds })
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.modalCtrl.dismiss({ saved: true });
          },
          error: (err) => {
            this.isSaving = false;
            this.errorMessage =
              err?.error?.message ||
              'Gagal mengemaskini peranan / Failed to update role.';
          },
        });
    } else {
      this.roleService
        .createRole({ name: trimmedName, permissionIds })
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.modalCtrl.dismiss({ saved: true });
          },
          error: (err) => {
            this.isSaving = false;
            this.errorMessage =
              err?.error?.message ||
              'Gagal menambah peranan / Failed to create role.';
          },
        });
    }
  }
}
