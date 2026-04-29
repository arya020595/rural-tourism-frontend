import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AccommodationService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createAccom(form: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/accom`, form);
  }

  getAllAccommodations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/accom`);
  }

  getAllAccomByUser(user_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/accom/user/${user_id}`);
  }

  getAccommodationById(accommodationId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/accom/${accommodationId}`);
  }

  updateAccommodation(accomId: string, form: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/accom/${accomId}`, form);
  }

  getAccommodationOperatorById(operatorId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${operatorId}`);
  }
}
