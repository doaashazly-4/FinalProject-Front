import { Component, OnInit, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupplierDataService, Parcel, SenderStat, SenderDashboardData } from '../../services/supplier-data.service';
import { LanguageService } from '../../../shared/services/language.service';
import { LucideAngularModule, CheckCircle2 } from 'lucide-angular';

import { ShipmentCardComponent } from '../../components/shipment-card/shipment-card.component';

@NgModule({
  imports: [LucideAngularModule.pick({ CheckCircle2 })],
  exports: [LucideAngularModule]
})
export class DashboardIconsModule { }

@Component({
  selector: 'app-supplier-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ShipmentCardComponent, DashboardIconsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class SupplierDashboardComponent implements OnInit {
  stats: SenderStat[] = [];
  recentParcels: Parcel[] = [];
  pendingParcels: Parcel[] = [];
  dashboardData: SenderDashboardData | null = null;
  isLoading = true;
  showAllParcels = false;
  today = new Date();

  constructor(
    private dataService: SupplierDataService,
    private router: Router,
    public langService: LanguageService
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

    this.dataService.getParcels({ status: ['pending', 'ready_for_pickup'] }).subscribe({
      next: (parcels) => {
        console.log('Pending Parcels:', parcels);
        this.pendingParcels = parcels;
        // In case dashboard summary is slow/fails, ensure we stop loading
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading pending parcels:', err);
        this.pendingParcels = [];
      }
    });
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
      'pending': 'Pending',
      'ready_for_pickup': 'Ready for Pickup',
      'assigned': 'Assigned',
      'picked_up': 'Picked Up',
      'in_transit': 'In Transit',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'failed_delivery': 'Failed Delivery',
      'returned': 'Returned',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    // Standardizing classes to be neutral (gray scale) to "remove color" or keep it minimal
    const classMap: { [key: string]: string } = {
      'pending': 'bg-gray-100 text-gray-800 border-gray-200',
      'ready_for_pickup': 'bg-gray-100 text-gray-800 border-gray-200',
      'assigned': 'bg-gray-100 text-gray-800 border-gray-200',
      'picked_up': 'bg-gray-100 text-gray-800 border-gray-200',
      'in_transit': 'bg-gray-100 text-gray-800 border-gray-200',
      'out_for_delivery': 'bg-gray-100 text-gray-800 border-gray-200',
      'delivered': 'bg-gray-100 text-gray-800 border-gray-200',
      'failed_delivery': 'bg-gray-100 text-gray-800 border-gray-200',
      'returned': 'bg-gray-100 text-gray-800 border-gray-200',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getPriorityClass(priority: string): string {
    return 'bg-gray-100 text-gray-600 border-gray-200';
  }

  getPriorityText(priority: string): string {
    return priority === 'urgent' ? 'Urgent' : 'Normal';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'EGP' });
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

  getStatLabel(label: string): string {
    return label;
  }
}
