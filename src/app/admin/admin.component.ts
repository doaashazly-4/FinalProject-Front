import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { AdminDataService, PendingCarrier, Dispute } from './services/admin-data.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  navItems = [
    { label: 'لوحة التحكم', path: 'dashboard', icon: 'bi-speedometer2', badge: false },
    { label: 'موافقات المناديب', path: 'carrier-approvals', icon: 'bi-person-check', badge: true },
    { label: 'المستخدمون', path: 'users', icon: 'bi-people', badge: false },
    { label: 'الشحنات', path: 'orders', icon: 'bi-box-seam', badge: false },
    { label: 'النزاعات', path: 'disputes', icon: 'bi-exclamation-triangle', badge: true },
    { label: 'التقارير', path: 'reports', icon: 'bi-bar-chart-line', badge: false },
    { label: 'الإعدادات', path: 'settings', icon: 'bi-gear', badge: false }
  ];

  userName: string = '';
  isMobileMenuOpen = false;
  
  // Badge counts
  pendingCarriersCount = 0;
  openDisputesCount = 0;

  constructor(
    private auth: AuthService, 
    private router: Router,
    private adminData: AdminDataService
  ) {
    const user = this.auth.getCurrentUser();
    this.userName = user.userName || user.email?.split('@')[0] || 'المدير';
  }

  ngOnInit(): void {
    this.loadBadgeCounts();
  }

  loadBadgeCounts(): void {
    // Load pending carriers count
    this.adminData.getPendingCarriers().subscribe({
      next: (carriers: PendingCarrier[]) => {
        this.pendingCarriersCount = carriers.length;
      },
      error: () => {
        this.pendingCarriersCount = 0;
      }
    });

    // Load open disputes count (pending + in_review statuses)
    this.adminData.getDisputes().subscribe({
      next: (disputes: Dispute[]) => {
        this.openDisputesCount = disputes.filter(d => d.status === 'pending' || d.status === 'in_review').length;
      },
      error: () => {
        this.openDisputesCount = 0;
      }
    });
  }

  get pendingCount(): number {
    return this.pendingCarriersCount + this.openDisputesCount;
  }

  getBadgeCount(path: string): number {
    switch (path) {
      case 'carrier-approvals':
        return this.pendingCarriersCount;
      case 'disputes':
        return this.openDisputesCount;
      default:
        return 0;
    }
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
