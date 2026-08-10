import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  MenuController,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { User, UserMeta } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { MenuItem, MenuService } from '../services/menu.service';
import { UserService } from '../services/user.service';
import { UserDeleteModalComponent } from '../users/components/user-delete-modal.component';
import { UserViewModalComponent } from '../users/components/user-view-modal.component';

@Component({
  selector: 'app-deletion-requests',
  templateUrl: './deletion-requests.page.html',
  styleUrls: ['./deletion-requests.page.scss'],
})
export class DeletionRequestsPage implements OnInit, OnDestroy {
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
  actioningUserId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private menuService: MenuService,
    private menuCtrl: MenuController,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, 'deletion-requests-menu');
    this.loadUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserData(): void {
    this.uid = this.authService.getUserId();
    this.user = this.authService.currentUser;
    this.refreshMenuItems();

    if (!this.uid) {
      this.router.navigate(['/login']);
      return;
    }

    // Reviewing self-service deletion requests is a superadmin-only
    // responsibility — operator_admin holds user:delete too (for managing
    // their own staff via the Users page), so the shared permission guard
    // alone can't exclude them from this route. Enforce the role check here,
    // mirroring the backend's isAdmin() (superadmin role or *:* wildcard).
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/unauthorized']);
      return;
    }

    this.loadRequests();
  }

  private refreshMenuItems(): void {
    this.menuItems = this.menuService.getVisibleMenuItemsForCurrentUser();
  }

  loadRequests(): void {
    this.isLoading = true;
    this.userService
      .getUsers({
        page: this.meta.page,
        per_page: this.meta.per_page,
        pending_deletion: true,
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
            'Gagal memuatkan permintaan / Failed to load requests.',
            'danger',
          );
        },
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.meta.total_pages) return;
    this.meta.page = page;
    this.loadRequests();
  }

  get showingFrom(): number {
    return this.meta.total === 0
      ? 0
      : (this.meta.page - 1) * this.meta.per_page + 1;
  }

  get showingTo(): number {
    return Math.min(this.meta.page * this.meta.per_page, this.meta.total);
  }

  async openViewModal(userRecord: User): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: UserViewModalComponent,
      componentProps: { user: userRecord },
      cssClass: 'user-view-modal',
    });
    await modal.present();
  }

  // Approve = permanently delete the account (reuses the existing delete flow)
  async openApproveModal(userRecord: User): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: UserDeleteModalComponent,
      componentProps: { user: userRecord },
      cssClass: 'user-delete-modal',
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.deleted) {
      await this.showToast(
        'Akaun berjaya dipadam / Account deleted successfully.',
        'success',
      );
      if (this.users.length === 1 && this.meta.page > 1) this.meta.page--;
      this.loadRequests();
    }
  }

  async rejectRequest(userRecord: User): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Reject Deletion Request',
      message: `Reject the deletion request from "${userRecord.name}"? Their account will remain active.`,
      buttons: [
        {
          text: 'Yes, Reject',
          handler: () => this.confirmReject(userRecord.id),
        },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await alert.present();
  }

  private confirmReject(userId: number): void {
    this.actioningUserId = userId;
    this.userService
      .rejectDeletion(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.actioningUserId = null;
          this.showToast('Deletion request rejected.', 'success');
          this.loadRequests();
        },
        error: (error: any) => {
          this.actioningUserId = null;
          this.showToast(
            error?.error?.message || 'Failed to reject deletion request.',
            'danger',
          );
        },
      });
  }

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
    this.menuCtrl.enable(false, 'deletion-requests-menu');
    this.menuCtrl.close();
  }

  formatUserId(id: number): string {
    return `ID_${String(id).padStart(3, '0')}`;
  }

  formatDate(dateStr: string | null | undefined): string {
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
