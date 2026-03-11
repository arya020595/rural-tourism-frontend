import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-date-modal',
  templateUrl: './date-modal.component.html',
})
export class DateModalComponent {
  selectedDate: string = '';
  bookedDates: string[] = [];
  /** When set, only dates with a price entry > 0 are selectable */
  availableDates: { date: string; price: number }[] = [];
  /** When set, dates strictly before this value (YYYY-MM-DD) are disabled */
  minDate: string = '';

  constructor(private modalCtrl: ModalController) {}

  isDateEnabled = (dateString: string): boolean => {
    const dateOnly = dateString.substring(0, 10);
    if (this.minDate && dateOnly <= this.minDate) return false;
    if (this.bookedDates.includes(dateOnly)) return false;
    if (this.availableDates.length > 0) {
      return this.availableDates.some(
        (e) => e.date === dateOnly && (e.price ?? 0) > 0,
      );
    }
    return true;
  };

  close() {
    this.modalCtrl.dismiss(null);
  }

  confirm() {
    this.modalCtrl.dismiss(this.selectedDate);
  }
}
