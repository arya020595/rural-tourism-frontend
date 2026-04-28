import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BookingDetail } from '../../../booking-home/booking-home.models';

@Component({
  selector: 'app-package-booking-detail',
  templateUrl: './package-booking-detail.component.html',
  styleUrls: ['./package-booking-detail.component.scss'],
})
export class PackageBookingDetailComponent {
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
