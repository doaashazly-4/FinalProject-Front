import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminDataService, AdminStat, SystemReport, PendingCarrier, Dispute } from '../../services/admin-data.service';
import { AdminOrderService, AdminOrderRow } from '../../services/admin-order.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  stats: AdminStat[] = [];
  orders: AdminOrderRow[] = [];
  pendingCarriers: PendingCarrier[] = [];
  recentDisputes: Dispute[] = [];
  systemReport: SystemReport | null = null;
  isLoading = true;
  today = new Date();

  constructor(private data: AdminDataService, private orderService: AdminOrderService) { }


  mapOrderStatusToAr(status: string): 'جديد' | 'قيد المعالجة' | 'قيد التوصيل' | 'مكتمل' | 'ملغي' | 'فشل التوصيل' {
    switch (status) {
      case 'Pending': return 'جديد';
      case 'Assigned': return 'قيد المعالجة';
      case 'PickupInProgress': return 'قيد التوصيل';
      case 'Delivered': return 'مكتمل';
      case 'Cancelled': return 'ملغي';
      default: return 'فشل التوصيل';
    }
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    // Load stats
    this.data.getStats().subscribe({
      next: (stats) => {
        this.stats = stats.slice(0, 4); // Get first 4 stats
      },
      error: (err) => console.error('Error loading stats:', err)
    });

    // Load orders
    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders.slice(0, 5);
      },
      error: (err) => console.error('Error loading orders:', err)
    });

    // Load pending carriers
    this.data.getPendingCouriers().subscribe({
      next: (carriers) => {
        this.pendingCarriers = carriers.slice(0, 3);
      },
      error: (err) => console.error('Error loading carriers:', err)
    });

    // Load recent disputes
    this.data.getDisputes().subscribe({
      next: (disputes) => {
        this.recentDisputes = disputes.filter(d => d.status !== 'resolved').slice(0, 3);
      },
      error: (err) => console.error('Error loading disputes:', err)
    });

    // Load system report (Fall back to mapping from stats if reports/system is missing)
    this.data.getDashboardStats().subscribe({
      next: (stats) => {
        // Create a basic report from stats for UI compatibility
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading report:', err);
        this.isLoading = false;
      }
    });
  }

  getStatIconBg(index: number): string {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-emerald-500 to-emerald-600',
      'from-orange-500 to-orange-600',
      'from-amber-500 to-amber-600'
    ];
    return colors[index % colors.length];
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Assigned': 'bg-blue-100 text-blue-800 border-blue-200',
      'Accepted': 'bg-purple-100 text-purple-800 border-purple-200',
      'PickupInProgress': 'bg-blue-100 text-blue-800 border-blue-200',
      'Delivered': 'bg-green-100 text-green-800 border-green-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getDisputePriorityClass(priority: string | undefined): string {
    if (!priority) return 'bg-gray-100 text-gray-700';
    const classMap: { [key: string]: string } = {
      'low': 'bg-gray-100 text-gray-700',
      'medium': 'bg-blue-100 text-blue-700',
      'high': 'bg-orange-100 text-orange-700',
      'urgent': 'bg-red-100 text-red-700'
    };
    return classMap[priority] || 'bg-gray-100 text-gray-700';
  }

  getDisputePriorityText(priority: string | undefined): string {
    if (!priority) return 'عادي';
    const texts: { [key: string]: string } = {
      'low': 'منخفضة',
      'medium': 'متوسطة',
      'high': 'عالية',
      'urgent': 'عاجلة'
    };
    return texts[priority] || priority;
  }

  getDisputeTypeText(type: string): string {
    const texts: { [key: string]: string } = {
      'not_delivered': 'لم يتم التسليم',
      'damaged': 'تلف المنتج',
      'wrong_item': 'منتج خاطئ',
      'late_delivery': 'تأخر التوصيل',
      'other': 'أخرى'
    };
    return texts[type] || type;
  }

  getVehicleTypeText(type: string): string {
    const texts: { [key: string]: string } = {
      'Motorcycle': 'دراجة نارية',
      'Car': 'سيارة',
      'Truck': 'شاحنة',
      'Van': 'فان'
    };
    return texts[type] || type;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
