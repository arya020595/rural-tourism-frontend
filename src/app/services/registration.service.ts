import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

/** An operator registration as the approvals page shows it. */
export interface Registration {
  company_id: number;
  company_name: string;
  status: RegistrationStatus;
  submitted_at: string | null;
  waiting_days: number | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  association: { id: number; name: string } | null;
  owner: { id: number; name: string | null; username: string; email: string | null } | null;
  company: {
    address: string | null;
    location: string | null;
    postcode: string | null;
    email: string | null;
    contact_no: string | null;
    total_fulltime_staff: number | null;
    total_partime_staff: number | null;
  };
  /** Detail only — stored values, resolve with FileUrlService. */
  documents?: {
    operator_logo_image: string | null;
    motac_license_file: string | null;
    trading_operation_license: string | null;
    homestay_certificate: string | null;
  };
}

export interface RegistrationCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface RegistrationListResponse {
  data: Registration[];
  meta: { total: number; page: number; per_page: number; total_pages: number };
  counts: RegistrationCounts;
}

/**
 * As the association sees them: approved = an active member, rejected = an
 * inactive one (a rejected registration or a deactivated member).
 */
export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  pending: 'Menunggu/Pending',
  approved: 'Aktif/Active',
  rejected: 'Tidak Aktif/Inactive',
};

/** Operator registration approval (association users + superadmin). */
@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly apiUrl = `${environment.apiUrl}/registrations`;

  constructor(private http: HttpClient) {}

  list(params: { status: RegistrationStatus; search?: string; page?: number; per_page?: number }): Observable<RegistrationListResponse> {
    let httpParams = new HttpParams().set('status', params.status);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.per_page) httpParams = httpParams.set('per_page', String(params.per_page));
    return this.http.get<RegistrationListResponse>(this.apiUrl, { params: httpParams });
  }

  pendingCount(): Observable<number> {
    return this.http
      .get<{ data: { pending: number } }>(`${this.apiUrl}/pending-count`)
      .pipe(map((res) => Number(res.data?.pending || 0)));
  }

  get(companyId: number): Observable<Registration> {
    return this.http.get<{ data: Registration }>(`${this.apiUrl}/${companyId}`).pipe(map((res) => res.data));
  }

  approve(companyId: number): Observable<Registration> {
    return this.http
      .post<{ data: Registration }>(`${this.apiUrl}/${companyId}/approve`, {})
      .pipe(map((res) => res.data));
  }

  reject(companyId: number, reason: string): Observable<Registration> {
    return this.http
      .post<{ data: Registration }>(`${this.apiUrl}/${companyId}/reject`, { reason })
      .pipe(map((res) => res.data));
  }
}
