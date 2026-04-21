import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  updateCompanyById(
    company_id: string | number,
    payload: FormData,
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/companies/${company_id}`, payload);
  }
}
