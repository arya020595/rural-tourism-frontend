import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllProducts(params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Observable<any> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', String(params.page));
    }

    if (params?.per_page !== undefined) {
      httpParams = httpParams.set('per_page', String(params.per_page));
    }

    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get(`${this.apiUrl}/products`, { params: httpParams });
  }

  getProductsByCompany(
    companyId: string | number,
    params?: {
      page?: number;
      per_page?: number;
      search?: string;
    },
  ): Observable<any> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', String(params.page));
    }

    if (params?.per_page !== undefined) {
      httpParams = httpParams.set('per_page', String(params.per_page));
    }

    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get(`${this.apiUrl}/products/company/${companyId}`, {
      params: httpParams,
    });
  }

  getProductsByLocation(params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Observable<any> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', String(params.page));
    }

    if (params?.per_page !== undefined) {
      httpParams = httpParams.set('per_page', String(params.per_page));
    }

    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get(`${this.apiUrl}/products/shared-by-location`, {
      params: httpParams,
    });
  }

  createProduct(payload: {
    name: string;
    product_type: 'activity' | 'accommodation';
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/products`, payload);
  }

  updateProduct(
    id: string | number,
    payload: Partial<{
      name: string;
      product_type: 'activity' | 'accommodation';
    }>,
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/products/${id}`, payload);
  }

  deleteProduct(id: string | number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`);
  }
}
