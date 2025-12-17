import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './role-selection.component.html',
  styleUrls: ['./role-selection.component.css']
})
export class RoleSelectionComponent implements OnInit {
  selectedRole: string = '';
  
  constructor(private router: Router) {}

  ngOnInit(): void {}

  selectRole(roleId: string): void {
    this.selectedRole = roleId;
  }

  goToRegister(): void {
    if (this.selectedRole && this.selectedRole !== 'client') {
      this.router.navigate(['/register'], { 
        queryParams: { role: this.selectedRole } 
      });
    }
  }

  goToLogin(): void {
    if (this.selectedRole === 'client' || this.selectedRole === 'customer') {
      // Redirect to OTP login for customers
      this.router.navigate(['/customer-otp-login']);
    } else if (this.selectedRole) {
      this.router.navigate(['/login'], { 
        queryParams: { role: this.selectedRole } 
      });
    }
  }

  getRoleTitleArabic(): string {
    switch (this.selectedRole) {
      case 'client':
        return 'عميل';
      case 'supplier':
        return 'مُرسل';
      case 'courier':
        return 'مندوب توصيل';
      default:
        return '';
    }
  }
}
