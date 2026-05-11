import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BookingDetail } from '../booking-home.models';

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
  @Output() viewDetails = new EventEmitter<BookingDetail>();
  @Output() editBooking = new EventEmitter<BookingDetail>();
  @Output() pageChange = new EventEmitter<number>();

  trackByIndex(index: number): number {
    return index;
  }

  formatDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-');

    if (!year || !month || !day) {
      return isoDate;
    }

    return `${day}-${month}-${year}`;
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
