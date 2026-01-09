import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-customer-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, LucideAngularModule],
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.css'
})
export class CustomerComponent {
  // Navigation items for Receiver (delivery-focused)
  navItems = [
    { label: 'لوحة التحكم', path: 'dashboard', icon: 'layout-dashboard' },
    { label: 'شحناتي الواردة', path: 'deliveries', icon: 'package' },
    { label: 'تتبع شحنة', path: 'track', icon: 'map-pin' },
    { label: 'المحادثات', path: 'message-square' },
    { label: 'الملف الشخصي', path: 'profile', icon: 'user' },
    { label: 'الدعم', path: 'support', icon: 'headphones' }
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
