import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerDataService, IncomingDelivery } from '../../services/customer-data.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class CustomerOrdersComponent implements OnInit {
  orders: IncomingDelivery[] = [];
  filter = 'الكل';
  isLoading = true;

  constructor(private data: CustomerDataService) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.data.getDeliveries().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.orders = [];
        this.isLoading = false;
      }
    });
  }

  filteredOrders(): IncomingDelivery[] {
    if (this.filter === 'الكل') return this.orders;
    // Map Arabic filters to internal status if needed, 
    // but for now let's just use the status text if it matches
    return this.orders.filter(o => this.getStatusText(o.status) === this.filter);
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'في الانتظار',
      'assigned': 'تم التعيين',
      'picked_up': 'تم الاستلام',
      'in_transit': 'في الطريق',
      'out_for_delivery': 'قريبة',
      'delivered': 'مكتمل',
      'failed_delivery': 'فاشل',
      'returned': 'مرتجع',
      'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
  }
}
