import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Define the interface for the response from the backend
export interface PdfResponse {
  success: boolean;
  fileUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // private apiUrl = 'http://localhost:3000/api'; // local testing
  // private apiUrl = 'http://192.168.100.75:3000/api'; // dont use
  private apiUrl = environment.apiUrl; // for server production
  constructor(private http: HttpClient) {}
  // Call to void the receipt
  voidReceipt(receiptID: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/receipts/void-receipt`, {
      receiptID,
    });
  }

  testBackend(): Observable<any> {
    return this.http.get(`${this.apiUrl}/test`);
  }

  //USER API

  //login
  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, {
      identifier: credentials.username,
      username: credentials.username,
      password: credentials.password,
      user_type: 'operator',
    });
  }

  //get specific user by id
  getUserByID(user_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${user_id}`);
  }

  getAllUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`);
  }

  //   getActivityById(id: string) {
  //   return this.http.get<any>(`${this.apiUrl}/activity/${id}`);
  // }

  //create user (register)
  createUser(form: any): Observable<any> {
    return this.register(form, 'operator');
  }

  register(payload: any, userType: 'operator' | 'tourist'): Observable<any> {
    if (payload instanceof FormData) {
      if (!payload.has('user_type')) {
        payload.append('user_type', userType);
      }
      return this.http.post(`${this.apiUrl}/auth/register`, payload);
    }

    return this.http.post(`${this.apiUrl}/auth/register`, {
      ...(payload || {}),
      user_type: userType,
    });
  }

  registerTourist(payload: any): Observable<any> {
    return this.register(payload, 'tourist');
  }

  //reset password
  resetPassword(
    username: string,
    question: string,
    securityAnswer: string,
    newPassword: string,
  ): Observable<any> {
    const payload = { username, question, securityAnswer, newPassword };
    return this.http.post(`${this.apiUrl}/users/reset-pass`, payload);
  }

  //FORM API

  //create form
  createForm(form: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/form`, form);
  }

  // get form/receipt by id
  getFormByID(form_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/form/${form_id}`);
  }

  // Modify the function to accept FormData
  generatePdfFromImage(formData: FormData): Observable<any> {
    const url = `${this.apiUrl}/receipts/generate-pdf-from-image`;

    // Make a POST request to send the FormData (which contains the file)
    return this.http.post<any>(url, formData);
  }

  // Upload the image as FormData
  uploadPdf(formData: FormData): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/receipts/generate-pdf-from-image`,
      formData,
    );
  }

  // load transaction history (operator)
  getFormsByUser(user_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/form/operator/${user_id}`);
  }

  // load transaction history (tourist)
  getFormsByTourist(tourist_user_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/form/tourist/${tourist_user_id}`);
  }

  // voidTransaction(user_id: string): Observable<any> {
  //   return this.http.get(`${this.apiUrl}/form/trans/${user_id}`);
  // }

  //ACCOMMODATION API

  //add new accommodation
  createAccom(form: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/accom`, form);
  }

  // get all accomodations
  getAllAccommodations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/accom`);
  }

  // get all accommodations by User
  getAllAccomByUser(user_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/accom/user/${user_id}`);
  }

  //ACTIVITY API

  //add new activity
  createActivity(form: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/activity`, form);
  }

  // get all activity
  getAllActivity(): Observable<any> {
    return this.http.get(`${this.apiUrl}/activity`);
  }

  getAllActByUser(user_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/activity/user/${user_id}`);
  }

  // In ApiService
  loginTourist(credentials: {
    username: string;
    password: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, {
      identifier: credentials.username,
      username: credentials.username,
      password: credentials.password,
      user_type: 'tourist',
    });
  }

  getAllActivityMasterData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/activity-master-data`);
  }

  getActivityById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/activity-master-data/${id}`);
  }

  // OPERATOR ACTIVITY API
  createOperatorActivity(form: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/operator-activities`, form);
  }

  // Optional: get all operator activities by user
  getOperatorActivitiesByUser(user_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/operator-activities/user/${user_id}`);
  }

  getOperatorsByActivityId(activityId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/operator-activities/activity/${activityId}`,
    );
  }

  getOperatorsByUser(user_id: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/operator-activities/user/${user_id}`,
    );
  }

  // In ApiService
  // getOperatorById(operatorId: string) {
  //   return this.http.get(`${this.apiUrl}/operator-activities/${operatorId}`);
  // }

  getOperatorById(operatorId: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/operator-activities/${operatorId}?includeUser=true`,
    );
  }

  // Create a new activity booking
  createBooking(bookingData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/activity-booking`, bookingData);
  }

  createTransaction(transactionData: any): Observable<any> {
    return this.createForm(transactionData);
  }

  getTransactionById(transactionId: string): Observable<any> {
    return this.getFormByID(transactionId);
  }

  getTouristBookings(touristId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/activity-booking/user/${touristId}`,
    );
  }

  getAccommodationById(accommodationId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/accom/${accommodationId}`);
  }

  // Create a new accommodation booking
  createAccommodationBooking(bookingData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/accommodation-booking`, bookingData);
  }

  // Get a booking by ID
  getAccommodationBookingById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/accommodation-booking/${id}`);
  }

  // Get booked dates for a specific accommodation
  getBookedDatesByAccommodation(
    accommodationId: string,
  ): Observable<{ success: boolean; data: string[] }> {
    return this.http.get<{ success: boolean; data: string[] }>(
      `${this.apiUrl}/accommodation-booking/booked-dates/${accommodationId}`,
    );
  }

  createOperatorNotification(notificationData: any) {
    return this.http.post(
      `${environment.apiUrl}/notifications`,
      notificationData,
    );
  }

  getBookedDatesByActivity(activityId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/activity-booking/booked-dates/${activityId}`,
    );
  }

  getBookedDatesByOperatorActivity(
    operatorActivityId: string,
  ): Observable<{ success: boolean; data: { date: string; time: string }[] }> {
    return this.http.get<{
      success: boolean;
      data: { date: string; time: string }[];
    }>(
      `${this.apiUrl}/activity-booking/booked-dates/operator/${operatorActivityId}`,
    );
  }

  // src/app/services/api.service.ts

  getNotificationsByOperator(operatorId: string) {
    return this.http.get(`${this.apiUrl}/notifications/operator/${operatorId}`);
  }

  /**
   * Fetch operator info for accommodation bookings.
   * Operators are stored in users table and exposed through /api/users.
   * @param operatorId - The user_id of the operator
   */
  getAccommodationOperatorById(operatorId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${operatorId}`);
  }

  cancelAccommodationBooking(bookingId: string) {
    return this.http.delete(
      `${this.apiUrl}/tourist-bookings/accommodation-booking/${bookingId}`,
    );
  }

  cancelActivityBooking(bookingId: string) {
    return this.http.delete(
      `${this.apiUrl}/tourist-bookings/activity-booking/${bookingId}`,
    );
  }

  // Suspend a tourist user
  suspendTouristUser(touristUserId: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/tourists/${touristUserId}/suspend`,
      {},
    );
  }

  // Get all bookings (accommodation + activity) for a tourist
  getTouristAllBookings(touristUserId: string) {
    return this.http.get<any[]>(
      `${this.apiUrl}/tourist-bookings/user/${touristUserId}`,
    );
  }

  // Get all booked dates for a specific activity
  getBookedDates(
    activityId: string,
  ): Observable<{ success: boolean; data: string[] }> {
    return this.http.get<{ success: boolean; data: string[] }>(
      `${this.apiUrl}/activity-booking/${activityId}/booked-dates`,
    );
  }

  getOperatorAllBookings(operatorId: string) {
    return this.http.get<any>(
      `${this.apiUrl}/operator-bookings/user/${operatorId}`,
    );
  }

  // Get all active tourist users (for manual booking dropdown)
  getAllTouristUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/tourists`);
  }

  markActivityPaid(bookingId: string) {
    return this.http.post<any>(
      `${this.apiUrl}/operator-bookings/activity/${bookingId}/paid`,
      {},
    );
  }

  markAccommodationPaid(bookingId: string) {
    return this.http.post<any>(
      `${this.apiUrl}/operator-bookings/accommodation/${bookingId}/paid`,
      {},
    );
  }

  updateOperatorActivity(id: string, form: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/operator-activities/${id}`, form);
  }

  // UPDATE accommodation
  updateAccommodation(accomId: string, form: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/accom/${accomId}`, form);
  }

  //Apply more methods here...
  getAssociationList(): Observable<any> {
    return this.http.get(`${this.apiUrl}/associations/public`);
  }

  loginAssociation(credentials: {
    username: string;
    password: string;
  }): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/auth/login`,
      {
        identifier: credentials.username,
        username: credentials.username,
        password: credentials.password,
        user_type: 'association',
      },
    );
  }
}
