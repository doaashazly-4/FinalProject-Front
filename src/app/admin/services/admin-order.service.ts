import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ======== TYPES ========
export type OrderStatus = 'Pending' | 'Assigned' | 'Accepted' | 'PickupInProgress' | 'Delivered' | 'Cancelled';

export interface PackageRow {
  id: number;
  description: string;
  weight: number;
  price: number;
  status: 'Pending' | 'Assigned' | 'PickedUp' | 'Delivered' | 'Failed';
  courierId?: number;
}

export interface AdminOrderRow {
  id: string;
  customer: string;
  sender?: string;
  courier?: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  deliveryAddress?: string;
  packages?: PackageRow[];
}


@Injectable({ providedIn: 'root' })
export class AdminOrderService {
  private apiUrl = `${environment.apiUrl}`; // الربط بالباك

  constructor(private http: HttpClient) {}

  // ======== GET ALL ORDERS ========
  getOrders(): Observable<AdminOrderRow[]> {
    return this.http.get<AdminOrderRow[]>(`${this.apiUrl}/admin/orders`);
  }

  // ======== GET ORDER DETAILS ========
  getOrderDetails(orderId: number): Observable<AdminOrderRow> {
    return this.http.get<AdminOrderRow>(`${this.apiUrl}/admin/orders/${orderId}`);
  }

  // ======== UPDATE ORDER STATUS ========
  updateOrderStatus(orderId: number, status: OrderStatus): Observable<AdminOrderRow> {
    return this.http.put<AdminOrderRow>(`${this.apiUrl}/admin/orders/${orderId}`, { status });
  }

  // ======== ASSIGN COURIER ========
  assignCourier(orderId: number, courierId: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/admin/orders/${orderId}/assign/${courierId}`, {});
  }

  // ======== DELETE ORDER ========
  deleteOrder(orderId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/admin/orders/${orderId}`);
  }
}
