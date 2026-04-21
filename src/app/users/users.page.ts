import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { MenuItem, MenuService } from '../services/menu.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
})
export class UsersPage implements OnInit {
  user: any = null;
  menuItems: MenuItem[] = [];
  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;

  constructor(
    private apiService: ApiService,
    private menuCtrl: MenuController,
    private router: Router,
    private menuService: MenuService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUser;
    this.menuItems = this.menuService.getVisibleMenuItemsForContext('operator');
    this.loadUsers();
  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, 'users-menu');
    this.user = this.authService.currentUser;
    this.menuItems = this.menuService.getVisibleMenuItemsForContext('operator');
  }

  loadUsers(): void {
    this.isLoading = true;
    this.apiService.getAllUser().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const data = res?.data ?? res;
        this.users = Array.isArray(data) ? data : [];
        this.filteredUsers = [...this.users];
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Failed to load users:', err);
      },
    });
  }

  onSearch(event: any): void {
    const term = (event?.detail?.value ?? '').toLowerCase().trim();
    this.searchTerm = term;
    if (!term) {
      this.filteredUsers = [...this.users];
      return;
    }
    this.filteredUsers = this.users.filter(
      (u) =>
        u.name?.toLowerCase().includes(term) ||
        u.username?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term),
    );
  }

  onMenuItemTap(item: MenuItem): void {
    this.menuCtrl.close('users-menu');
  }

  logOut(): void {
    this.authService.logout('/login');
  }

  getRoleBadgeColor(role: string): string {
    const colors: Record<string, string> = {
      superadmin: 'danger',
      operator_admin: 'primary',
      operator_staff: 'secondary',
      tourist: 'success',
      association: 'warning',
    };
    return colors[role] ?? 'medium';
  }

  getDisplayName(user: any): string {
    return user?.name || user?.username || '—';
  }
}
