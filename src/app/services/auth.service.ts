import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';

export type UserRoleName =
  | 'superadmin'
  | 'operator_admin'
  | 'operator_staff'
  | 'tourist'
  | 'association';

export const VALID_ROLES: readonly UserRoleName[] = [
  'superadmin',
  'operator_admin',
  'operator_staff',
  'tourist',
  'association',
] as const;

export interface Role {
  id?: number | string;
  name: UserRoleName | string;
}

export interface User {
  id?: string;
  unified_user_id?: string;
  user_id?: string;
  tourist_user_id?: string;
  association_user_id?: string;
  legacy_user_id?: string;
  user_type?: UserRoleName | string;
  username: string;
  name?: string;
  full_name?: string;
  email?: string;
  association_id?: string | number;
  company_id?: string | number;
  contact_no?: string;
  nationality?: string;
  role?: Role | UserRoleName | string;
  permissions?: string[];
}

export interface LoginData {
  token: string;
  user: User;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: LoginData;
}

interface MeResponse {
  success: boolean;
  message?: string;
  data?: {
    user?: User;
  };
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
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    const token = this.storage.getToken();
    const user = this.storage.getUser<User>();

    if (token && user) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }

    if (token) {
      this.refreshSession().subscribe({
        error: () => {
          this.clearSessionState();
        },
      });
    } else {
      if (user) {
        this.clearSessionState();
        return;
      }

      this.isAuthenticatedSubject.next(false);
    }
  }

  private getRoleName(user?: User | null): string | null {
    if (!user?.role) return null;
    if (typeof user.role === 'string') return user.role;
    return user.role.name || null;
  }

  private normalizeUser(user: User): User {
    const roleName = this.getRoleName(user);
    const isOperator =
      roleName === 'superadmin' ||
      roleName === 'operator_admin' ||
      roleName === 'operator_staff';
    const roleObj: Role | undefined = roleName
      ? {
          id: typeof user.role === 'object' ? user.role.id : undefined,
          name: roleName,
        }
      : undefined;

    const normalizedIdRaw = isOperator
      ? user.id || user.unified_user_id || user.user_id
      : user.id || user.unified_user_id || user.user_id || user.legacy_user_id;
    const normalizedId =
      normalizedIdRaw !== undefined && normalizedIdRaw !== null
        ? String(normalizedIdRaw)
        : undefined;

    const legacyIdRaw = isOperator
      ? undefined
      : user.legacy_user_id || user.user_id || normalizedId;
    const legacyId =
      legacyIdRaw !== undefined && legacyIdRaw !== null
        ? String(legacyIdRaw)
        : undefined;

    const normalized: User = {
      ...user,
      id: normalizedId,
      unified_user_id: normalizedId,
      legacy_user_id: isOperator ? undefined : legacyId,
      full_name: user.full_name || user.name || user.username,
      role: roleObj,
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
    };

    if (isOperator && normalizedId) {
      normalized.user_id = normalizedId;
    }

    if (roleName === 'tourist' && legacyId) {
      normalized.tourist_user_id = legacyId;
    }

    if (roleName === 'association' && legacyId) {
      normalized.association_user_id = legacyId;
    }

    return normalized;
  }

  private persistSession(token: string, user: User): void {
    const normalizedUser = this.normalizeUser(user);
    const roleName = this.getRoleName(normalizedUser);
    const legacyId = normalizedUser.legacy_user_id;
    const unifiedId = normalizedUser.id || normalizedUser.unified_user_id;

    const isOperator =
      roleName === 'superadmin' ||
      roleName === 'operator_admin' ||
      roleName === 'operator_staff';

    this.storage.setToken(token);
    this.storage.setUser(normalizedUser);
    this.storage.remove('association_user');
    this.storage.remove('association_user_id');
    this.storage.remove('uid');
    this.storage.remove('tourist_user_id');

    if (isOperator && unifiedId) {
      this.storage.setUid(unifiedId);
    }

    if (roleName === 'tourist' && legacyId) {
      this.storage.setTouristUserId(legacyId);
    }

    if (roleName === 'association' && legacyId) {
      this.storage.set('association_user', normalizedUser);
      this.storage.set('association_user_id', legacyId);
    }

    this.currentUserSubject.next(normalizedUser);
    this.isAuthenticatedSubject.next(true);
  }

  private clearSessionState(): void {
    this.storage.clearAuth();
    this.storage.remove('association_user');
    this.storage.remove('association_user_id');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  login(credentials: {
    username: string;
    password: string;
  }): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, {
        identifier: credentials.username,
        username: credentials.username,
        password: credentials.password,
      })
      .pipe(
        tap((response) => {
          if (response.success && response.data?.token && response.data?.user) {
            this.persistSession(response.data.token, response.data.user);
          }
        }),
        catchError((error) => throwError(() => error)),
      );
  }

  refreshSession(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiUrl}/auth/me`).pipe(
      tap((response) => {
        if (!response.success || !response.data?.user) {
          return;
        }

        const token = this.storage.getToken();
        if (!token) {
          return;
        }

        const storedUser = this.storage.getUser<User>();
        const mergedUser = {
          ...(storedUser || {}),
          ...response.data.user,
          permissions:
            response.data.user.permissions || storedUser?.permissions || [],
        } as User;

        this.persistSession(token, mergedUser);
      }),
      catchError((error) => throwError(() => error)),
    );
  }

  /**
   * Merge profile payloads (for example from /users/:id) into the current
   * authenticated user without dropping role/permission claims used by guards.
   */
  syncUserProfile(profile: Partial<User> | null | undefined): void {
    if (!profile) {
      return;
    }

    const currentUser =
      this.currentUser || this.storage.getUser<User>() || null;

    const mergedUser = {
      ...(currentUser || {}),
      ...profile,
      role: profile.role || currentUser?.role,
      user_type: profile.user_type || currentUser?.user_type,
      permissions: Array.isArray(profile.permissions)
        ? profile.permissions
        : currentUser?.permissions || [],
      username: profile.username || currentUser?.username || '',
    } as User;

    const token = this.storage.getToken();
    if (!token) {
      return;
    }

    this.persistSession(token, mergedUser);
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
   * Logout and clear all auth data
   */
  logout(redirectTo = '/login'): void {
    this.clearSessionState();

    if (redirectTo) {
      this.router.navigate([redirectTo]);
    }
  }

  /**
   * Get current user's canonical ID.
   */
  getUserId(): string | null {
    const user = this.currentUser;
    return user?.id || user?.unified_user_id || this.storage.getUid();
  }

  /**
   * Get tourist user ID
   */
  getTouristUserId(): string | null {
    const user = this.currentUser;
    return user?.tourist_user_id || this.storage.getTouristUserId();
  }

  /**
   * Get current user role with legacy fallback support.
   */
  getCurrentRole(): UserRoleName | null {
    const role = this.getRoleName(this.currentUser);
    return VALID_ROLES.includes(role as UserRoleName)
      ? (role as UserRoleName)
      : null;
  }
}
