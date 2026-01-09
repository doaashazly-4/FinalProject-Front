import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-courier-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, LucideAngularModule],
  templateUrl: './courier.component.html',
  styleUrl: './courier.component.css'
})
export class CourierComponent {
  // Navigation items for Carrier (delivery-focused)
  navItems = [
    { label: 'لوحة التحكم', path: 'dashboard', icon: 'layout-dashboard' },
    { label: 'المهام المتاحة', path: 'available-jobs', icon: 'search' },
    { label: 'مهامي', path: 'my-jobs', icon: 'list-checks' },
    { label: 'الأرباح', path: 'earnings', icon: 'wallet' },
    { label: 'المحادثات', path: 'chat', icon: 'message-square' },
    { label: 'الملف الشخصي', path: 'profile', icon: 'user' },
    { label: 'الدعم', path: 'headphones' }
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
