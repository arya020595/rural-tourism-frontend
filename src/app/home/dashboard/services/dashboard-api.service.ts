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
    totalRevenue: number;
    totalFulltimeStaff: number;
    totalParttimeStaff: number;
    totalStaff: number;
  };
}
