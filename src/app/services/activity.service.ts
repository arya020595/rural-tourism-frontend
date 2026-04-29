import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllActivity(): Observable<any> {
    return this.http.get(`${this.apiUrl}/activity`);
  }

  getAllActByUser(user_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/activity/user/${user_id}`);
  }

  createActivity(form: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/activity`, form);
  }

  getAllActivityMasterData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/activity-master-data`);
  }

  getActivityMasterDataById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/activity-master-data/${id}`);
  }

  createOperatorActivity(form: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/operator-activities`, form);
  }

  getOperatorActivitiesByUser(user_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/operator-activities/user/${user_id}`);
  }

  getOperatorsByActivityId(activityId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/operator-activities/activity/${activityId}`,
    );
  }

  getOperatorById(operatorId: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/operator-activities/${operatorId}?includeUser=true`,
    );
  }

  updateOperatorActivity(id: string, form: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/operator-activities/${id}`, form);
  }

  getActivityById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/activity-master-data/${id}`);
  }
}
