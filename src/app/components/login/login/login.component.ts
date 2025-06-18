import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { LoginRequest } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  returnUrl = '/dashboard';
  error = '';
  successMessage = '';
  showPassword = false;
  showDemoCredentials = true;

  private destroy$ = new Subject<void>();

  demoUsers = [
    { email: 'admin@example.com', password: 'admin123', role: 'Admin' },
    { email: 'user@example.com', password: 'user123', role: 'User' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeForm();

    // Get return URL
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.returnUrl]);
    }

    // Show error message if redirected
    const message = this.route.snapshot.queryParams['message'];
    if (message) {
      this.error = decodeURIComponent(message);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.successMessage = '';

    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.loading = true;

    const loginRequest: LoginRequest = {
      email: this.f['email'].value,
      password: this.f['password'].value
    };

    this.authService.login(loginRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.successMessage = 'Login successful! Redirecting...';
          this.loading = false;

          // Store token or user info if needed here
          // this.authService.saveToken(response.token);

          setTimeout(() => {
            this.router.navigate([this.returnUrl]);
          }, 1500);
        },
        error: (error) => {
          this.loading = false;
          console.error('Login error:', error);

          if (error.status === 0) {
            this.error = 'Unable to connect to server. Please ensure the backend is running.';
          } else if ([401, 400].includes(error.status)) {
            this.error = error.error?.message || 'Invalid email or password.';
          } else {
            this.error = error.message || 'An unexpected error occurred. Please try again.';
          }
        }
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  fillDemoCredentials(user: any): void {
    this.loginForm.patchValue({
      email: user.email,
      password: user.password
    });
    this.loginForm.markAsDirty();
  }

  toggleDemoCredentials(): void {
    this.showDemoCredentials = !this.showDemoCredentials;
  }

  hasError(fieldName: string, errorType: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.hasError(errorType) && (field.dirty || field.touched || this.submitted));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && (field.dirty || field.touched || this.submitted)) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `Password must be at least ${field.errors['minlength'].requiredLength} characters long`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      password: 'Password'
    };
    return labels[fieldName] || fieldName;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control.markAsTouched();
      }
    });
  }
}
