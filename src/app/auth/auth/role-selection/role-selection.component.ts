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
    if (this.selectedRole) {
      // Registration only available for supplier/courier via role selection
      this.router.navigate(['/register'], { 
        queryParams: { role: this.selectedRole } 
      });
    }
  }

  goToLogin(): void {
    if (!this.selectedRole) return;
    if (this.selectedRole === 'customer') {
      this.router.navigate(['/customer-otp-login']);
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
    if (role === 'customer') {
      this.router.navigate(['/customer-otp-login']);
      return;
    }
    this.router.navigate(['/login'], { queryParams: { role } });
  }
}
