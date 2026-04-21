import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AssociationService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAssociationList(): Observable<any> {
    return this.http.get(`${this.apiUrl}/associations/public`);
  }
}
