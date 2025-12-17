import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService, ClientLoginDTO } from '../../../shared/services/auth.service';
import { UserLoginDTO } from '../../../models/user.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  clientLoginForm: FormGroup;
  selectedRole: string = '';
  loginMode: 'supplier_courier' | 'client' = 'supplier_courier';
  isLoading: boolean = false;
  hidePassword: boolean = true;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    // Form for Supplier and Courier (email/password)
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });

    // Form for Client (mobile number only)
    this.clientLoginForm = this.fb.group({
      mobileNumber: ['', [Validators.required, Validators.pattern(/^(\+966|0)?5[0-9]{8}$/)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Load saved data
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      this.loginForm.patchValue({ 
        email: savedEmail,
        rememberMe: true 
      });
    }

    const savedMobile = localStorage.getItem('rememberedMobile');
    if (savedMobile) {
      this.clientLoginForm.patchValue({
        mobileNumber: savedMobile,
        rememberMe: true
      });
    }

    // Check for role in query params
    const role = this.route.snapshot.queryParamMap.get('role');
    if (role === 'client' || role === 'customer') {
      this.loginMode = 'client';
    }
  }

  setLoginMode(mode: 'supplier_courier' | 'client'): void {
    this.loginMode = mode;
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (this.loginMode === 'client') {
      this.onClientLogin();
    } else {
      this.onSupplierCourierLogin();
    }
  }

  onSupplierCourierLogin(): void {
    if (this.loginForm.invalid || this.isLoading) {
      this.markFormAsTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const formValue = this.loginForm.value;

    // Save email if remember me is checked
    if (formValue.rememberMe) {
      localStorage.setItem('rememberedEmail', formValue.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    const loginDTO: UserLoginDTO = {
      email: formValue.email,
      password: formValue.password
    };

    // Try supplier login first, then courier
    this.authService.login(loginDTO, 'supplier').subscribe({
      next: (response) => {
        this.handleLoginSuccess('supplier');
      },
      error: (error) => {
        // Try courier login
        this.authService.login(loginDTO, 'courier').subscribe({
          next: (response) => {
            this.handleLoginSuccess('courier');
          },
          error: (courierError) => {
            this.handleLoginError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
          }
        });
      }
    });
  }

  onClientLogin(): void {
    if (this.clientLoginForm.invalid || this.isLoading) {
      this.markFormAsTouched(this.clientLoginForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const formValue = this.clientLoginForm.value;

    // Save mobile if remember me is checked
    if (formValue.rememberMe) {
      localStorage.setItem('rememberedMobile', formValue.mobileNumber);
    } else {
      localStorage.removeItem('rememberedMobile');
    }

    const clientDTO: ClientLoginDTO = {
      mobileNumber: formValue.mobileNumber
    };

    this.authService.loginClient(clientDTO).subscribe({
      next: (response) => {
        this.handleLoginSuccess('customer');
      },
      error: (error) => {
        this.handleLoginError('رقم الجوال غير مسجل في النظام');
      }
    });
  }

  private markFormAsTouched(form: FormGroup): void {
    Object.values(form.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  private handleLoginSuccess(role: string): void {
    this.isLoading = false;
    this.router.navigate([this.authService.getDashboardRoute()]);
  }

  private handleLoginError(message: string): void {
    this.errorMessage = message;
    this.isLoading = false;
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}
