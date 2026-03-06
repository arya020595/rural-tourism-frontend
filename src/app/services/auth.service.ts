import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';

export interface User {
  id?: string;
  user_id?: string;
  tourist_user_id?: string;
  username: string;
  full_name?: string;
  email?: string;
  contact_no?: string;
  nationality?: string;
  role?: 'operator' | 'tourist';
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  id?: string;
  user?: User;
}

export interface RegisterData {
  username: string;
  password: string;
  full_name: string;
  email?: string;
  contact_no?: string;
  nationality?: string;
}

/**
 * AuthService - Centralized authentication management
 *
 * Benefits:
 * - Single source of truth for auth state
 * - Observable user state for reactive components
 * - Consistent login/logout behavior across app
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  // Observable user state
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Track authentication state
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private storage: StorageService,
  ) {
    // Initialize auth state from storage on service creation
    this.initializeAuthState();
  }

  /**
   * Initialize auth state from storage
   */
  private initializeAuthState(): void {
    const user = this.storage.getUser<User>();
    if (user) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  /**
   * Get current user synchronously
   */
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated synchronously
   */
  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Login as operator
   */
  loginOperator(credentials: {
    username: string;
    password: string;
  }): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/users/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.token || response.id) {
            this.handleOperatorLoginSuccess(response);
          }
        }),
        catchError((error) => {
          return throwError(() => error);
        }),
      );
  }

  /**
   * Login as tourist
   */
  loginTourist(credentials: {
    username: string;
    password: string;
  }): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/tourists/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.success && response.user) {
            this.handleTouristLoginSuccess(response);
          }
        }),
        catchError((error) => {
          return throwError(() => error);
        }),
      );
  }

  /**
   * Handle successful operator login
   */
  private handleOperatorLoginSuccess(response: LoginResponse): void {
    if (response.token) {
      this.storage.setToken(response.token);
    }
    if (response.id) {
      this.storage.setUid(response.id);
    }
    if (response.user) {
      this.storage.setUser({ ...response.user, role: 'operator' });
      this.currentUserSubject.next({ ...response.user, role: 'operator' });
    } else {
      // Set authenticated even without user object, using available token/id
      this.currentUserSubject.next({ username: '', role: 'operator' });
    }
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Handle successful tourist login
   */
  private handleTouristLoginSuccess(response: LoginResponse): void {
    if (response.user) {
      const user = { ...response.user, role: 'tourist' as const };
      this.storage.setUser(user);
      this.currentUserSubject.next(user);

      if (response.user.tourist_user_id) {
        this.storage.setTouristUserId(response.user.tourist_user_id);
      }
    }
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Register new operator
   */
  registerOperator(userData: RegisterData): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, userData);
  }

  /**
   * Register new tourist
   */
  registerTourist(userData: RegisterData): Observable<any> {
    return this.http.post(`${this.apiUrl}/tourists`, userData);
  }

  /**
   * Reset password
   */
  resetPassword(
    username: string,
    question: string,
    securityAnswer: string,
    newPassword: string,
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/reset-pass`, {
      username,
      question,
      securityAnswer,
      newPassword,
    });
  }

  /**
   * Logout and clear all auth data
   */
  logout(redirectTo = '/role'): void {
    this.storage.clearAuth();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    if (redirectTo) {
      this.router.navigate([redirectTo]);
    }
  }

  /**
   * Get user ID (works for both operator and tourist)
   */
  getUserId(): string | null {
    const user = this.currentUser;
    return (
      user?.id ||
      user?.user_id ||
      user?.tourist_user_id ||
      this.storage.getUid()
    );
  }

  /**
   * Get tourist user ID
   */
  getTouristUserId(): string | null {
    const user = this.currentUser;
    return user?.tourist_user_id || this.storage.getTouristUserId();
  }

  /**
   * Check if current user is an operator
   */
  isOperator(): boolean {
    const role = this.currentUser?.role;
    if (role) return role === 'operator';
    return !!this.storage.getUid() && !this.storage.getTouristUserId();
  }

  /**
   * Check if current user is a tourist
   */
  isTourist(): boolean {
    const role = this.currentUser?.role;
    if (role) return role === 'tourist';
    return !!this.storage.getTouristUserId();
  }
}
