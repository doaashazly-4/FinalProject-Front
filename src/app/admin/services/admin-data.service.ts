import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ========== INTERFACES ==========

export interface AdminStat {
  label: string;
  value: string;
  icon: string;
  trend?: string;
  color?: string;
}

export interface AdminUserRow {
  id: string;
  name: string;
  role: 'مُرسل' | 'مندوب' | 'مُستلم' | 'admin' | 'supplier' | 'courier' | 'customer';
  status: 'نشط' | 'معلق' | 'محظور';
  joined: string;
  email: string;
  phone?: string;
  ordersCount?: number;
  lastActivity?: string;
}

export interface AdminOrderRow {
  id: string;
  customer: string;
  sender?: string;
  courier?: string;
  status: 'جديد' | 'قيد المعالجة' | 'قيد التوصيل' | 'مكتمل' | 'ملغي' | 'فشل التوصيل';
  total: number;
  createdAt: string;
  deliveryAddress?: string;
}

// ========== CARRIER INTERFACES (UC-ADM-01) ==========

export interface PendingCarrier {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: 'Motorcycle' | 'Car' | 'Truck' | 'Van';
  licenseNumber: string;
  maxWeight: number;
  photoUrl?: string;
  licensePhotoFront?: string;
  licensePhotoBack?: string;
  idPhotoUrl?: string;
  appliedAt: string;
  address: string;
  birthDate: string;
  gender: 'Male' | 'Female';
}

// ========== DISPUTE INTERFACES (UC-ADM-04) ==========

export interface Dispute {
  id: string;
  orderId: string;
  type: 'not_delivered' | 'damaged' | 'late_delivery' | 'wrong_item' | 'other';
  status: 'pending' | 'in_review' | 'resolved' | 'escalated' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  complainantType: 'customer' | 'sender' | 'carrier';
  complainantId: string;
  complainantName: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  resolution?: string;
  resolutionType?: 'refund' | 'replace' | 'penalize_carrier' | 'other';
  assignedTo?: string;
  proofPhotos?: string[];
  statusHistory?: DisputeStatusHistory[];
}

export interface DisputeStatusHistory {
  status: string;
  changedAt: string;
  changedBy: string;
  notes?: string;
}

export interface DisputeResolutionDTO {
  disputeId: string;
  status: string;
  notes: string;
  resolutionType?: string;
}

// ========== REPORTS INTERFACES (UC-ADM-03) ==========

export interface SystemReport {
  totalOrders: number;
  totalOrdersChange: number;
  activeCarriers: number;
  activeCarriersChange: number;
  totalRevenue: number;
  revenueChange: number;
  failedDeliveries: number;
  failedDeliveriesChange: number;
  pendingApprovals: number;
  openDisputes: number;
  completedDeliveries: number;
  avgDeliveryTime: string;
}

export interface DailyStats {
  date: string;
  orders: number;
  revenue: number;
  completedDeliveries: number;
  failedDeliveries: number;
}

