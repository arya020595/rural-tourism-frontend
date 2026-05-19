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
}
