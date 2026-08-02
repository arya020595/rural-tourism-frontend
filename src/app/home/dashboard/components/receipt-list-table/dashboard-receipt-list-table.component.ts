import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ReceiptListItem } from '../../dashboard.models';

export interface ReceiptPaginationMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

@Component({
  selector: 'app-dashboard-receipt-list-table',
  templateUrl: './dashboard-receipt-list-table.component.html',
  styleUrls: ['./dashboard-receipt-list-table.component.scss'],
})
export class DashboardReceiptListTableComponent {
  @Input() receipts: ReceiptListItem[] = [];
  @Input() meta: ReceiptPaginationMeta = {
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  };
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  constructor(private router: Router) {}

  get totalPages(): number {
    return Math.max(1, this.meta.total_pages || 1);
  }

  get pageNumbers(): number[] {
    return [];
  }

  get paginationItems(): Array<number | '...'> {
    const total = this.totalPages;
    const current = this.meta.page || 1;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }

    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, '...', current - 1, current, current + 1, '...', total];
  }

  onChangePage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.pageChange.emit(page);
  }

  onPageSizeChange(value: string): void {
    const parsed = Number(value);
    this.pageSizeChange.emit(parsed > 0 ? parsed : 10);
  }

  onInfoClick(row: ReceiptListItem): void {
    if (!row.bookingId) {
      return;
    }

    this.router.navigate(['/booking-home/detail', row.bookingId], {
      queryParams: { from: 'dashboard' },
    });
  }
}
