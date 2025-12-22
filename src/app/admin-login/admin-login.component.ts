import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../shared/services/auth.service';
import { LoginResponse } from '../models/user.models';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  submit(): void {
    if (this.loginForm.invalid || this.isLoading) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const body = {
      userName: this.loginForm.value.userName,
      password: this.loginForm.value.password
    };

    // Call the admin-specific login endpoint directly (hidden endpoint) using userName/password
    this.http.post<LoginResponse>(`${environment.apiUrl}/Auth/Login/Admin`, body).subscribe({
      next: (response) => {
        if (response && response.token) {
          // Store token and set role using existing AuthService helper
          this.auth.setUserRole('admin', response.token, {
            userId: response.userId,
            userName: response.userName,
            email: response.email
          });
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.errorMessage = 'فشل تسجيل الدخول';
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'فشل تسجيل الدخول';
        this.isLoading = false;
      }
    });
  }
}



