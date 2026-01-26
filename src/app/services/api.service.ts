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
    return this.http.post(`${this.apiUrl}/users/login`, credentials);
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
    return this.http.post(`${this.apiUrl}/users`, form);
  }

  //reset password
  resetPassword(
    username: string,
    question: string,
    securityAnswer: string,
    newPassword: string
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
      formData
    );
  }

  // load transaction history
getFormsByUser(user_id: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/form/operator/${user_id}`);
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
    return this.http.post(`${this.apiUrl}/tourists/login`, credentials);
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
      `${this.apiUrl}/operator-activities/activity/${activityId}`
    );
  }

  getOperatorsByUser(rt_user_id: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/operator-activities/user/${rt_user_id}`
    );
  }

  // In ApiService
  // getOperatorById(operatorId: string) {
  //   return this.http.get(`${this.apiUrl}/operator-activities/${operatorId}`);
  // }

  getOperatorById(operatorId: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/operator-activities/${operatorId}?includeUser=true`
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
      `${this.apiUrl}/activity-booking/user/${touristId}`
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

  createOperatorNotification(notificationData: any) {
    return this.http.post(
      `${environment.apiUrl}/notifications`,
      notificationData
    );
  }

getBookedDatesByActivity(activityId: string): Observable<any> {
  return this.http.get<any>(
    `${this.apiUrl}/activity-booking/booked-dates/${activityId}`
  );
}




  // src/app/services/api.service.ts

  getNotificationsByOperator(operatorId: string) {
    return this.http.get(`${this.apiUrl}/notifications/operator/${operatorId}`);
  }

  /**
   * Fetch operator info for accommodation bookings.
   * Operators are stored in rt_users table, so we use the /api/users endpoint.
   * @param operatorId - The user_id of the operator (same as rt_user_id)
   */
  getAccommodationOperatorById(operatorId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${operatorId}`);
  }

cancelAccommodationBooking(bookingId: string) {
  return this.http.delete(`${this.apiUrl}/tourist-bookings/accommodation-booking/${bookingId}`);
}

cancelActivityBooking(bookingId: string) {
  return this.http.delete(`${this.apiUrl}/tourist-bookings/activity-booking/${bookingId}`);
}


// Get all bookings (accommodation + activity) for a tourist
getTouristAllBookings(touristUserId: string) {
  return this.http.get<any[]>(`${this.apiUrl}/tourist-bookings/user/${touristUserId}`);
}

// Get all booked dates for a specific activity
getBookedDates(activityId: string): Observable<{ success: boolean; data: string[] }> {
  return this.http.get<{ success: boolean; data: string[] }>(
    `${this.apiUrl}/activity-booking/${activityId}/booked-dates`
  );
}

getOperatorAllBookings(operatorId: string) {
  return this.http.get<any>(`${this.apiUrl}/operator-bookings/user/${operatorId}`);
}

markActivityPaid(bookingId: string) {
  return this.http.post<any>(`${this.apiUrl}/operator-bookings/activity/${bookingId}/paid`, {});
}

markAccommodationPaid(bookingId: string) {
  return this.http.post<any>(`${this.apiUrl}/operator-bookings/accommodation/${bookingId}/paid`, {});
}


//Apply more methods here...

}




