// src/app/interceptors/auth.interceptor.ts
import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
  HttpStatusCode
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (shouldSkipInterceptor(request, authService)) {
    return next(request);
  }

  const authReq = addAuthHeader(request, authService);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      return handleHttpError(error, request, next, authService, router);
    })
  );
};

// ✅ Skip for auth endpoints or no token
function shouldSkipInterceptor(
  request: HttpRequest<unknown>,
  authService: AuthService
): boolean {
  const authRoutes = ['/auth/', '/refresh-token'];
  return authRoutes.some(route => request.url.includes(route)) ||
         !authService.getToken();
}

// ✅ Clone with Authorization header (only if not already set)
function addAuthHeader(
  request: HttpRequest<unknown>,
  authService: AuthService
): HttpRequest<unknown> {
  const headers = request.headers.has('Authorization')
    ? request.headers
    : request.headers.set('Authorization', `Bearer ${authService.getToken()}`);

  const contentTypeHeader = headers.has('Content-Type')
    ? headers
    : headers.set('Content-Type', 'application/json');

  return request.clone({ headers: contentTypeHeader });
}

// ✅ Main error handler
function handleHttpError(
  error: HttpErrorResponse,
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<HttpEvent<unknown>> {
  switch (error.status) {
    case HttpStatusCode.Unauthorized:
      return handleUnauthorizedError(request, next, authService, router);
    case HttpStatusCode.Forbidden:
      return handleForbiddenError(router);
    default:
      console.error('Unhandled HTTP error:', error);
      return throwError(() => error);
  }
}

// ✅ Handle 401: Try refresh or logout
function handleUnauthorizedError(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<HttpEvent<unknown>> {
  const refreshToken$ = authService.refreshToken();

  if (!refreshToken$) {
    forceLogout(authService, router);
    return throwError(() => new Error('No refresh token available.'));
  }

  return refreshToken$.pipe(
    switchMap(() => {
      const newRequest = addAuthHeader(request, authService);
      return next(newRequest);
    }),
    catchError(refreshError => {
      console.error('Token refresh failed:', refreshError);
      forceLogout(authService, router);
      return throwError(() => refreshError);
    })
  );
}

// ✅ Handle 403: redirect with message
function handleForbiddenError(
  router: Router
): Observable<never> {
  router.navigate(['/dashboard'], {
    queryParams: { message: 'Access denied. Insufficient permissions.' }
  });
  return throwError(() => new Error('Forbidden'));
}

// ✅ Force logout and redirect to login
function forceLogout(
  authService: AuthService,
  router: Router
): void {
  authService.logout();
  router.navigate(['/login'], {
    queryParams: {
      returnUrl: router.url,
      message: 'Session expired. Please login again.'
    },
    replaceUrl: true
  });
}
