import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminOrderService, AdminOrderRow, OrderStatus, PackageRow } from '../../services/admin-order.service';
import { LynxExplanationComponent } from '../../../shared/components/lynx-explanation/lynx-explanation.component';
import { LynxTalismanComponent } from '../../../shared/components/lynx-talisman/lynx-talisman.component';
import { AssignmentObservation } from '../../../models/assignment-observation.model';

interface ExtendedOrder extends AdminOrderRow {
  packages?: PackageRow[];
}

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [LynxTalismanComponent, CommonModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class AdminOrdersComponent implements OnInit {
  orders: ExtendedOrder[] = [];
  filteredOrders: ExtendedOrder[] = [];
  filter: OrderStatus | 'all' = 'all';
  isLoading = true;

  pendingCount = 0;
  inTransitCount = 0;
  deliveredCount = 0;
  cancelledCount = 0;
  failedCount = 0; // للعرض

  // Lynx Explanations
  explanations: { [orderId: string]: AssignmentObservation | null } = {};
  showExplanation: { [orderId: string]: boolean } = {};

  statusLabelsAr: Record<OrderStatus, string> = {
    Pending: 'جديد',
    Assigned: 'تم التعيين',
    Accepted: 'مقبول',
    PickupInProgress: 'قيد التوصيل',
    Delivered: 'مكتمل',
    Cancelled: 'ملغي'
  };

  statusFilters: { value: OrderStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'الكل' },
    { value: 'Pending', label: 'جديد' },
    { value: 'Assigned', label: 'تم التعيين' },
    { value: 'Accepted', label: 'مقبول' },
    { value: 'PickupInProgress', label: 'قيد التوصيل' },
    { value: 'Delivered', label: 'مكتمل' },
    { value: 'Cancelled', label: 'ملغي' }
  ];

  constructor(private orderService: AdminOrderService) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.orderService.getOrders().subscribe({
      next: (orders) => {
         console.log('Orders loaded:', orders);
        this.orders = orders.map(o => ({ ...o }));
        this.updateCounts();
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.isLoading = false;
      }
    });
  }

  refresh(): void {
    this.loadOrders();
  }

  updateCounts(): void {
    this.pendingCount = this.orders.filter(o => o.status === 'Pending').length;
    this.inTransitCount = this.orders.filter(o => o.status === 'PickupInProgress').length;
    this.deliveredCount = this.orders.filter(o => o.status === 'Delivered').length;
    this.cancelledCount = this.orders.filter(o => o.status === 'Cancelled').length;
    this.failedCount = this.orders.filter(o => o.status === 'Cancelled').length; // لو عايزة فشل + ملغي
  }

  setFilter(status: OrderStatus | 'all'): void {
    this.filter = status;
    this.applyFilter();
  }

  applyFilter(): void {
    this.filteredOrders = this.filter === 'all'
      ? this.orders
      : this.orders.filter(o => o.status === this.filter);
  }

  canUpdateStatus(status: OrderStatus): boolean {
    return status !== 'Delivered' && status !== 'Cancelled';
  }

  getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
    const statusFlow: { [key in OrderStatus]?: OrderStatus } = {
      Pending: 'PickupInProgress',
      PickupInProgress: 'Delivered'
    };
    return statusFlow[currentStatus] || null;
  }

  updateOrderStatus(order: ExtendedOrder): void {
    const nextStatus = this.getNextStatus(order.status);
    if (!nextStatus) return;

    this.orderService.updateOrderStatus(Number(order.id), nextStatus).subscribe({
      next: (updatedOrder) => {
        order.status = updatedOrder.status;
        order.packages = updatedOrder.packages;
        this.updateCounts();
        this.applyFilter();
      },
      error: (err) => console.error('Error updating order status:', err)
    });
  }

  getStatusLabel(status: OrderStatus): string {
    return this.statusLabelsAr[status] || status;
  }

  getStatusClass(status: OrderStatus): string {
    const classMap: { [key in OrderStatus]: string } = {
      Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Assigned: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      Accepted: 'bg-purple-100 text-purple-800 border-purple-200',
      PickupInProgress: 'bg-blue-100 text-blue-800 border-blue-200',
      Delivered: 'bg-green-100 text-green-800 border-green-200',
      Cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return classMap[status];
  }

  toggleExplanation(orderId: string): void {
    if (this.showExplanation[orderId]) {
      this.showExplanation[orderId] = false;
      return;
    }

    this.showExplanation[orderId] = true;

    // Fetch if not already loaded
    if (this.explanations[orderId] === undefined) {
      this.orderService.getAssignmentExplanation(orderId).subscribe({
        next: (exp) => {
          this.explanations[orderId] = exp;
          // If null (no explanation), maybe auto-hide or show "No explanation"?
          // Requirement: "If no explanation exists -> hide component silently"
          // So if exp is null, the component won't render inside the *ngIf="explanations[id]" check anyway.
        },
        error: () => this.explanations[orderId] = null
      });
    }
  }
}
