import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierDataService, SupplierOrderRow } from '../../services/supplier-data.service';

@Component({
  selector: 'app-supplier-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class SupplierOrdersComponent implements OnInit {
  orders: SupplierOrderRow[] = [];
  filteredOrders: SupplierOrderRow[] = [];
  filter = 'الكل';
  searchTerm = '';
  isLoading = true;
  
  statuses = [
    { value: 'الكل', label: 'جميع الطلبات' },
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'processing', label: 'قيد التجهيز' },
    { value: 'ready', label: 'جاهز للتوصيل' },
    { value: 'shipping', label: 'قيد التوصيل' },
    { value: 'delivered', label: 'تم التسليم' },
    { value: 'cancelled', label: 'ملغي' }
  ];

  stats = {
    total: 0,
    pending: 0,
    processing: 0,
    delivered: 0,
    totalRevenue: 0
  };

  constructor(private dataService: SupplierDataService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.dataService.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.applyFilters();
        this.calculateStats();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.orders = [];
        this.filteredOrders = [];
        this.isLoading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats.total = this.orders.length;
    this.stats.pending = this.orders.filter(o => o.status === 'pending').length;
    this.stats.processing = this.orders.filter(o => o.status === 'processing').length;
    this.stats.delivered = this.orders.filter(o => o.status === 'delivered').length;
    this.stats.totalRevenue = this.orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0);
  }

  applyFilters(): void {
    this.filteredOrders = this.orders.filter(order => {
      const matchesStatus = this.filter === 'الكل' || order.status === this.filter;
      const matchesSearch = this.searchTerm === '' || 
        order.customer.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }

  setFilter(status: string): void {
    this.filter = status;
    this.applyFilters();
  }

  updateStatus(orderId: string, newStatus: string): void {
    this.dataService.updateOrderStatus(orderId, newStatus).subscribe({
      next: (updatedOrder) => {
        const index = this.orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
          this.applyFilters();
          this.calculateStats();
        }
      },
      error: (err) => {
        console.error('Error updating order status:', err);
        alert('حدث خطأ أثناء تحديث حالة الطلب');
      }
    });
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'قيد الانتظار',
      'processing': 'قيد التجهيز',
      'ready': 'جاهز للتوصيل',
      'shipping': 'قيد التوصيل',
      'delivered': 'تم التسليم',
      'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'ready': 'bg-purple-100 text-purple-800',
      'shipping': 'bg-indigo-100 text-indigo-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('ar-SA') + ' ر.س';
  }
}
