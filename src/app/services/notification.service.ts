import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from 'src/environments/environment';

// Frontend-friendly Notification interface
export interface Notification {
  id: number;
  operator_id: string;
  tourist_user_id: string;
  booking_id: number;
  message: string;
  read_status: number; // original backend field
  read: boolean;       // frontend-friendly field
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = environment.apiUrl; // e.g., http://localhost:3000/api

  constructor(private http: HttpClient) {}

  /**
   * Get notifications for operator and map read_status → read
   */
  getNotifications(operatorId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/notifications/operator/${operatorId}`)
      .pipe(
        map(notifications =>
          notifications.map(n => ({
            ...n,
            read: !!n.read_status // convert 0/1 to boolean for frontend
          }))
        )
      );
  }

  /**
   * Create a new notification for operator
   */
  createOperatorNotification(notificationData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/notifications`, notificationData);
  }

    // ✅ New method to mark all notifications as read
markAllAsRead(operatorId: string) {
  return this.http.patch(`${this.apiUrl}/notifications/operator/${operatorId}/read-all`, {});
}




  /**
   * Mark a single notification as read
   */
  markAsRead(notificationId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/notifications/${notificationId}/read`, {});
  }

  /**
   * Mark multiple notifications as read
   * Returns an Observable that completes when all requests complete
   */
  markMultipleAsRead(notificationIds: number[]): Observable<any> {
    if (!notificationIds || notificationIds.length === 0) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    const requests = notificationIds.map(id => this.markAsRead(id));
    return forkJoin(requests);
  }

  getUnreadCount(operatorId: string): Observable<{ unread_count: number }> {
  return this.http.get<{ unread_count: number }>(`${this.apiUrl}/notifications/operator/${operatorId}/unread-count`);
}

}


