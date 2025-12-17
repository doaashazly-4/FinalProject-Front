import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { SupplierDataService } from './services/supplier-data.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-supplier',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './supplier.component.html',
  styleUrl: './supplier.component.css'
})
export class SupplierComponent implements OnInit {
  // Navigation items for Sender (delivery-focused)
  navItems: NavItem[] = [
    { path: '/supplier/dashboard', label: 'لوحة التحكم', icon: 'bi-grid-1x2-fill' },
    { path: '/supplier/create-shipment', label: 'طلب جديد', icon: 'bi-plus-circle-fill' },
    { path: '/supplier/shipments', label: 'طلباتي', icon: 'bi-box-seam' },
    { path: '/supplier/track', label: 'تتبع الشحنات', icon: 'bi-geo-alt-fill' },
    { path: '/supplier/reports', label: 'التقارير', icon: 'bi-bar-chart-line-fill' },
    { path: '/supplier/settings', label: 'الإعدادات', icon: 'bi-gear-fill' }
  ];

  userName: string = '';
  businessName: string = '';
  pendingCount: number = 0;
  isMobileMenuOpen: boolean = false;

  constructor(
    private auth: AuthService, 
    private router: Router,
    private supplierData: SupplierDataService
  ) {
    const user = this.auth.getCurrentUser();
    this.userName = user.userName || user.email?.split('@')[0] || 'المُرسل';
  }

  ngOnInit(): void {
    this.loadDashboardCounts();
    this.loadProfile();
  }

  loadDashboardCounts(): void {
    this.supplierData.getDashboardData().subscribe({
      next: (data) => {
        this.pendingCount = data.pendingCount + data.readyForPickupCount;
        // Update badge on shipments nav item
        const shipmentsNav = this.navItems.find(item => item.path === '/supplier/shipments');
        if (shipmentsNav) {
          shipmentsNav.badge = this.pendingCount;
        }
      }
    });
  }

  loadProfile(): void {
    this.supplierData.getProfile().subscribe({
      next: (profile) => {
        this.businessName = profile.businessName || '';
      }
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
