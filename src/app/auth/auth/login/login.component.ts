import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService, ClientLoginDTO } from '../../../shared/services/auth.service';
import { UserLoginDTO } from '../../../models/user.models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
  selectedSubRole: 'supplier' | 'courier' | null = null;
  isLoading: boolean = false;
  hidePassword: boolean = true;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {
    // Form for Supplier and Courier (userName/password)
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
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
    const savedUserName = localStorage.getItem('rememberedUserName');
    if (savedUserName) {
      this.loginForm.patchValue({
        userName: savedUserName,
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
      return;
    }
    if (role === 'supplier' || role === 'courier') {
      this.loginMode = 'supplier_courier';
      this.selectedSubRole = role as 'supplier' | 'courier';
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

    // Save userName if remember me is checked
    if (formValue.rememberMe) {
      localStorage.setItem('rememberedUserName', formValue.userName);
    } else {
      localStorage.removeItem('rememberedUserName');
    }

    const loginDTO: UserLoginDTO = {
      userName: formValue.userName,
      password: formValue.password
    };

    // If a sub-role (supplier or courier) was chosen, try only that role.
    if (this.selectedSubRole) {
      this.authService.login(loginDTO, this.selectedSubRole).subscribe({
        next: () => this.handleLoginSuccess(this.selectedSubRole!),
        error: () => this.handleLoginError('اسم المستخدم أو كلمة المرور غير صحيحة')
      });
      return;
    }

    // No selected sub-role: try supplier first, then courier (existing behavior)
    this.authService.login(loginDTO, 'supplier').subscribe({
      next: () => {
        this.handleLoginSuccess('supplier');
      },
      error: () => {
        // Try courier login
        this.authService.login(loginDTO, 'courier').subscribe({
          next: () => {
            this.handleLoginSuccess('courier');
          },
          error: () => {
            this.handleLoginError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
          }
        });
      }
    });
  }

  onOtpLogin(): void {


  }


  onClientLogin(): void {
    if (this.clientLoginForm.invalid) {
      this.markFormAsTouched(this.clientLoginForm);
      return;
    }

    const mobile = this.clientLoginForm.value.mobileNumber;

    // Remember mobile
    if (this.clientLoginForm.value.rememberMe) {
      localStorage.setItem('rememberedMobile', mobile);
    }

    // 🔹 Call EXISTING backend endpoint
    this.isLoading = true;
    this.http.post<any>(`${environment.apiUrl}/Customer/join`, {
      PhoneNumber: mobile
    }).subscribe({
      next: (res) => {

        console.log(res);
        // Expected: { customerId, ... }
        localStorage.setItem('customer_id', res.userId);
        localStorage.setItem('customer_mobile', mobile);

        this.router.navigate(['/customer/dashboard']);
        this.isLoading = false;
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  onCourierLogin(): void {
    if (this.clientLoginForm.invalid) {
      this.markFormAsTouched(this.clientLoginForm);
      return;
    }

    const mobile = this.clientLoginForm.value.mobileNumber;

    // Remember mobile
    if (this.clientLoginForm.value.rememberMe) {
      localStorage.setItem('rememberedMobile', mobile);
    }

    // 🔹 Call EXISTING backend endpoint
    this.isLoading = true;
    this.http.post<any>(`${environment.apiUrl}/Customer/join`, {
      mobileNumber: mobile
    }).subscribe({
      next: (res) => {
        // Expected: { customerId, ... }
        localStorage.setItem('customer_id', res.customerId);
        localStorage.setItem('customer_mobile', mobile);

        this.router.navigate(['/customer/dashboard']);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'تعذر تسجيل العميل';
        this.isLoading = false;
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
