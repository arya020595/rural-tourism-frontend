import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-activity-booking-form',
  templateUrl: './activity-booking-form.component.html',
  styleUrls: ['./activity-booking-form.component.scss'],
})
export class ActivityBookingFormComponent {
  @Output() cancel = new EventEmitter<void>();
  @Output() submit = new EventEmitter<Record<string, unknown>>();

  selectedNationality = 'domestic';
  bookingDate = '12/03/2026';
  bookingTime = '';
  fullName = '';
  phone = '';
  email = '';
  paxCount = '';
  domesticPax = '';
  internationalPax = '';
  activity = '';
  total = '';
  operatorName = '';

  get isMixedNationality(): boolean {
    return this.selectedNationality === 'both';
  }

  onCancel(): void {
    this.cancel.emit();
  }

  submitForm(): void {
    this.submit.emit({
      bookingType: 'activity',
      nationality: this.selectedNationality,
      bookingDate: this.bookingDate,
      bookingTime: this.bookingTime,
      fullName: this.fullName,
      phone: this.phone,
      email: this.email,
      paxCount: this.paxCount,
      domesticPax: this.domesticPax,
      internationalPax: this.internationalPax,
      activity: this.activity,
      total: this.total,
      operatorName: this.operatorName,
    });
  }
}
