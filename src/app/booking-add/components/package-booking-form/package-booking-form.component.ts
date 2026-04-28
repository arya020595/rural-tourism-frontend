import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-package-booking-form',
  templateUrl: './package-booking-form.component.html',
  styleUrls: ['./package-booking-form.component.scss'],
})
export class PackageBookingFormComponent {
  @Output() cancel = new EventEmitter<void>();
  @Output() submit = new EventEmitter<Record<string, unknown>>();

  customerType = 'tourist';
  selectedNationality = 'domestic';
  fullName = '';
  phone = '';
  email = '';
  paxCount = '';
  domesticPax = '';
  internationalPax = '';
  bookingDate = '';
  packageName = '';
  packagePrice = '';
  serviceName = '';
  operatorName = '';

  get isMixedNationality(): boolean {
    return this.selectedNationality === 'both';
  }

  onCancel(): void {
    this.cancel.emit();
  }

  submitForm(): void {
    this.submit.emit({
      bookingType: 'package',
      customerType: this.customerType,
      nationality: this.selectedNationality,
      fullName: this.fullName,
      phone: this.phone,
      email: this.email,
      paxCount: this.paxCount,
      domesticPax: this.domesticPax,
      internationalPax: this.internationalPax,
      bookingDate: this.bookingDate,
      packageName: this.packageName,
      packagePrice: this.packagePrice,
      serviceName: this.serviceName,
      operatorName: this.operatorName,
    });
  }
}
