import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, MenuController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { ProductService } from '../services/product.service';
import { AuthService } from '../services/auth.service';
import { MenuItem, MenuService } from '../services/menu.service';

interface MasterDataRow {
  id: number;
  code: string;
  name: string;
  product_type: 'activity' | 'accommodation';
  created_at: string;
  updated_at: string;
}

interface MasterDataDraft {
  name: string;
  product_type: 'activity' | 'accommodation';
}

interface PendingMasterData extends MasterDataDraft {
  tempId: number;
}

@Component({
  selector: 'app-master-data',
  templateUrl: './master-data.page.html',
  styleUrls: ['./master-data.page.scss'],
})
export class MasterDataPage implements OnInit {
  user: any = null;
  pageErrorMessage = '';
  formErrorMessage = '';
  isLoading = false;
  isModalOpen = false;
  modalMode: 'create' | 'edit' | 'detail' = 'create';
  editingId: number | null = null;
  detailItem: MasterDataRow | null = null;
  draft: MasterDataDraft = this.createEmptyDraft();
  pendingItems: PendingMasterData[] = [];
  private tempIdSeed = 1;

  // Side menu items populated via MenuService for centralized permission-based filtering.
  menuItems: MenuItem[] = [];

  currentPage = 1;
  pageSize = 7;
  totalItems = 0;
  totalPages = 1;

  data: MasterDataRow[] = [];
  pagedData: MasterDataRow[] = [];
  visiblePages: (number | string)[] = [];

