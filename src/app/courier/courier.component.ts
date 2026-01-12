import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { NotificationHubService } from '../shared/services/notification-hub.service';
import { ToastNotificationsComponent } from '../shared/components/toast-notifications/toast-notifications.component';
import { NotificationService } from '../shared/services/notification.service';

@Component({
  selector: 'app-courier-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ToastNotificationsComponent
  ],
  templateUrl: './courier.component.html',
  styleUrl: './courier.component.css'
})
export class CourierComponent implements OnInit {

  // Navigation items for Carrier (delivery-focused)
  navItems = [
    { label: 'لوحة التحكم', path: 'dashboard', icon: 'bi-speedometer2' },
    { label: 'المهام المتاحة', path: 'available-jobs', icon: 'bi-box-seam' },
    { label: 'مهامي', path: 'my-jobs', icon: 'bi-list-check' },
    { label: 'الأرباح', path: 'earnings', icon: 'bi-cash-stack' },
    { label: 'المحادثات', path: 'chat', icon: 'bi-whatsapp' },
    { label: 'الملف الشخصي', path: 'profile', icon: 'bi-person-badge' },
    { label: 'الدعم', path: 'support', icon: 'bi-headset' }
  ];

  userName: string = '';
  isMobileMenuOpen = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private notificationHubService: NotificationHubService,
    private notificationService: NotificationService
  ) {
    const user = this.auth.getCurrentUser();
    this.userName = user.userName || user.email?.split('@')[0] || 'المندوب';
  }

  ngOnInit(): void {
    // 1️⃣ Start SignalR connection
    this.notificationHubService.startConnection();

    // 2️⃣ Listen to new request notifications
    this.notificationHubService.onNewRequest((data: any) => {
      console.log('🐆 New request received:', data);

      this.notificationService.showNotification({
        title: 'طلب جديد 🐆',
        message: `تم إنشاء طلب جديد رقم #${data.requestId}`,
        type: 'info',
        icon: 'bi-box-seam',
        duration: 6000
      });
    });
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
