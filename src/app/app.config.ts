// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { 
  provideHttpClient, 
  withInterceptors,
  withInterceptorsFromDi,
  withJsonpSupport,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Angular module providers
    importProvidersFrom(
      BrowserModule,
      BrowserAnimationsModule,
      ReactiveFormsModule
    ),
    
    // Router configuration
    provideRouter(
      routes,
      withComponentInputBinding()
    ),
    
    // HTTP client configuration
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorInterceptor,
        loadingInterceptor
      ]),
      withInterceptorsFromDi(),
      withJsonpSupport()
    )
  ]
};

// Error Interceptor Implementation
function errorInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const router = inject(Router);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';
      
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        errorMessage = error.error?.message || error.message;
        
        // Handle specific status codes
        switch (error.status) {
          case 401: // Unauthorized
            router.navigate(['/login'], { 
              queryParams: { message: 'Session expired. Please login again.' }
            });
            break;
          case 403: // Forbidden
            router.navigate(['/'], { 
              queryParams: { message: 'Access denied. Insufficient permissions.' }
            });
            break;
          case 404: // Not Found
            router.navigate(['/not-found']);
            break;
          case 500: // Server Error
            router.navigate(['/server-error']);
            break;
        }
      }
      
      return throwError(() => new Error(errorMessage));
    })
  );
}

// Loading Interceptor Implementation
function loadingInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  // In a real app, you would inject a loading service here
  // const loadingService = inject(LoadingService);
  
  // loadingService.show();
  
  return next(req).pipe(
    // finalize(() => loadingService.hide())
  );
}