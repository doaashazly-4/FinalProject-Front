import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  form = { email: '', password: '' };
  showPassword = false;
  rememberMe = false;
  isSubmitting = false;

  constructor(private router: Router, private auth: AuthService) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (!this.form.email || !this.form.password) {
      this.showError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    this.isSubmitting = true;
    
    // Simulate API call
    setTimeout(() => {
      const role = this.auth.loginWithCredentials(this.form.email, this.form.password);
      this.isSubmitting = false;
      if (!role) {
        this.showError('بيانات الدخول غير صحيحة. استخدم الحسابات التجريبية أو تحقق من البريد/الرقم السري.');
        return;
      }
      this.showSuccess('تم تسجيل الدخول بنجاح!');
      
      // Redirect to home after login
      setTimeout(() => {
        const target = this.auth.getDashboardRoute() ?? '/home';
        this.router.navigate([target]);
      }, 800);
    }, 1000);
  }

  fillDemo(role: 'customer' | 'courier' | 'admin') {
    if (role === 'customer') {
      this.form.email = 'customer@test.com';
      this.form.password = '123456';
    } else if (role === 'courier') {
      this.form.email = 'courier@test.com';
      this.form.password = '123456';
    } else {
      this.form.email = 'admin@test.com';
      this.form.password = '123456';
    }
  }

  showError(message: string) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      errorDiv.classList.remove('show');
      setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
  }

  showSuccess(message: string) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-notification';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      successDiv.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      successDiv.classList.remove('show');
      setTimeout(() => successDiv.remove(), 300);
    }, 2000);
  }
}
