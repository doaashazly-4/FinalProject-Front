import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerDataService, IncomingDelivery, ReceiverStat } from '../../services/customer-data.service';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class CustomerDashboardComponent implements OnInit {
  stats: ReceiverStat[] = [];
  recentDeliveries: IncomingDelivery[] = [];
  activeDeliveries: IncomingDelivery[] = [];
  isLoading = true;

  constructor(private dataService: CustomerDataService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    this.dataService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (err) => {
        console.error('Error loading stats:', err);
        this.stats = [];
      }
    });

    this.dataService.getDeliveries().subscribe({
      next: (deliveries) => {
        this.recentDeliveries = deliveries.slice(0, 5);
        this.activeDeliveries = deliveries.filter(d => 
          !['delivered', 'cancelled', 'returned'].includes(d.status)
        );
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading deliveries:', err);
        this.recentDeliveries = [];
        this.activeDeliveries = [];
        this.isLoading = false;
      }
    });
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'في الانتظار',
      'assigned': 'تم التعيين',
      'picked_up': 'تم الاستلام من المُرسل',
      'in_transit': 'في الطريق إليك',
      'out_for_delivery': 'المندوب قريب منك',
      'delivered': 'تم التسليم',
      'failed_delivery': 'فشل التسليم',
      'returned': 'تم الإرجاع',
      'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'assigned': 'bg-blue-100 text-blue-800 border-blue-200',
      'picked_up': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'in_transit': 'bg-purple-100 text-purple-800 border-purple-200',
      'out_for_delivery': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'delivered': 'bg-green-100 text-green-800 border-green-200',
      'failed_delivery': 'bg-red-100 text-red-800 border-red-200',
      'returned': 'bg-orange-100 text-orange-800 border-orange-200',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatIconBg(index: number): string {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600'
    ];
    return colors[index % colors.length];
  }

  callCourier(phone: string | undefined): void {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  }
}
