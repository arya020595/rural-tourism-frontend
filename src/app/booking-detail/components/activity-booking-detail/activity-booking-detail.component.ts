import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BookingDetail } from '../../../booking-home/booking-home.models';

@Component({
  selector: 'app-activity-booking-detail',
  templateUrl: './activity-booking-detail.component.html',
  styleUrls: ['./activity-booking-detail.component.scss'],
})
export class ActivityBookingDetailComponent {
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
