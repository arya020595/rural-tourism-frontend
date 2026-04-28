import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BookingDetail } from '../booking-home.models';

@Component({
  selector: 'app-booking-list-table',
  templateUrl: './booking-list-table.component.html',
  styleUrls: ['./booking-list-table.component.scss'],
})
export class BookingListTableComponent {
  @Input() bookings: BookingDetail[] = [];
  @Output() viewDetails = new EventEmitter<BookingDetail>();

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
}
