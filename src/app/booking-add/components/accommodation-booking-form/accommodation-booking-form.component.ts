import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-accommodation-booking-form',
  templateUrl: './accommodation-booking-form.component.html',
  styleUrls: ['./accommodation-booking-form.component.scss'],
})
export class AccommodationBookingFormComponent {
  @Output() cancel = new EventEmitter<void>();
  @Output() submit = new EventEmitter<Record<string, unknown>>();

  selectedNationality = 'domestic';
  checkInDate = '5/03/2026';
  checkOutDate = '7/03/2026';
  fullName = '';
  phone = '';
  email = '';
  paxCount = '';
  domesticPax = '';
  internationalPax = '';
  nights = '';
  homestay = '';
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
      bookingType: 'accommodation',
      nationality: this.selectedNationality,
      checkInDate: this.checkInDate,
      checkOutDate: this.checkOutDate,
      fullName: this.fullName,
      phone: this.phone,
      email: this.email,
      paxCount: this.paxCount,
      domesticPax: this.domesticPax,
      internationalPax: this.internationalPax,
      nights: this.nights,
      homestay: this.homestay,
      total: this.total,
      operatorName: this.operatorName,
    });
  }
}
