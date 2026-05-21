import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  MenuController,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { RoleListItem, RoleMeta } from '../models/role-management.model';
import { AuthService } from '../services/auth.service';
import { MenuItem, MenuService } from '../services/menu.service';
import { RoleManagementService } from '../services/role-management.service';
import { RoleDeleteModalComponent } from './components/role-delete-modal.component';
import { RoleFormModalComponent } from './components/role-form-modal.component';
import { RoleViewModalComponent } from './components/role-view-modal.component';

@Component({
  selector: 'app-role-management',
  templateUrl: './role-management.page.html',
  styleUrls: ['./role-management.page.scss'],
})
export class RoleManagementPage implements OnInit, OnDestroy {
  user: any = null;
  menuItems: MenuItem[] = [];
  roles: RoleListItem[] = [];
  meta: RoleMeta = {
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  };
  isLoading = false;
  searchTerm = '';

  readonly perPageOptions = [10, 25, 50];

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private roleService: RoleManagementService,
    private authService: AuthService,
    private menuService: MenuService,
    private menuCtrl: MenuController,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.meta.page = 1;
        this.searchTerm = term;
        this.loadRoles();
      });

    this.loadPageData();
  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, 'role-mgmt-menu');
    this.loadPageData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  private loadPageData(): void {
    this.user = this.authService.currentUser;
    this.menuItems =
      this.menuService.getVisibleMenuItemsForContext('operator_admin');

    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading = true;
    this.roleService
      .getRoles({
        page: this.meta.page,
        per_page: this.meta.per_page,
        search: this.searchTerm || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.roles = res.data ?? [];
          this.meta = res.meta ?? this.meta;
        },
        error: () => {
          this.isLoading = false;
          this.showToast(
            'Gagal memuatkan peranan / Failed to load roles.',
            'danger'
          );
        },
      });
  }

  // ── Search / pagination ───────────────────────────────────────────────────

  onSearch(event: any): void {
    this.searchSubject.next((event?.detail?.value ?? '').trim());
  }

  onPerPageChange(perPage: number | string): void {
    this.meta.per_page = Number(perPage);
    this.meta.page = 1;
    this.loadRoles();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.meta.total_pages) return;
    this.meta.page = page;
    this.loadRoles();
  }

  get pageButtons(): (number | '...')[] {
    const { page, total_pages: total } = this.meta;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: (number | '...')[] = [];
    const addPage = (p: number) => {
      if (!pages.includes(p)) pages.push(p);
    };
    const addEllipsis = () => {
      if (pages[pages.length - 1] !== '...') pages.push('...');
    };

    addPage(1);
    if (page > 3) addEllipsis();
    for (let p = Math.max(2, page - 1); p <= Math.min(total - 1, page + 1); p++)
      addPage(p);
    if (page < total - 2) addEllipsis();
    addPage(total);

    return pages;
  }

  get showingFrom(): number {
    return this.meta.total === 0
      ? 0
      : (this.meta.page - 1) * this.meta.per_page + 1;
  }

  get showingTo(): number {
    return Math.min(this.meta.page * this.meta.per_page, this.meta.total);
  }

  // ── Modal launchers ───────────────────────────────────────────────────────

  async openAddModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: RoleFormModalComponent,
      componentProps: { role: null },
      cssClass: 'role-form-modal',
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.saved) {
      await this.showToast(
        'Peranan berjaya ditambah / Role added successfully.',
        'success'
      );
      this.loadRoles();
    }
  }

  async openEditModal(role: RoleListItem): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: RoleFormModalComponent,
      componentProps: { role },
      cssClass: 'role-form-modal',
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.saved) {
      await this.showToast(
        'Peranan berjaya dikemaskini / Role updated successfully.',
        'success'
      );
      this.loadRoles();
    }
  }

  async openViewModal(role: RoleListItem): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: RoleViewModalComponent,
      componentProps: { roleId: role.id },
      cssClass: 'role-view-modal',
    });
    await modal.present();
  }

  async openDeleteModal(role: RoleListItem): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: RoleDeleteModalComponent,
      componentProps: { role },
      cssClass: 'role-delete-modal',
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.deleted) {
      await this.showToast(
        'Peranan berjaya dipadam / Role deleted successfully.',
        'success'
      );
      if (this.roles.length === 1 && this.meta.page > 1) {
        this.meta.page -= 1;
      }
      this.loadRoles();
    }
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

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

  logOut(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onMenuItemTap(item: MenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
