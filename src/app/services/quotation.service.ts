import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Quotation,
  QuotationConvertMode,
  QuotationListFilter,
  QuotationListResponse,
  QuotationPayload,
} from '../quotation/quotation.models';

/** Sebut Harga / Quotation API (online only). */
@Injectable({ providedIn: 'root' })
export class QuotationService {
  private readonly apiUrl = `${environment.apiUrl}/quotations`;

  constructor(private http: HttpClient) {}

  list(params: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: QuotationListFilter;
    created_from?: string;
    created_to?: string;
  }): Observable<QuotationListResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.per_page) httpParams = httpParams.set('per_page', String(params.per_page));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.created_from) httpParams = httpParams.set('created_from', params.created_from);
    if (params.created_to) httpParams = httpParams.set('created_to', params.created_to);
    if (params.status && params.status !== 'all') {
      httpParams = httpParams.set('status', params.status);
    }
    return this.http.get<QuotationListResponse>(this.apiUrl, { params: httpParams });
  }

  get(id: number | string): Observable<Quotation> {
    return this.http
      .get<{ data: Quotation }>(`${this.apiUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(payload: QuotationPayload): Observable<Quotation> {
    return this.http
      .post<{ data: Quotation }>(this.apiUrl, payload)
      .pipe(map((res) => res.data));
  }

  update(id: number | string, payload: QuotationPayload): Observable<Quotation> {
    return this.http
      .put<{ data: Quotation }>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  cancel(id: number | string): Observable<Quotation> {
    return this.http
      .post<{ data: Quotation }>(`${this.apiUrl}/${id}/cancel`, {})
      .pipe(map((res) => res.data));
  }

  /** The company's default notes & terms (null = use the standard text). */
  getCompanyTerms(): Observable<string | null> {
    return this.http
      .get<{ data: { terms: string | null } }>(`${this.apiUrl}/terms`)
      .pipe(map((res) => res.data?.terms ?? null));
  }

  saveCompanyTerms(terms: string): Observable<string | null> {
    return this.http
      .put<{ data: { terms: string | null } }>(`${this.apiUrl}/terms`, { terms })
      .pipe(map((res) => res.data?.terms ?? null));
  }

  getPdf(id: number | string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  /**
   * The quotation as a booking record (GET /api/bookings/:id shape) to
   * pre-fill Add Booking (mode "booking") or E-Receipt (mode "receipt").
   */
  getBookingDraft(id: number | string, mode: QuotationConvertMode): Observable<any> {
    return this.http
      .get<{ data: any }>(`${this.apiUrl}/${id}/booking-draft`, {
        params: new HttpParams().set('mode', mode),
      })
      .pipe(map((res) => res.data));
  }
}
