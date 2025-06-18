// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse, User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Login API call
   */
  login(loginRequest: LoginRequest): Observable<void> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginRequest).pipe(
      tap(response => {
        this.setUserSession(response);
        this.currentUserSubject.next(response.user);
      }),
      map(() => {}), // transform to void
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Logout user
   */
  logout(redirectToLogin: boolean = true): void {
    this.clearUserSession();
    this.currentUserSubject.next(null);
    if (redirectToLogin) {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Get token
   */
  getToken(): string | null {
    return this.isBrowser() ? localStorage.getItem('token') : null;
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.parseJwt(token);
      const exp = payload.exp * 1000;
      const isValid = Date.now() < exp;

      if (!isValid) this.logout(false);
      return isValid;
    } catch (error) {
      this.logout(false);
      return false;
    }
  }

  /**
   * Get user's role
   */
  getUserRole(): string | null {
    return this.currentUserValue?.role ?? null;
  }

  /**
   * Check if user has the given role
   */
  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole?.toUpperCase() === role.toUpperCase();
  }

  /**
   * Check if the user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * Refresh JWT token
   */
  refreshToken(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, {}).pipe(
      tap(response => {
        if (response.token) {
          this.setUserSession(response);
        }
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Save token and user in localStorage
   */
  private setUserSession(response: LoginResponse): void {
    if (this.isBrowser()) {
      localStorage.setItem('token', response.token);
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    }
  }

  /**
   * Clear session
   */
  private clearUserSession(): void {
    if (this.isBrowser()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  /**
   * Retrieve user from localStorage
   */
  private getUserFromStorage(): User | null {
    if (this.isBrowser()) {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  /**
   * Decode JWT payload
   */
  private parseJwt(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }

  /**
   * Check if running in browser
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Global HTTP error handler
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.message;

      // Auto logout on auth errors
      if ([401, 403].includes(error.status)) {
        this.logout(false);
      }
    }

    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error.error
    }));
  }
}
