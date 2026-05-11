import { Injectable } from '@angular/core';
import { BookingDetail } from '../booking-home/booking-home.models';

/**
 * Holds the currently selected booking so booking-detail can reliably
 * read it even when Angular/Ionic router navigation state timing causes
 * getCurrentNavigation() to return null.
 */
@Injectable({ providedIn: 'root' })
export class BookingStateService {
  private _selectedBooking: BookingDetail | null = null;

  set(booking: BookingDetail): void {
    this._selectedBooking = booking;
  }

  get(): BookingDetail | null {
    return this._selectedBooking;
  }

  clear(): void {
    this._selectedBooking = null;
  }
}
