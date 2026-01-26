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
  read_status?: number;
  is_read?: number;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = environment.apiUrl;

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  private normalizeDate(dateStr?: string): string {
    if (!dateStr) return '';
    const isoStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
    const date = new Date(isoStr);
    return isNaN(date.getTime()) ? '' : isoStr;
  }

  /**
   * Get notifications.
   * If lastCreated is provided, fetch only notifications newer than lastCreated
   */
  getNotifications(operatorId: string, lastCreated?: string): Observable<Notification[]> {
    let url = `${this.apiUrl}/notifications/operator/${operatorId}`;
    if (lastCreated) {
      url += `?after=${encodeURIComponent(lastCreated)}`; // backend should support this
    }

    return this.http.get<Notification[]>(url).pipe(
      map(notifications =>
        notifications.map(n => ({
          ...n,
          read: Number(n.read_status ?? n.is_read) === 1,
          createdAt: this.normalizeDate(n.createdAt),
          updatedAt: this.normalizeDate(n.updatedAt)
        }))
      ),
      tap(notifications => {
        const unread = notifications.filter(n => !n.read).length;
        if (!lastCreated) this.unreadCountSubject.next(unread);
      })
    );
  }

  createOperatorNotification(notificationData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/notifications`, notificationData).pipe(
      tap(() => {
        // 🔥 increment unread badge instantly
        this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
      })
    );
  }


  markAsRead(notificationId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/notifications/${notificationId}/read`, {}).pipe(
      tap(() => {
        const current = this.unreadCountSubject.value;
        this.unreadCountSubject.next(Math.max(0, current - 1));
      })
    );
  }

  markAllAsRead(operatorId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/notifications/operator/${operatorId}/read-all`, {}).pipe(
      tap(() => this.unreadCountSubject.next(0))
    );
  }

  markMultipleAsRead(notificationIds: number[]): Observable<any> {
    if (!notificationIds?.length) return new Observable(observer => { observer.next([]); observer.complete(); });
    const requests = notificationIds.map(id => this.markAsRead(id));
    return forkJoin(requests);
  }

  getUnreadCount(operatorId: string): Observable<{ unread_count: number }> {
    return this.http.get<{ unread_count: number }>(`${this.apiUrl}/notifications/operator/${operatorId}/unread-count`).pipe(
      tap(resp => this.unreadCountSubject.next(resp.unread_count))
    );
  }
}