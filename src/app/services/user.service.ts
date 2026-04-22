import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  UserCreatePayload,
  UserListParams,
  UserListResponse,
  UserSingleResponse,
  UserUpdatePayload,
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** Paginated, searchable user list */
  getUsers(params: UserListParams = {}): Observable<UserListResponse> {
    let httpParams = new HttpParams();
    if (params.page != null) httpParams = httpParams.set('page', params.page);
    if (params.per_page != null)
      httpParams = httpParams.set('per_page', params.per_page);
    if (params.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<UserListResponse>(`${this.apiUrl}/users`, {
      params: httpParams,
    });
  }

  /** Get a single user by ID */
  getUserById(id: number): Observable<UserSingleResponse> {
    return this.http.get<UserSingleResponse>(`${this.apiUrl}/users/${id}`);
  }

  /** Create a new user */
  createUser(payload: UserCreatePayload): Observable<UserSingleResponse> {
    return this.http.post<UserSingleResponse>(`${this.apiUrl}/users`, payload);
  }

  /** Update an existing user */
  updateUser(
    id: number,
    payload: UserUpdatePayload,
  ): Observable<UserSingleResponse> {
    return this.http.put<UserSingleResponse>(
      `${this.apiUrl}/users/${id}`,
      payload,
    );
  }

  /** Delete a user */
  deleteUser(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/users/${id}`,
    );
  }

  // ── Legacy methods kept for backward compatibility ────────────────────────

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
