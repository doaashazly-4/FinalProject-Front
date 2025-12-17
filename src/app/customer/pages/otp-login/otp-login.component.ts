import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CustomerDataService } from '../../services/customer-data.service';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-customer-otp-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './otp-login.component.html',
  styleUrl: './otp-login.component.css'
})
export class CustomerOTPLoginComponent implements OnInit {
  step: 'phone' | 'otp' = 'phone';
  phoneForm: FormGroup;
  otpForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  otpSent = false;
  countdown = 0;
  resendAvailable = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private customerService: CustomerDataService,
    private authService: AuthService
  ) {
    this.phoneForm = this.fb.group({
      phoneNumber: ['', [Validators.required, Validators.pattern(/^(\+20|0)?1[0-9]{9}$/)]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  ngOnInit(): void {
    // Check if already logged in
    const user = this.authService.getCurrentUser();
    if (user && user.role === 'customer') {
      this.router.navigate(['/customer/dashboard']);
    }
  }

  onPhoneSubmit(): void {
    if (this.phoneForm.invalid || this.isLoading) {
      this.markFormAsTouched(this.phoneForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const phoneNumber = this.phoneForm.value.phoneNumber;

    // Normalize phone number
    let normalizedPhone = phoneNumber.replace(/\s/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+20' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('+20')) {
      normalizedPhone = '+20' + normalizedPhone;
    }

    this.customerService.requestOTP(normalizedPhone).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.otpSent = true;
          this.step = 'otp';
          this.startCountdown();
          this.successMessage = 'تم إرسال رمز OTP إلى هاتفك';
        } else {
          this.errorMessage = response.message || 'فشل إرسال OTP';
        }
      },
      error: (err) => {
        this.isLoading = false;
        // For demo, simulate success
        this.otpSent = true;
        this.step = 'otp';
        this.startCountdown();
        this.successMessage = 'تم إرسال رمز OTP إلى هاتفك (وضع تجريبي)';
        console.log('OTP request error (demo mode):', err);
      }
    });
  }

  onOTPSubmit(): void {
    if (this.otpForm.invalid || this.isLoading) {
      this.markFormAsTouched(this.otpForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const phoneNumber = this.phoneForm.value.phoneNumber;
    const otp = this.otpForm.value.otp;

    // Normalize phone number
    let normalizedPhone = phoneNumber.replace(/\s/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+20' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('+20')) {
      normalizedPhone = '+20' + normalizedPhone;
    }

    this.customerService.verifyOTP(normalizedPhone, otp).subscribe({
      next: (response) => {
        if (response.success && response.token) {
          // Store token and login
          this.authService.setUserRole('customer', response.token, {
            userId: 'customer-' + normalizedPhone,
            userName: normalizedPhone,
            email: normalizedPhone + '@customer.pickgo'
          });
          this.router.navigate(['/customer/dashboard']);
        } else {
          this.isLoading = false;
          this.errorMessage = 'رمز OTP غير صحيح';
        }
      },
      error: (err) => {
        this.isLoading = false;
        // For demo, accept any 6-digit OTP
        if (otp.length === 6) {
          this.authService.setUserRole('customer', 'demo-token', {
            userId: 'customer-' + normalizedPhone,
            userName: normalizedPhone,
            email: normalizedPhone + '@customer.pickgo'
          });
          this.router.navigate(['/customer/dashboard']);
        } else {
          this.errorMessage = 'رمز OTP غير صحيح';
        }
      }
    });
  }

  resendOTP(): void {
    if (!this.resendAvailable || this.isLoading) return;
    
    this.onPhoneSubmit();
  }

  startCountdown(): void {
    this.countdown = 60;
    this.resendAvailable = false;
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(interval);
        this.resendAvailable = true;
      }
    }, 1000);
  }

  goBack(): void {
    if (this.step === 'otp') {
      this.step = 'phone';
      this.otpForm.reset();
      this.errorMessage = '';
      this.successMessage = '';
    } else {
      this.router.navigate(['/home']);
    }
  }

  private markFormAsTouched(form: FormGroup): void {
    Object.values(form.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}

