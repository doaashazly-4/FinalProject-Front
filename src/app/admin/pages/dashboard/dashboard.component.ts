import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminDataService, AdminOrderRow, AdminStat, SystemReport, PendingCarrier, Dispute } from '../../services/admin-data.service';

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

  constructor(private data: AdminDataService) {}

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
    this.data.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders.slice(0, 5);
      },
      error: (err) => console.error('Error loading orders:', err)
    });

    // Load pending carriers
    this.data.getPendingCarriers().subscribe({
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

    // Load system report
    this.data.getSystemReport('today').subscribe({
      next: (report) => {
        this.systemReport = report;
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
      'جديد': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'قيد المعالجة': 'bg-blue-100 text-blue-800 border-blue-200',
      'قيد التوصيل': 'bg-purple-100 text-purple-800 border-purple-200',
      'مكتمل': 'bg-green-100 text-green-800 border-green-200',
      'ملغي': 'bg-red-100 text-red-800 border-red-200',
      'فشل التوصيل': 'bg-red-100 text-red-800 border-red-200'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getDisputePriorityClass(priority: string): string {
    const classMap: { [key: string]: string } = {
      'low': 'bg-gray-100 text-gray-700',
      'medium': 'bg-blue-100 text-blue-700',
      'high': 'bg-orange-100 text-orange-700',
      'urgent': 'bg-red-100 text-red-700'
    };
    return classMap[priority] || 'bg-gray-100 text-gray-700';
  }

  getDisputePriorityText(priority: string): string {
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
