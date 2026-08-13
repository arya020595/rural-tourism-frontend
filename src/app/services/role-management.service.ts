import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  PermissionsBySectionResponse,
  RoleCreatePayload,
  RoleListParams,
  RoleListResponse,
  RoleSingleResponse,
  RoleUpdatePayload,
} from '../models/role-management.model';

@Injectable({ providedIn: 'root' })
export class RoleManagementService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** Paginated, searchable role list */
  getRoles(params: RoleListParams = {}): Observable<RoleListResponse> {
    let httpParams = new HttpParams();
    if (params.page != null) httpParams = httpParams.set('page', params.page);
    if (params.per_page != null)
      httpParams = httpParams.set('per_page', params.per_page);
    if (params.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<RoleListResponse>(`${this.apiUrl}/roles`, {
      params: httpParams,
    });
  }

  /** Get single role with full permissions */
  getRoleById(id: number): Observable<RoleSingleResponse> {
    return this.http.get<RoleSingleResponse>(`${this.apiUrl}/roles/${id}`);
  }

  /** Get all permissions grouped by section */
  getPermissionsBySection(): Observable<PermissionsBySectionResponse> {
    return this.http.get<PermissionsBySectionResponse>(
      `${this.apiUrl}/permissions/by-section`
    );
  }

  /** Create a new role */
  createRole(payload: RoleCreatePayload): Observable<RoleSingleResponse> {
    return this.http.post<RoleSingleResponse>(`${this.apiUrl}/roles`, payload);
  }

  /** Update an existing role (name and/or permissions) */
  updateRole(
    id: number,
    payload: RoleUpdatePayload
  ): Observable<RoleSingleResponse> {
    return this.http.put<RoleSingleResponse>(
      `${this.apiUrl}/roles/${id}`,
      payload
    );
  }

  /** Delete a role */
  deleteRole(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/roles/${id}`
    );
  }
}