export interface ReportExportDTO {
  type: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  format: 'pdf' | 'excel' | 'csv';
}

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  private apiUrl = `${environment.apiUrl}/Admin`;

  constructor(private http: HttpClient) {}

  // ========== DASHBOARD & STATS ==========

  getStats(): Observable<AdminStat[]> {
    return this.http.get<AdminStat[]>(`${this.apiUrl}/stats`);
  }

  getDashboardData(): Observable<{stats: AdminStat[], recentUsers: AdminUserRow[], recentOrders: AdminOrderRow[]}> {
    return this.http.get<{stats: AdminStat[], recentUsers: AdminUserRow[], recentOrders: AdminOrderRow[]}>(`${this.apiUrl}/dashboard`);
  }

  // ========== USER MANAGEMENT (UC-ADM-02) ==========

  getUsers(): Observable<AdminUserRow[]> {
    return this.http.get<AdminUserRow[]>(`${this.apiUrl}/users`);
  }

  getUsersByRole(role: string): Observable<AdminUserRow[]> {
    return this.http.get<AdminUserRow[]>(`${this.apiUrl}/users?role=${role}`);
  }

  searchUsers(query: string): Observable<AdminUserRow[]> {
    return this.http.get<AdminUserRow[]>(`${this.apiUrl}/users/search?q=${query}`);
  }

  getUserDetails(userId: string): Observable<AdminUserRow> {
    return this.http.get<AdminUserRow>(`${this.apiUrl}/users/${userId}`);
  }

  updateUserStatus(userId: string, status: 'نشط' | 'معلق' | 'محظور'): Observable<AdminUserRow> {
    return this.http.patch<AdminUserRow>(`${this.apiUrl}/users/${userId}/status`, { status });
  }

  blockUser(userId: string, reason?: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/${userId}/block`, { reason });
  }

  unblockUser(userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/${userId}/unblock`, {});
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`);
  }

  // ========== CARRIER APPROVALS (UC-ADM-01) ==========

  getPendingCarriers(): Observable<PendingCarrier[]> {
    return this.http.get<PendingCarrier[]>(`${this.apiUrl}/carriers/pending`);
  }

  getCarrierDetails(carrierId: string): Observable<PendingCarrier> {
    return this.http.get<PendingCarrier>(`${this.apiUrl}/carriers/${carrierId}`);
  }

  approveCarrier(carrierId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/carriers/${carrierId}/approve`, {});
  }

  rejectCarrier(carrierId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/carriers/${carrierId}/reject`, { reason });
  }

  // ===== New Admin endpoints mapped to backend API described by user =====

  // Task 1 — Get Pending Couriers
  getPendingCouriersAdmin(): Observable<PendingCarrier[]> {
    return this.http.get<PendingCarrier[]>(`${this.apiUrl}/PendingCouriers`);
  }

  // Task 2 — Approve Courier
  approveCourierAdmin(courierId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/ApproveCourier/${courierId}`, {});
  }

  // Task 3 — Reject Courier
  rejectCourierAdmin(courierId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/RejectCourier/${courierId}`, { reason });
  }

  // Task 4 — Get Online Couriers
  getOnlineCouriersAdmin(): Observable<PendingCarrier[]> {
    return this.http.get<PendingCarrier[]>(`${this.apiUrl}/OnlineCouriers`);
  }

  // Task 5 — Get Dashboard Stats
  getDashboardStatsAdmin(): Observable<SystemReport> {
    return this.http.get<SystemReport>(`${this.apiUrl}/DashboardStats`);
  }

  // Task 6 — Block User
  blockUserAdmin(userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/BlockUser/${userId}`, {});
  }

  // Task 7 — Delete User
  deleteUserAdmin(userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/DeleteUser/${userId}`, {});
  }

  // Task 8 — Search Users
  searchUsersAdmin(email?: string, phone?: string): Observable<AdminUserRow[]> {
    const params: string[] = [];
    if (email) params.push(`email=${encodeURIComponent(email)}`);
    if (phone) params.push(`phone=${encodeURIComponent(phone)}`);
    const query = params.length ? `?${params.join('&')}` : '';
    return this.http.get<AdminUserRow[]>(`${this.apiUrl}/SearchUsers${query}`);
  }

  // Task 9 — Get Disputes
  getDisputesAdmin(): Observable<Dispute[]> {
    return this.http.get<Dispute[]>(`${this.apiUrl}/Disputes`);
  }

  // Task 10 — Get Dispute by ID
  getDisputeByIdAdmin(id: string): Observable<Dispute> {
    return this.http.get<Dispute>(`${this.apiUrl}/Dispute/${id}`);
  }

  // Task 11 — Resolve Dispute
  resolveDisputeAdmin(disputeId: string, status: string, notes: string): Observable<void> {
    const body = { status, notes };
    return this.http.post<void>(`${this.apiUrl}/ResolveDispute/${disputeId}`, body);
  }

  // ========== ORDERS MANAGEMENT ==========

  getOrders(): Observable<AdminOrderRow[]> {
    return this.http.get<AdminOrderRow[]>(`${this.apiUrl}/orders`);
  }

  getOrdersByStatus(status: string): Observable<AdminOrderRow[]> {
    return this.http.get<AdminOrderRow[]>(`${this.apiUrl}/orders?status=${status}`);
  }

  updateOrderStatus(orderId: string, status: string): Observable<AdminOrderRow> {
    return this.http.patch<AdminOrderRow>(`${this.apiUrl}/orders/${orderId}/status`, { status });
  }

  // ========== DISPUTES (UC-ADM-04) ==========

  getDisputes(): Observable<Dispute[]> {
    return this.http.get<Dispute[]>(`${this.apiUrl}/disputes`);
  }

  getDisputesByStatus(status: string): Observable<Dispute[]> {
    return this.http.get<Dispute[]>(`${this.apiUrl}/disputes?status=${status}`);
  }

  getDisputeDetails(disputeId: string): Observable<Dispute> {
    return this.http.get<Dispute>(`${this.apiUrl}/disputes/${disputeId}`);
  }

  resolveDispute(dto: DisputeResolutionDTO): Observable<Dispute> {
    return this.http.post<Dispute>(`${this.apiUrl}/disputes/${dto.disputeId}/resolve`, dto);
  }

  escalateDispute(disputeId: string, notes: string): Observable<Dispute> {
    return this.http.post<Dispute>(`${this.apiUrl}/disputes/${disputeId}/escalate`, { notes });
  }

  // ========== REPORTS (UC-ADM-03) ==========

  getSystemReport(period: 'today' | 'week' | 'month'): Observable<SystemReport> {
    return this.http.get<SystemReport>(`${this.apiUrl}/reports/system?period=${period}`);
  }

  getDailyStats(startDate: string, endDate: string): Observable<DailyStats[]> {
    return this.http.get<DailyStats[]>(`${this.apiUrl}/reports/daily?start=${startDate}&end=${endDate}`);
  }

  exportReport(dto: ReportExportDTO): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/reports/export`, dto, { responseType: 'blob' });
  }
}
