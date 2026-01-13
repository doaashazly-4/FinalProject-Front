import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { ChatService } from '../shared/services/chat.service';

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
    { label: 'Dashboard', path: 'dashboard', icon: 'bi-speedometer2' },
    { label: 'Available Jobs', path: 'available-jobs', icon: 'bi-box-seam' },
    { label: 'My Jobs', path: 'my-jobs', icon: 'bi-list-check' },
    { label: 'Earnings', path: 'earnings', icon: 'bi-cash-stack' },
    { label: 'Chats', path: 'chat', icon: 'bi-whatsapp' },
    { label: 'Profile', path: 'profile', icon: 'bi-person-badge' },
    { label: 'Support', path: 'support', icon: 'bi-headset' }
  ];

  userName: string = '';
  isMobileMenuOpen = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private chatService: ChatService
  ) {
    const user = this.auth.getCurrentUser();
    this.userName = user.userName || user.email?.split('@')[0] || 'Courier';
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

  openSupportChat(): void {
    this.chatService.triggerChat('admin_support_id', 'Lynx Support');
  }
}
