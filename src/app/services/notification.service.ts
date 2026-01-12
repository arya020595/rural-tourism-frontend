import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, BehaviorSubject, map, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Notification {
  id: number;
  operator_id: string;
  tourist_user_id: string;
  booking_id: number;
  title: string;
  type: string;
  message: string;
  read_status?: number; // original backend field
  is_read?: number;     // sometimes backend uses this
  read: boolean;        // frontend-friendly
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = environment.apiUrl;

  // Reactive unread count
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** Get notifications for operator */
  getNotifications(operatorId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/notifications/operator/${operatorId}`).pipe(
      map(notifications =>
        notifications.map(n => ({
          ...n,
          read: Number(n.read_status ?? n.is_read) === 1
        }))
      ),
      tap(notifications => {
        // Update unread count reactively
        const unread = notifications.filter(n => !n.read).length;
        this.unreadCountSubject.next(unread);
      })
    );
  }

  /** Create a new notification */
  createOperatorNotification(notificationData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/notifications`, notificationData);
  }

  /** Mark a single notification as read */
  markAsRead(notificationId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/notifications/${notificationId}/read`, {}).pipe(
      tap(() => {
        // Reduce unread count by 1 when marking read
        const current = this.unreadCountSubject.value;
        this.unreadCountSubject.next(Math.max(0, current - 1));
      })
    );
  }

  /** Mark all notifications as read */
  markAllAsRead(operatorId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/notifications/operator/${operatorId}/read-all`, {}).pipe(
      tap(() => this.unreadCountSubject.next(0)) // instantly reset badge
    );
  }

  /** Mark multiple notifications as read */
  markMultipleAsRead(notificationIds: number[]): Observable<any> {
    if (!notificationIds?.length) return new Observable(observer => { observer.next([]); observer.complete(); });
    const requests = notificationIds.map(id => this.markAsRead(id));
    return forkJoin(requests);
  }

  /** Get unread count from backend */
  getUnreadCount(operatorId: string): Observable<{ unread_count: number }> {
    return this.http.get<{ unread_count: number }>(`${this.apiUrl}/notifications/operator/${operatorId}/unread-count`).pipe(
      tap(resp => this.unreadCountSubject.next(resp.unread_count))
    );
  }
}