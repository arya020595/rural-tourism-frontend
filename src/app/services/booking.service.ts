import { HttpClient, HttpParams } from '@angular/common/http';
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

  createUnifiedBooking(bookingData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/bookings`, bookingData);
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

  // ── Unified booking management ───────────────────────────────────

  getBookingById(bookingId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/bookings/${bookingId}`);
  }

  getReceiptPdfUrl(bookingId: string | number): string {
    return `${this.apiUrl}/bookings/${bookingId}/receipt-pdf`;
  }

  updateBooking(bookingId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/bookings/${bookingId}`, data);
  }

  cancelBooking(bookingId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/bookings/${bookingId}/cancel`, {});
  }

  markBookingAsPaid(bookingId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/bookings/${bookingId}/payment`, {});
  }

  getBookings(params?: {
    page?: number;
    per_page?: number;
    booking_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    user_id?: string | number;
    company_id?: string | number;
    search?: string;
  }): Observable<any> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', String(params.page));
    }

    if (params?.per_page !== undefined) {
      httpParams = httpParams.set('per_page', String(params.per_page));
    }

    if (params?.booking_type) {
      httpParams = httpParams.set('booking_type', params.booking_type);
    }

    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }

    if (params?.start_date) {
      httpParams = httpParams.set('start_date', params.start_date);
    }

    if (params?.end_date) {
      httpParams = httpParams.set('end_date', params.end_date);
    }

    if (params?.user_id !== undefined) {
      httpParams = httpParams.set('user_id', String(params.user_id));
    }

    if (params?.company_id !== undefined) {
      httpParams = httpParams.set('company_id', String(params.company_id));
    }

    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get(`${this.apiUrl}/bookings`, { params: httpParams });
  }

  getPackageBookings(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
  }): Observable<any> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', String(params.page));
    }
    if (params?.per_page !== undefined) {
      httpParams = httpParams.set('per_page', String(params.per_page));
    }
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get(`${this.apiUrl}/bookings/packages`, { params: httpParams });
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

  getStatementPreview(year: number, type: string, fromMonth: number, toMonth: number): Observable<any> {
    const params = new HttpParams()
      .set('year', String(year))
      .set('type', type)
      .set('fromMonth', String(fromMonth))
      .set('toMonth', String(toMonth));
    return this.http.get(`${this.apiUrl}/bookings/statement/preview`, { params });
  }

  downloadStatementPdf(year: number, type: string, fromMonth: number, toMonth: number): Observable<Blob> {
    const params = new HttpParams()
      .set('year', String(year))
      .set('type', type)
      .set('fromMonth', String(fromMonth))
      .set('toMonth', String(toMonth));
    return this.http.get(`${this.apiUrl}/bookings/statement/pdf`, {
      responseType: 'blob',
      params,
    });
  }
}
