import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TodayDashboardData, TrendDashboardData } from '../dashboard.models';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTodayDashboard(date?: string): Observable<ApiResponse<TodayDashboardData>> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date);
    }

    return this.http.get<ApiResponse<TodayDashboardData>>(
      `${this.apiUrl}/dashboard/today`,
      { params },
    );
  }

  getTrendDashboard(
    from: string,
    to: string,
  ): Observable<ApiResponse<TrendDashboardData>> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<ApiResponse<TrendDashboardData>>(
      `${this.apiUrl}/dashboard/trend`,
      { params },
    );
  }

  // Superadmin-only: totals per association. Omit from/to for all-time.
  getAssociationStats(
    from?: string,
    to?: string,
  ): Observable<ApiResponse<AssociationStatsData>> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);

    return this.http.get<ApiResponse<AssociationStatsData>>(
      `${this.apiUrl}/dashboard/association-stats`,
      { params },
    );
  }

  // Association users: their own association + member companies.
  getMyAssociationStats(
    from?: string,
    to?: string,
  ): Observable<ApiResponse<MyAssociationStatsData>> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);

    return this.http.get<ApiResponse<MyAssociationStatsData>>(
      `${this.apiUrl}/dashboard/my-association-stats`,
      { params },
    );
  }

  // A member company's profile (the "i" button).
  getAssociationMember(companyId: number): Observable<ApiResponse<AssociationMemberProfile>> {
    return this.http.get<ApiResponse<AssociationMemberProfile>>(
      `${this.apiUrl}/dashboard/my-association-members/${companyId}`,
    );
  }
}

export interface AssociationCompany {
  companyId: number;
  companyName: string;
}

export interface AssociationStatRow {
  associationId: number;
  associationName: string;
  totalBookings: number;
  totalReceipts: number;
  totalTourists: number;
  totalCancelled: number;
  /** Bookings that are neither paid nor cancelled (pending + paid + cancelled = total). */
  totalPending: number;
  /** Deposits of pending + cancelled bookings (paid ones are in totalRevenue). */
  totalDeposit: number;
  /** Part of totalDeposit: bookings not paid in full yet. */
  totalDepositPending: number;
  /** Part of totalDeposit: cancelled bookings. */
  totalDepositCancelled: number;
  /** Sum of total_price for paid bookings only. */
  totalRevenue: number;
  totalFulltimeStaff: number;
  totalParttimeStaff: number;
  totalStaff: number;
  companies: AssociationCompany[];
}

export interface AssociationStatsData {
  associations: AssociationStatRow[];
  totals: {
    totalBookings: number;
    totalReceipts: number;
    totalTourists: number;
    totalCancelled: number;
    totalPending: number;
    totalDeposit: number;
    totalDepositPending: number;
    totalDepositCancelled: number;
    totalRevenue: number;
    totalFulltimeStaff: number;
    totalParttimeStaff: number;
    totalStaff: number;
  };
}

/** A member company row on the association statistics page. */
export interface AssociationMember {
  companyId: number;
  companyName: string;
  ownerName: string | null;
  location: string | null;
  contactNo: string | null;
  email: string | null;
  fulltimeStaff: number;
  parttimeStaff: number;
  joinedAt: string | null;
  /** Pax of paid bookings in the date range. */
  totalTourists: number;
}

export interface MyAssociationStatsData {
  association: { id: number; name: string };
  totals: AssociationStatsData['totals'];
  members: AssociationMember[];
}

/** A member company's profile as its association sees it. */
export interface AssociationMemberProfile {
  company_id: number;
  company_name: string;
  address: string | null;
  location: string | null;
  postcode: string | null;
  email: string | null;
  contact_no: string | null;
  total_fulltime_staff: number | null;
  total_partime_staff: number | null;
  joined_at: string | null;
  association: { id: number; name: string } | null;
  owner: { name: string | null; username: string; email: string | null } | null;
  /** Stored values, resolve with FileUrlService. */
  documents: {
    operator_logo_image: string | null;
    motac_license_file: string | null;
    trading_operation_license: string | null;
    homestay_certificate: string | null;
  };
}
