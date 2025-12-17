import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-courier-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './courier.component.html',
  styleUrl: './courier.component.css'
})
export class CourierComponent {
  // Navigation items for Carrier (delivery-focused)
  navItems = [
    { label: 'لوحة التحكم', path: 'dashboard', icon: 'bi-speedometer2' },
    { label: 'المهام المتاحة', path: 'available-jobs', icon: 'bi-box-seam' },
    { label: 'مهامي', path: 'my-jobs', icon: 'bi-list-check' },
    { label: 'الأرباح', path: 'earnings', icon: 'bi-cash-stack' },
    { label: 'الملف الشخصي', path: 'profile', icon: 'bi-person-badge' },
    { label: 'الدعم', path: 'support', icon: 'bi-headset' }
  ];

  userName: string = '';
  isMobileMenuOpen = false;

  constructor(private auth: AuthService, private router: Router) {
    const user = this.auth.getCurrentUser();
    this.userName = user.userName || user.email?.split('@')[0] || 'المندوب';
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/home']);
  }
}
