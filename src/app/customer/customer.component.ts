import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-customer-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.css'
})
export class CustomerComponent {
  // Navigation items for Receiver (delivery-focused)
  navItems = [
    { label: 'لوحة التحكم', path: 'dashboard', icon: 'bi-speedometer2' },
    { label: 'شحناتي الواردة', path: 'deliveries', icon: 'bi-box-arrow-in-down' },
    { label: 'تتبع شحنة', path: 'track', icon: 'bi-geo-alt' },
    { label: 'الملف الشخصي', path: 'profile', icon: 'bi-person-circle' },
    { label: 'الدعم', path: 'support', icon: 'bi-headset' }
  ];

  userName: string = '';
  isMobileMenuOpen = false;

  constructor(private auth: AuthService, private router: Router) {
    const user = this.auth.getCurrentUser();
    this.userName = user.userName || user.email?.split('@')[0] || 'المُستلم';
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