  constructor(
    private menuCtrl: MenuController,
    private authService: AuthService,
    private productService: ProductService,
    private alertCtrl: AlertController,
    private menuService: MenuService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUser;
    this.refreshMenuItems();
  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, 'master-data-menu');
    this.user = this.authService.currentUser;
    this.refreshMenuItems();
    this.loadMasterData(this.currentPage);
  }

  private refreshMenuItems(): void {
    this.menuItems =
      this.menuService.getVisibleMenuItemsForContext('operator_admin');
  }

  private createEmptyDraft(): MasterDataDraft {
    return {
      name: '',
      product_type: 'activity',
    };
  }

  private normalizeProductType(value: unknown): 'activity' | 'accommodation' {
    const normalized = String(value || '')
      .trim()
      .toLowerCase();
    return normalized === 'accommodation' ? 'accommodation' : 'activity';
  }

  private mapRow(record: any, fallbackIndex: number): MasterDataRow {
    const id = Number(record?.id ?? fallbackIndex + 1);
    return {
      id,
      code: `MD_${String(id).padStart(3, '0')}`,
      name: String(record?.name || ''),
      product_type: this.normalizeProductType(record?.product_type),
      created_at: record?.created_at || '',
      updated_at: record?.updated_at || '',
    };
  }

  private setPagination(
    page: number,
    totalItems: number,
    totalPages: number,
  ): void {
    this.currentPage = page;
    this.totalItems = totalItems;
    this.totalPages = Math.max(1, totalPages);
    this.visiblePages = this.getVisiblePages();
  }

  private clampPage(page: number): number {
    return Math.min(Math.max(1, page), this.totalPages);
  }

  private getVisiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;
    const windowSize = 3; // Show 3 pages before and after current
    const edgeSize = 3; // Show 3 pages at start and end

    if (totalPages <= 8) {
      // Show all pages if 8 or fewer
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first few pages
    for (let i = 1; i <= Math.min(edgeSize, totalPages); i++) {
      pages.push(i);
    }

    // Calculate the range around current page
    const rangeStart = Math.max(edgeSize + 1, currentPage - windowSize);
    const rangeEnd = Math.min(totalPages - edgeSize, currentPage + windowSize);

    // Add ellipsis if there's a gap
    if (rangeStart > edgeSize + 1) {
      pages.push('...');
    }

    // Add pages around current page
    for (let i = rangeStart; i <= rangeEnd; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    // Add ellipsis if there's a gap before the last pages
    if (rangeEnd < totalPages - edgeSize) {
      pages.push('...');
    }

    // Always show last few pages
    for (
      let i = Math.max(rangeEnd + 1, totalPages - edgeSize + 1);
      i <= totalPages;
      i++
    ) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    return pages;
  }

  private extractRows(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    return [];
  }

  loadMasterData(page = this.currentPage): void {
    this.isLoading = true;
    this.pageErrorMessage = '';

    this.productService
      .getAllProducts({ page, per_page: this.pageSize })
      .subscribe({
        next: (response) => {
          const rows = this.extractRows(response).map((record, index) =>
            this.mapRow(record, index),
          );
          const pagination = response?.meta;
          const totalItems = pagination?.total ?? rows.length;
          const totalPages = Math.max(
            1,
            Math.ceil(totalItems / this.pageSize),
          );
          const requestedPage = pagination?.page ?? page;
          const resolvedPage = Math.min(
            Math.max(1, requestedPage),
            totalPages,
          );

          if (resolvedPage > totalPages && totalPages > 0) {
            this.isLoading = false;
            this.loadMasterData(totalPages);
            return;
          }

          this.data = rows;
          this.pagedData = rows;
          this.setPagination(resolvedPage, totalItems, totalPages);
          this.isLoading = false;
        },
        error: (error) => {
          this.data = [];
          this.pagedData = [];
          this.setPagination(1, 0, 1);
          this.pageErrorMessage =
            error?.error?.message || 'Unable to load master data records.';
          this.isLoading = false;
        },
      });
  }

  get startItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    if (this.totalItems === 0) return 0;
    return Math.min(
      this.startItem + this.pagedData.length - 1,
      this.totalItems,
    );
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadMasterData(1);
  }

  goToPage(page: number): void {
    this.loadMasterData(this.clampPage(page));
  }

  onPageClick(page: number | string): void {
    if (typeof page === 'number') {
      this.goToPage(page);
    }
  }

  trackByPage(_index: number, page: number | string): number | string {
    return page;
  }

  prevPage(): void {
    this.loadMasterData(this.clampPage(this.currentPage - 1));
  }

  nextPage(): void {
    this.loadMasterData(this.clampPage(this.currentPage + 1));
  }

  openAddModal(): void {
    this.modalMode = 'create';
    this.editingId = null;
    this.detailItem = null;
    this.pendingItems = [];
    this.draft = this.createEmptyDraft();
    this.formErrorMessage = '';
    this.isModalOpen = true;
  }

  openEditModal(item: MasterDataRow): void {
    this.modalMode = 'edit';
    this.editingId = item.id;
    this.detailItem = null;
    this.pendingItems = [];
    this.draft = {
      name: item.name,
      product_type: item.product_type,
    };
    this.formErrorMessage = '';
    this.isModalOpen = true;
  }

  async openDeleteModal(item: MasterDataRow): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Delete Master Data',
      message: 'Are you sure you want to delete this master data item?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            void this.deleteMasterData(item.id);
          },
        },
      ],
    });

    await alert.present();
  }

  async viewDetail(item: MasterDataRow): Promise<void> {
    this.modalMode = 'detail';
    this.detailItem = item;
    this.editingId = null;
    this.pendingItems = [];
    this.formErrorMessage = '';
    this.isModalOpen = true;
  }

  addPendingItem(): void {
    const name = this.draft.name.trim();

    if (!name) {
      this.formErrorMessage = 'Product name is required.';
      return;
    }

    this.formErrorMessage = '';
    this.pendingItems.push({
      tempId: this.tempIdSeed++,
      name,
      product_type: this.draft.product_type,
    });
    this.draft.name = '';
  }

  removePendingItem(tempId: number): void {
    this.pendingItems = this.pendingItems.filter(
      (item) => item.tempId !== tempId,
    );
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.formErrorMessage = '';
    this.editingId = null;
    this.detailItem = null;
    this.draft = this.createEmptyDraft();
    this.pendingItems = [];
  }

  async saveMasterData(): Promise<void> {
    if (this.modalMode === 'create' && this.pendingItems.length === 0) {
      this.formErrorMessage =
        'Add at least one master data item before saving.';
      return;
    }

    if (this.modalMode === 'edit') {
      if (!this.editingId) {
        this.formErrorMessage = 'Missing record to update.';
        return;
      }

      const name = this.draft.name.trim();
      if (!name) {
        this.formErrorMessage = 'Product name is required.';
        return;
      }

      this.isLoading = true;
      try {
        await firstValueFrom(
          this.productService.updateProduct(this.editingId, {
            name,
            product_type: this.draft.product_type,
          }),
        );
        this.closeModal();
        this.loadMasterData(this.currentPage);
      } catch (error: any) {
        this.formErrorMessage =
          error?.error?.message || 'Unable to update master data.';
      } finally {
        this.isLoading = false;
      }

      return;
    }

    this.isLoading = true;
    try {
      for (const item of this.pendingItems) {
        await firstValueFrom(
          this.productService.createProduct({
            name: item.name,
            product_type: item.product_type,
          }),
        );
      }

      this.closeModal();
      this.loadMasterData(this.currentPage);
    } catch (error: any) {
      this.formErrorMessage =
        error?.error?.message || 'Unable to save master data.';
    } finally {
      this.isLoading = false;
    }
  }

  private async deleteMasterData(id: number): Promise<void> {
    this.isLoading = true;
    try {
      await firstValueFrom(this.productService.deleteProduct(id));
      this.loadMasterData(this.currentPage);
    } catch (error: any) {
      this.pageErrorMessage =
        error?.error?.message || 'Unable to delete master data.';
    } finally {
      this.isLoading = false;
    }
  }

  getProductTypeLabel(productType: 'activity' | 'accommodation'): string {
    return productType === 'activity' ? 'Activity' : 'Accommodation';
  }

  formatDateTime(value: string): string {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const displayHours = String(hours % 12 || 12).padStart(2, '0');

    return `${day}-${month}-${year}, ${displayHours}:${minutes}${suffix}`;
  }

  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  onMenuItemTap(_item: MenuItem): void {
    this.menuCtrl.close('master-data-menu');
  }

  logOut(): void {
    this.authService.logout('/login');
  }
}
