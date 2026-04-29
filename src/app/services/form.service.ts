import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PdfResponse {
  success: boolean;
  fileUrl: string;
}

@Injectable({ providedIn: 'root' })
export class FormService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createForm(form: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/form`, form);
  }

  getFormByID(form_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/form/${form_id}`);
  }

  getFormsByUser(user_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/form/operator/${user_id}`);
  }

  getFormsByTourist(tourist_user_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/form/tourist/${tourist_user_id}`);
  }

  generatePdfFromImage(formData: FormData): Observable<PdfResponse> {
    return this.http.post<PdfResponse>(
      `${this.apiUrl}/receipts/generate-pdf-from-image`,
      formData,
    );
  }

  voidReceipt(receiptID: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/receipts/void-receipt`, {
      receiptID,
    });
  }

  createTransaction(transactionData: any): Observable<any> {
    return this.createForm(transactionData);
  }

  getTransactionById(transactionId: string): Observable<any> {
    return this.getFormByID(transactionId);
  }
}
