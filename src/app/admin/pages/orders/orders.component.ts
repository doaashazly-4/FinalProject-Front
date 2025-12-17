import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataService, AdminOrderRow } from '../../services/admin-data.service';

interface ExtendedOrder extends AdminOrderRow {
  sender?: string;
  courier?: string;
}

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class AdminOrdersComponent implements OnInit {
  orders: ExtendedOrder[] = [];
  filteredOrders: ExtendedOrder[] = [];
  filter: string = 'all';
  isLoading = true;

  pendingCount = 0;
  inTransitCount = 0;
  deliveredCount = 0;
  failedCount = 0;

  statusFilters: { value: string; label: string }[] = [
    { value: 'all', label: 'الكل' },
    { value: 'جديد', label: 'جديد' },
    { value: 'قيد المعالجة', label: 'قيد التوصيل' },
    { value: 'مكتمل', label: 'تم التسليم' },
    { value: 'ملغي', label: 'ملغي' }
  ];

  constructor(private data: AdminDataService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.data.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.updateCounts();
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        // Load mock data for development
        this.orders = this.getMockOrders();
        this.updateCounts();
        this.applyFilter();
        this.isLoading = false;
      }
    });
  }

  refresh(): void {
    this.loadOrders();
  }

  updateCounts(): void {
    this.pendingCount = this.orders.filter(o => o.status === 'جديد').length;
    this.inTransitCount = this.orders.filter(o => o.status === 'قيد المعالجة').length;
    this.deliveredCount = this.orders.filter(o => o.status === 'مكتمل').length;
    this.failedCount = this.orders.filter(o => o.status === 'ملغي').length;
  }

  setFilter(status: string): void {
    this.filter = status;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.filter === 'all') {
      this.filteredOrders = this.orders;
    } else {
      this.filteredOrders = this.orders.filter(o => o.status === this.filter);
    }
  }

  canUpdateStatus(status: string): boolean {
    return status !== 'مكتمل' && status !== 'ملغي';
  }

  updateOrderStatus(order: ExtendedOrder): void {
    const nextStatus = this.getNextStatus(order.status);
    if (nextStatus) {
      this.data.updateOrderStatus(order.id, nextStatus).subscribe({
        next: () => {
          order.status = nextStatus as 'جديد' | 'قيد المعالجة' | 'مكتمل' | 'ملغي';
          this.updateCounts();
        },
        error: (err) => {
          console.error('Error updating order status:', err);
          // Update locally for demo
          order.status = nextStatus as 'جديد' | 'قيد المعالجة' | 'مكتمل' | 'ملغي';
          this.updateCounts();
        }
      });
    }
  }

  getNextStatus(currentStatus: string): string | null {
    const statusFlow: { [key: string]: string } = {
      'جديد': 'قيد المعالجة',
      'قيد المعالجة': 'مكتمل'
    };
    return statusFlow[currentStatus] || null;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'جديد': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'قيد المعالجة': 'bg-blue-100 text-blue-800 border-blue-200',
      'مكتمل': 'bg-green-100 text-green-800 border-green-200',
      'ملغي': 'bg-red-100 text-red-800 border-red-200'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  private getMockOrders(): ExtendedOrder[] {
    return [
      { id: 'PKG-2024-001', customer: 'أحمد محمد', sender: 'شركة الإلكترونيات', status: 'قيد المعالجة', total: 35, createdAt: '2024-12-15', courier: 'محمد علي' },
      { id: 'PKG-2024-002', customer: 'سارة علي', sender: 'متجر الأزياء', status: 'جديد', total: 45, createdAt: '2024-12-15' },
      { id: 'PKG-2024-003', customer: 'خالد سعيد', sender: 'مكتبة النور', status: 'مكتمل', total: 25, createdAt: '2024-12-14', courier: 'أحمد حسن' },
      { id: 'PKG-2024-004', customer: 'نورة أحمد', sender: 'متجر الهدايا', status: 'قيد المعالجة', total: 55, createdAt: '2024-12-14', courier: 'علي محمود' },
      { id: 'PKG-2024-005', customer: 'محمود حسين', sender: 'شركة المستلزمات', status: 'جديد', total: 30, createdAt: '2024-12-13' },
      { id: 'PKG-2024-006', customer: 'فاطمة يوسف', sender: 'متجر العطور', status: 'ملغي', total: 75, createdAt: '2024-12-12' }
    ];
  }
}
