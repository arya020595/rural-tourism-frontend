import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  MenuController,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { User, UserMeta } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { MenuItem, MenuService } from '../services/menu.service';
import { UserService } from '../services/user.service';
import { UserDeleteModalComponent } from './components/user-delete-modal.component';
import { UserFormModalComponent } from './components/user-form-modal.component';
import { UserViewModalComponent } from './components/user-view-modal.component';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
})
export class UsersPage implements OnInit, OnDestroy {
  uid: string | null = null;
  user: any = null;
  menuItems: MenuItem[] = [];
  users: User[] = [];
  meta: UserMeta = {
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  };
  isLoading = false;

  searchTerm = '';
  readonly perPageOptions = [10, 25, 50, 100];

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private menuService: MenuService,
    private menuCtrl: MenuController,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.meta.page = 1;
        this.searchTerm = term;
        this.loadUsers();
      });

    this.loadUserData();

  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, 'users-menu');
    this.loadUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  private loadUserData(): void {
    this.uid = this.authService.getUserId();
    this.user = this.authService.currentUser;
    this.refreshMenuItems();

    if (!this.uid) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadUsers();
  }

  private refreshMenuItems(): void {
    this.menuItems =
      this.menuService.getVisibleMenuItemsForCurrentUser();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService
      .getUsers({
        page: this.meta.page,
        per_page: this.meta.per_page,
        search: this.searchTerm || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.users = res.data ?? [];
          this.meta = res.meta ?? this.meta;
        },
        error: () => {
          this.isLoading = false;
          this.showToast(
            'Gagal memuatkan pengguna / Failed to load users.',
            'danger',
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
    this.loadUsers();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.meta.total_pages) return;
    this.meta.page = page;
    this.loadUsers();
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
    const isSuperadmin = this.authService.isAdmin();

    const modal = await this.modalCtrl.create({
      component: UserFormModalComponent,
      componentProps: { user: null, isSuperadmin },
      cssClass: 'user-form-modal',
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.saved) {
      await this.showToast(
        'Pengguna berjaya ditambah / User added successfully.',
        'success',
      );
      this.loadUsers();
    }
  }

  async openEditModal(userRecord: User): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: UserFormModalComponent,
      componentProps: { user: userRecord },
      cssClass: 'user-form-modal',
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.saved) {
      await this.showToast(
        'Pengguna berjaya dikemaskini / User updated successfully.',
        'success',
      );
      this.loadUsers();
    }
  }

  async openViewModal(userRecord: User): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: UserViewModalComponent,
      componentProps: { user: userRecord },
      cssClass: 'user-view-modal',
    });
    await modal.present();
  }

  async openDeleteModal(userRecord: User): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: UserDeleteModalComponent,
      componentProps: { user: userRecord },
      cssClass: 'user-delete-modal',
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.deleted) {
      await this.showToast(
        'Pengguna berjaya dipadam / User deleted successfully.',
        'success',
      );
      if (this.users.length === 1 && this.meta.page > 1) this.meta.page--;
      this.loadUsers();
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  onMenuItemTap(item: MenuItem): void {
    this.closeMenu();
  }

  closeMenu(): void {
    this.menuCtrl.close();
  }

  logOut(): void {
    this.authService.logout('/login');
    this.uid = null;
    this.user = null;
    this.menuCtrl.enable(false, 'users-menu');
    this.menuCtrl.close();
  }

  // ── Display helpers ───────────────────────────────────────────────────────

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

  // ── Toast ─────────────────────────────────────────────────────────────────

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
