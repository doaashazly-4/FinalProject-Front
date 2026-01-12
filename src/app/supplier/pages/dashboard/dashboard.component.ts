import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupplierDataService, Parcel, SenderStat, SenderDashboardData } from '../../services/supplier-data.service';



@Component({
  selector: 'app-supplier-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class SupplierDashboardComponent implements OnInit {
  stats: SenderStat[] = [];
  recentParcels: Parcel[] = [];
  pendingParcels: Parcel[] = [];

  get displayParcels(): Parcel[] {
    return this.recentParcels;
  }
  dashboardData: SenderDashboardData | null = null;
  isLoading = true;
  showAllParcels = false;
  today = new Date();

  constructor(
    private dataService: SupplierDataService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    // Load both dashboard summary and pending parcels
    this.dataService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.stats = data.stats;
        this.recentParcels = data.recentParcels;

        // If pendingParcels haven't loaded yet, we'll wait for the other call
        // but we can already show the dashboard
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard summary:', err);
        this.isLoading = false;
      }
    });

    // We rely on getDashboardData() for the summary and recent parcels.
    // Fetching all pending parcels here is unnecessary and causes performance issues if data is large.
  }

  markReadyForPickup(parcel: Parcel): void {
    this.dataService.markReadyForPickup(parcel.id).subscribe({
      next: (updated) => {
        // تحديث الطلب مباشرة
        parcel.status = 'ready_for_pickup';
        parcel.isReadyForPickup = true;

        // حذف الطلب من pendingParcels لو حابين
        this.pendingParcels = this.pendingParcels.filter(p => p.id !== parcel.id);

        // تحديث الإحصائيات
        this.loadDashboardData();
      },
      error: (err) => {
        console.error('Error marking ready:', err);
      }
    });
  }


  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'في الانتظار',
      'ready_for_pickup': 'جاهز للاستلام',
      'assigned': 'تم التعيين',
      'picked_up': 'تم الاستلام',
      'in_transit': 'قيد التوصيل',
      'out_for_delivery': 'في الطريق',
      'delivered': 'تم التسليم',
      'failed_delivery': 'فشل التسليم',
      'returned': 'مُرتجع',
      'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'ready_for_pickup': 'bg-blue-100 text-blue-800 border-blue-200',
      'assigned': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'picked_up': 'bg-purple-100 text-purple-800 border-purple-200',
      'in_transit': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'out_for_delivery': 'bg-teal-100 text-teal-800 border-teal-200',
      'delivered': 'bg-green-100 text-green-800 border-green-200',
      'failed_delivery': 'bg-red-100 text-red-800 border-red-200',
      'returned': 'bg-orange-100 text-orange-800 border-orange-200',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getPriorityClass(priority: string): string {
    return priority === 'urgent'
      ? 'bg-red-100 text-red-700 border-red-200'
      : 'bg-gray-100 text-gray-600 border-gray-200';
  }

  getPriorityText(priority: string): string {
    return priority === 'urgent' ? 'عاجل' : 'عادي';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('ar-EG') + ' ج.م';
  }

  getStatIconBg(index: number): string {
    const colors = [
      'bg-gradient-to-br from-primary-green to-secondary-teal',
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-emerald-500 to-emerald-600',
      'bg-gradient-to-br from-amber-500 to-amber-600'
    ];
    return colors[index % colors.length];
  }
}
