import { Component, OnInit } from '@angular/core';
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
export class AdminLoginComponent implements OnInit {
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

  ngOnInit(): void {
    // تحقق من وجود توكن وصلاحية الادمن عند تحميل الصفحة
    const token = localStorage.getItem('pickgo_token');
    const role = localStorage.getItem('pickgo_role');
    const expiration = localStorage.getItem('token_expiration');

    // If user already has valid admin token, redirect to dashboard immediately
    if (token && role === 'admin' && expiration && new Date(expiration) > new Date()) {
      this.router.navigate(['/admin/dashboard']); // دخول مباشر للداشبورد
    }
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

    // استدعاء endpoint تسجيل الدخول للادمن مباشرة
    this.http.post<LoginResponse>(`${environment.apiUrl}/Auth/Login/Admin`, body).subscribe({
      next: (response) => {
        if (response && response.token) {
          // تخزين التوكن وتعيين الدور باستخدام AuthService
          this.auth.setUserRole('admin', response.token, {
            userId: response.userId,
            userName: response.userName,
            email: response.email
          });
          this.router.navigate(['/admin/dashboard']); // توجيه مباشرة للداشبورد
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
