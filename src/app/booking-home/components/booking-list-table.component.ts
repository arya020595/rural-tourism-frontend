import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BookingDetail } from '../booking-home.models';
import { QueueStatus } from '../../services/offline-queue.service';

@Component({
  selector: 'app-booking-list-table',
  templateUrl: './booking-list-table.component.html',
  styleUrls: ['./booking-list-table.component.scss'],
})
export class BookingListTableComponent {
  @Input() bookings: BookingDetail[] = [];
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() totalBookings = 0;
  @Input() totalPages = 1;
  @Input() queueStatusMap: Record<string, QueueStatus> = {};
  @Input() statusFilter: 'all' | 'pending' | 'paid' | 'cancelled' = 'all';
  @Output() viewDetails = new EventEmitter<BookingDetail>();
  @Output() editBooking = new EventEmitter<BookingDetail>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() statusFilterChange = new EventEmitter<void>();

  trackByIndex(index: number): number {
    return index;
  }

  getSyncStatus(booking: BookingDetail): QueueStatus | null {
    return this.queueStatusMap[String(booking.id)] ?? null;
  }

  syncDotColor(status: QueueStatus): string {
    switch (status) {
      case 'pending': return '#9e9e9e';
      case 'syncing': return '#2196f3';
      case 'synced': return '#4caf50';
      case 'failed': return '#ff9800';
      case 'conflict': return '#f44336';
      case 'permanently_failed': return '#f44336';
      default: return '#9e9e9e';
    }
  }

  syncDotLabel(status: QueueStatus): string {
    switch (status) {
      case 'pending': return 'Pending sync';
      case 'syncing': return 'Syncing...';
      case 'synced': return 'Synced';
      case 'failed': return 'Sync failed';
      case 'conflict': return 'Conflict';
      case 'permanently_failed': return 'Failed';
      default: return '';
    }
  }

  formatDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-');

    if (!year || !month || !day) {
      return isoDate;
    }

    return `${day}-${month}-${year}`;
  }

  get statusFilterLabel(): string {
    switch (this.statusFilter) {
      case 'pending': return 'Pending ▲';
      case 'paid': return 'Paid ▲';
      case 'cancelled': return 'Cancelled ▲';
      default: return 'Status ⇅';
    }
  }

  onStatusFilterClick(): void {
    this.statusFilterChange.emit();
  }

  onViewDetails(booking: BookingDetail): void {
    this.viewDetails.emit(booking);
  }

  onEditBooking(booking: BookingDetail): void {
    if (booking.status !== 'pending') {
      return;
    }

    this.editBooking.emit(booking);
  }

  get startEntry(): number {
    if (this.totalBookings === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endEntry(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalBookings);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }

    this.pageChange.emit(this.currentPage - 1);
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.pageChange.emit(this.currentPage + 1);
  }

  goToPage(page: number): void {
    if (page === this.currentPage) {
      return;
    }

    this.pageChange.emit(page);
  }

  trackByPage(page: number): number {
    return page;
  }
}
