// src/app/guards/auth.guard.ts
import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
// import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        // Check if user is logged in
        if (!user || !this.authService.isLoggedIn()) {
          this.router.navigate(['/login'], { 
            queryParams: { 
              returnUrl: state.url,
              message: 'Please login to access this page.'
            }
          });
          return false;
        }

        // Check route role requirements
        const requiredRoles = route.data['roles'] as string[];
        if (requiredRoles && requiredRoles.length > 0) {
          const hasRequiredRole = requiredRoles.some(role => 
            this.authService.hasRole(role)
          );
          
          if (!hasRequiredRole) {
            this.router.navigate(['/dashboard'], { 
              queryParams: { 
                message: 'Access denied. Insufficient permissions.'
              }
            });
            return false;
          }
        }

        return true;
      })
    );
  }
}

// Export the guard function directly
export const authGuard: CanActivateFn = (route, state) => {
  return inject(AuthGuard).canActivate(route, state);
};