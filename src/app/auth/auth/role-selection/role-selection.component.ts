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
  showCombinedDropdown = false;
  
  constructor(private router: Router) {}

  ngOnInit(): void {}

  selectRole(roleId: string): void {
    this.selectedRole = roleId;
  }

  goToRegister(): void {
    // Registration is available for supplier and courier
    // Navigate to register page - it will default to supplier if no role is provided
    this.router.navigate(['/register']);
  }

  goToLogin(): void {
    if (!this.selectedRole) return;
    if (this.selectedRole === 'customer' || this.selectedRole === 'client') {
      this.router.navigate(['/customer/otp-login']);
      return;
    }
    this.router.navigate(['/login'], { queryParams: { role: this.selectedRole } });
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

  toggleCombinedDropdown(): void {
    this.showCombinedDropdown = !this.showCombinedDropdown;
  }

  navigateToRoleLogin(role: string): void {
    // Close dropdown and navigate to login with role query param
    this.showCombinedDropdown = false;
    if (role === 'customer' || role === 'client') {
      this.router.navigate(['/customer/otp-login']);
      return;
    }
    this.router.navigate(['/login'], { queryParams: { role } });
  }
}
