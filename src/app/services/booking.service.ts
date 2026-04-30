import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Activity bookings ────────────────────────────────────────────

  createActivityBooking(bookingData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/activity-booking`, bookingData);
  }

  createBooking(bookingData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/activity-booking`, bookingData);
  }

  getTouristActivityBookings(touristId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/activity-booking/user/${touristId}`,
    );
  }

  getBookedDatesByActivity(activityId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/activity-booking/booked-dates/${activityId}`,
    );
  }

  getBookedDatesByOperatorActivity(
    operatorActivityId: string,
  ): Observable<{ success: boolean; data: { date: string; time: string }[] }> {
    return this.http.get<{
      success: boolean;
      data: { date: string; time: string }[];
    }>(
      `${this.apiUrl}/activity-booking/booked-dates/operator/${operatorActivityId}`,
    );
  }

  cancelActivityBooking(bookingId: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/tourist-bookings/activity-booking/${bookingId}`,
    );
  }

  markActivityPaid(bookingId: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/operator-bookings/activity/${bookingId}/paid`,
      {},
    );
  }

  // ── Accommodation bookings ───────────────────────────────────────

  createAccommodationBooking(bookingData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/accommodation-booking`, bookingData);
  }

  getAccommodationBookingById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/accommodation-booking/${id}`);
  }

  getBookedDatesByAccommodation(
    accommodationId: string,
  ): Observable<{ success: boolean; data: string[] }> {
    return this.http.get<{ success: boolean; data: string[] }>(
      `${this.apiUrl}/accommodation-booking/booked-dates/${accommodationId}`,
    );
  }

  cancelAccommodationBooking(bookingId: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/tourist-bookings/accommodation-booking/${bookingId}`,
    );
  }

  markAccommodationPaid(bookingId: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/operator-bookings/accommodation/${bookingId}/paid`,
      {},
    );
  }

  // ── Combined views ───────────────────────────────────────────────

  getOperatorAllBookings(operatorId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/operator-bookings/user/${operatorId}`,
    );
  }

  getTouristAllBookings(
    touristUserId: string,
  ): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(
      `${this.apiUrl}/tourist-bookings/user/${touristUserId}`,
    );
  }

  // ── Tourist user management ──────────────────────────────────────

  getAllTouristUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/tourists`);
  }

  suspendTouristUser(touristUserId: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/tourists/${touristUserId}/suspend`,
      {},
    );
  }

  // ── PDF ──────────────────────────────────────────────────────────

  downloadBookingPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/bookings/${id}/pdf`, {
      responseType: 'blob',
    });
  }
}
