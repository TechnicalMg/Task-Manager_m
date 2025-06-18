// src/app/app.routes.ts
import { Routes } from '@angular/router';
// import { LoginComponent } from './components/login/login.component';
// import { DashboardComponent } from './components/dashboard/dashboard.component';
// import { UserManagementComponent } from './components/user-management/user-management.component';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard/dashboard.component';
import { UserManagementComponent } from './components/user-management/user-management/user-management.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'user-management', 
    component: UserManagementComponent, 
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  { path: '**', redirectTo: '/login' }
];