import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUserByID(user_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${user_id}`);
  }

  updateUserByID(
    user_id: string,
    payload: FormData | Record<string, any>,
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${user_id}`, payload);
  }

  getAllUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`);
  }
}
