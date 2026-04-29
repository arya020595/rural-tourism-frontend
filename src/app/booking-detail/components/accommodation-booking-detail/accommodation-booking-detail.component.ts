import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BookingDetail } from '../../../booking-home/booking-home.models';

@Component({
  selector: 'app-accommodation-booking-detail',
  templateUrl: './accommodation-booking-detail.component.html',
  styleUrls: ['./accommodation-booking-detail.component.scss'],
})
export class AccommodationBookingDetailComponent {
  @Input() booking: BookingDetail | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() viewReceipt = new EventEmitter<void>();

  onCancel(): void {
    this.cancel.emit();
  }

  onEdit(): void {
    this.edit.emit();
  }

  onViewReceipt(): void {
    this.viewReceipt.emit();
  }
}
