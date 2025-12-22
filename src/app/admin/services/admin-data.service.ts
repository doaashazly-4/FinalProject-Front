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
  vehicleLicensePhotoFront?: string;
  vehicleLicensePhotoBack?: string;
  idPhotoUrl?: string;
  appliedAt: string;
  address: string;
  birthDate?: string;
  gender?: string;
}

export interface CarrierApprovalDTO {
  carrierId: string;
  approved: boolean;
  rejectionReason?: string;
}

// ========== DISPUTE INTERFACES (UC-ADM-04) ==========

export interface Dispute {
  id: string;
  orderId: string;
  type: 'not_delivered' | 'damaged' | 'wrong_item' | 'late_delivery' | 'other';
  status: 'pending' | 'in_review' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  complainantType: 'sender' | 'carrier' | 'customer';
  complainantId: string;
  complainantName: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  resolution?: string;
  resolutionType?: 'refund' | 'reassign' | 'penalize_carrier' | 'no_action' | 'partial_refund';
  proofPhotos?: string[];
  statusHistory?: DisputeStatusHistory[];
  assignedTo?: string;
}

export interface DisputeStatusHistory {
  status: string;
  changedAt: string;
  changedBy: string;
  notes?: string;
}

export interface DisputeResolutionDTO {
  disputeId: string;
  resolutionType: 'refund' | 'reassign' | 'penalize_carrier' | 'no_action' | 'partial_refund';
  notes: string;
  refundAmount?: number;
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
    return this.http.get<AdminStat[]>(`${this.apiUrl}/stats`).pipe(
      catchError(() => of(this.getMockStats()))
    );
  }

  getDashboardData(): Observable<{stats: AdminStat[], recentUsers: AdminUserRow[], recentOrders: AdminOrderRow[]}> {
    return this.http.get<{stats: AdminStat[], recentUsers: AdminUserRow[], recentOrders: AdminOrderRow[]}>(`${this.apiUrl}/dashboard`).pipe(
      catchError(() => of({
        stats: this.getMockStats(),
        recentUsers: this.getMockUsers().slice(0, 5),
        recentOrders: this.getMockOrders().slice(0, 5)
      }))
    );
  }

  // ========== USER MANAGEMENT (UC-ADM-02) ==========

  getUsers(): Observable<AdminUserRow[]> {
    return this.http.get<AdminUserRow[]>(`${this.apiUrl}/users`).pipe(
      catchError(() => of(this.getMockUsers()))
    );
  }

  getUsersByRole(role: string): Observable<AdminUserRow[]> {
    return this.http.get<AdminUserRow[]>(`${this.apiUrl}/users?role=${role}`).pipe(
      catchError(() => of(this.getMockUsers().filter(u => u.role === role)))
    );
  }

  searchUsers(query: string): Observable<AdminUserRow[]> {
    return this.http.get<AdminUserRow[]>(`${this.apiUrl}/users/search?q=${query}`).pipe(
      catchError(() => of(this.getMockUsers().filter(u => 
        u.name.includes(query) || u.email.includes(query) || u.phone?.includes(query)
      )))
    );
  }

  getUserDetails(userId: string): Observable<AdminUserRow> {
    return this.http.get<AdminUserRow>(`${this.apiUrl}/users/${userId}`).pipe(
      catchError(() => of(this.getMockUsers().find(u => u.id === userId)!))
    );
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
    return this.http.get<PendingCarrier[]>(`${this.apiUrl}/carriers/pending`).pipe(
      catchError(() => of(this.getMockPendingCarriers()))
    );
  }

  getCarrierDetails(carrierId: string): Observable<PendingCarrier> {
    return this.http.get<PendingCarrier>(`${this.apiUrl}/carriers/${carrierId}`).pipe(
      catchError(() => of(this.getMockPendingCarriers().find(c => c.id === carrierId)!))
    );
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
    return this.http.get<PendingCarrier[]>(`${this.apiUrl}/PendingCouriers`).pipe(
      catchError(() => of(this.getMockPendingCarriers()))
    );
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
    return this.http.get<PendingCarrier[]>(`${this.apiUrl}/OnlineCouriers`).pipe(
      catchError(() => of([]))
    );
  }

  // Task 5 — Get Dashboard Stats
  getDashboardStatsAdmin(): Observable<SystemReport> {
    return this.http.get<SystemReport>(`${this.apiUrl}/DashboardStats`).pipe(
      catchError(() => of(this.getMockSystemReport()))
    );
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
    return this.http.get<AdminUserRow[]>(`${this.apiUrl}/SearchUsers${query}`).pipe(
      catchError(() => of(this.getMockUsers().filter(u => {
        const matchEmail = email ? u.email.includes(email) : true;
        const matchPhone = phone ? (u.phone?.includes(phone) ?? false) : true;
        return matchEmail && matchPhone;
      })))
    );
  }

  // Task 9 — Get Disputes
  getDisputesAdmin(): Observable<Dispute[]> {
    return this.http.get<Dispute[]>(`${this.apiUrl}/Disputes`).pipe(
      catchError(() => of(this.getMockDisputes()))
    );
  }

  // Task 10 — Get Dispute by ID
  getDisputeByIdAdmin(id: string): Observable<Dispute> {
    return this.http.get<Dispute>(`${this.apiUrl}/Dispute/${id}`).pipe(
      catchError(() => of(this.getMockDisputes().find(d => d.id === id)!))
    );
  }

  // Task 11 — Resolve Dispute
  resolveDisputeAdmin(disputeId: string, status: string, notes: string): Observable<void> {
    const body = { status, notes };
    return this.http.post<void>(`${this.apiUrl}/ResolveDispute/${disputeId}`, body);
  }

  // ========== ORDERS MANAGEMENT ==========

  getOrders(): Observable<AdminOrderRow[]> {
    return this.http.get<AdminOrderRow[]>(`${this.apiUrl}/orders`).pipe(
      catchError(() => of(this.getMockOrders()))
    );
  }

  getOrdersByStatus(status: string): Observable<AdminOrderRow[]> {
    return this.http.get<AdminOrderRow[]>(`${this.apiUrl}/orders?status=${status}`).pipe(
      catchError(() => of(this.getMockOrders().filter(o => o.status === status)))
    );
  }

  updateOrderStatus(orderId: string, status: string): Observable<AdminOrderRow> {
    return this.http.patch<AdminOrderRow>(`${this.apiUrl}/orders/${orderId}/status`, { status });
  }

  // ========== DISPUTES (UC-ADM-04) ==========

  getDisputes(): Observable<Dispute[]> {
    return this.http.get<Dispute[]>(`${this.apiUrl}/disputes`).pipe(
      catchError(() => of(this.getMockDisputes()))
    );
  }

  getDisputesByStatus(status: string): Observable<Dispute[]> {
    return this.http.get<Dispute[]>(`${this.apiUrl}/disputes?status=${status}`).pipe(
      catchError(() => of(this.getMockDisputes().filter(d => d.status === status)))
    );
  }

  getDisputeDetails(disputeId: string): Observable<Dispute> {
    return this.http.get<Dispute>(`${this.apiUrl}/disputes/${disputeId}`).pipe(
      catchError(() => of(this.getMockDisputes().find(d => d.id === disputeId)!))
    );
  }

  resolveDispute(dto: DisputeResolutionDTO): Observable<Dispute> {
    return this.http.post<Dispute>(`${this.apiUrl}/disputes/${dto.disputeId}/resolve`, dto);
  }

  escalateDispute(disputeId: string, notes: string): Observable<Dispute> {
    return this.http.post<Dispute>(`${this.apiUrl}/disputes/${disputeId}/escalate`, { notes });
  }

  // ========== REPORTS (UC-ADM-03) ==========

  getSystemReport(period: 'today' | 'week' | 'month'): Observable<SystemReport> {
    return this.http.get<SystemReport>(`${this.apiUrl}/reports/system?period=${period}`).pipe(
      catchError(() => of(this.getMockSystemReport()))
    );
  }

  getDailyStats(startDate: string, endDate: string): Observable<DailyStats[]> {
    return this.http.get<DailyStats[]>(`${this.apiUrl}/reports/daily?start=${startDate}&end=${endDate}`).pipe(
      catchError(() => of(this.getMockDailyStats()))
    );
  }

  exportReport(dto: ReportExportDTO): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/reports/export`, dto, { responseType: 'blob' });
  }

  // ========== MOCK DATA ==========

  private getMockStats(): AdminStat[] {
    return [
      { label: 'إجمالي المستخدمين', value: '1,234', icon: 'bi-people', trend: '+12%', color: 'blue' },
      { label: 'إجمالي الشحنات', value: '856', icon: 'bi-box-seam', trend: '+8%', color: 'green' },
      { label: 'المناديب النشطون', value: '45', icon: 'bi-truck', trend: '+5', color: 'orange' },
      { label: 'الإيرادات', value: '15,750 ج.م', icon: 'bi-cash-stack', trend: '+15%', color: 'emerald' },
      { label: 'طلبات معلقة', value: '23', icon: 'bi-hourglass-split', trend: '-3', color: 'yellow' },
      { label: 'نزاعات مفتوحة', value: '5', icon: 'bi-exclamation-triangle', trend: '+2', color: 'red' }
    ];
  }

  private getMockUsers(): AdminUserRow[] {
    return [
      { id: '1', name: 'أحمد محمد', role: 'مُرسل', status: 'نشط', joined: '2024-01-15', email: 'ahmed@example.com', phone: '01012345678', ordersCount: 25, lastActivity: '2024-12-16' },
      { id: '2', name: 'سارة علي', role: 'مُستلم', status: 'نشط', joined: '2024-02-20', email: 'sara@example.com', phone: '01098765432', ordersCount: 12, lastActivity: '2024-12-15' },
      { id: '3', name: 'محمد حسن', role: 'مندوب', status: 'نشط', joined: '2024-01-10', email: 'mohamed@example.com', phone: '01155667788', ordersCount: 150, lastActivity: '2024-12-16' },
      { id: '4', name: 'نورة أحمد', role: 'مُرسل', status: 'معلق', joined: '2024-03-05', email: 'noura@example.com', phone: '01234567890', ordersCount: 5, lastActivity: '2024-12-10' },
      { id: '5', name: 'خالد سعيد', role: 'مندوب', status: 'نشط', joined: '2024-02-01', email: 'khaled@example.com', phone: '01122334455', ordersCount: 200, lastActivity: '2024-12-16' },
      { id: '6', name: 'فاطمة يوسف', role: 'مُستلم', status: 'محظور', joined: '2024-03-10', email: 'fatma@example.com', phone: '01199887766', ordersCount: 3, lastActivity: '2024-11-20' }
    ];
  }

  private getMockOrders(): AdminOrderRow[] {
    return [
      { id: 'PKG-2024-001', customer: 'أحمد محمد', sender: 'شركة ABC', courier: 'محمد حسن', status: 'قيد التوصيل', total: 35, createdAt: '2024-12-15', deliveryAddress: 'القاهرة - مدينة نصر' },
      { id: 'PKG-2024-002', customer: 'سارة علي', sender: 'متجر XYZ', status: 'جديد', total: 45, createdAt: '2024-12-15', deliveryAddress: 'الجيزة - الدقي' },
      { id: 'PKG-2024-003', customer: 'خالد سعيد', sender: 'شركة ABC', courier: 'خالد سعيد', status: 'مكتمل', total: 25, createdAt: '2024-12-14', deliveryAddress: 'الإسكندرية - سموحة' },
      { id: 'PKG-2024-004', customer: 'نورة أحمد', sender: 'متجر 123', courier: 'محمد حسن', status: 'قيد المعالجة', total: 55, createdAt: '2024-12-14', deliveryAddress: 'القاهرة - المعادي' },
      { id: 'PKG-2024-005', customer: 'محمود حسين', sender: 'شركة DEF', status: 'جديد', total: 30, createdAt: '2024-12-13', deliveryAddress: 'القاهرة - مصر الجديدة' },
      { id: 'PKG-2024-006', customer: 'فاطمة يوسف', sender: 'متجر XYZ', status: 'ملغي', total: 75, createdAt: '2024-12-12', deliveryAddress: 'الجيزة - 6 أكتوبر' },
      { id: 'PKG-2024-007', customer: 'علي حسين', sender: 'شركة ABC', courier: 'خالد سعيد', status: 'فشل التوصيل', total: 60, createdAt: '2024-12-11', deliveryAddress: 'القاهرة - شبرا' }
    ];
  }

  private getMockPendingCarriers(): PendingCarrier[] {
    return [
      {
        id: 'C001',
        name: 'عمر محمود',
        email: 'omar@example.com',
        phone: '01012345678',
        vehicleType: 'Motorcycle',
        licenseNumber: 'ABC123',
        maxWeight: 10,
        appliedAt: '2024-12-15T10:30:00',
        address: 'القاهرة - مدينة نصر، شارع مصطفى النحاس',
        birthDate: '1995-05-15',
        gender: 'Male',
        photoUrl: '/assets/Images/placeholder-user.jpg',
        licensePhotoFront: '/assets/Images/placeholder-license.jpg',
        licensePhotoBack: '/assets/Images/placeholder-license.jpg',
        idPhotoUrl: '/assets/Images/placeholder-id.jpg'
      },
      {
        id: 'C002',
        name: 'يوسف إبراهيم',
        email: 'youssef@example.com',
        phone: '01198765432',
        vehicleType: 'Car',
        licenseNumber: 'XYZ789',
        maxWeight: 50,
        appliedAt: '2024-12-14T14:20:00',
        address: 'الجيزة - الهرم، شارع الهرم الرئيسي',
        birthDate: '1990-08-22',
        gender: 'Male',
        photoUrl: '/assets/Images/placeholder-user.jpg',
        licensePhotoFront: '/assets/Images/placeholder-license.jpg',
        licensePhotoBack: '/assets/Images/placeholder-license.jpg',
        idPhotoUrl: '/assets/Images/placeholder-id.jpg'
      },
      {
        id: 'C003',
        name: 'أحمد فتحي',
        email: 'ahmed.fathy@example.com',
        phone: '01055667788',
        vehicleType: 'Van',
        licenseNumber: 'DEF456',
        maxWeight: 100,
        appliedAt: '2024-12-13T09:15:00',
        address: 'الإسكندرية - سموحة، شارع فوزي معاذ',
        birthDate: '1988-12-10',
        gender: 'Male',
        photoUrl: '/assets/Images/placeholder-user.jpg',
        licensePhotoFront: '/assets/Images/placeholder-license.jpg',
        licensePhotoBack: '/assets/Images/placeholder-license.jpg',
        idPhotoUrl: '/assets/Images/placeholder-id.jpg'
      }
    ];
  }

  private getMockDisputes(): Dispute[] {
    return [
      {
        id: 'DSP-001',
        orderId: 'PKG-2024-007',
        type: 'not_delivered',
        status: 'pending',
        priority: 'high',
        complainantType: 'customer',
        complainantId: 'U123',
        complainantName: 'علي حسين',
        description: 'لم يتم تسليم الطرد رغم تأكيد المندوب بالتسليم. لم يصلني أي اتصال من المندوب وعند الاتصال به لم يرد.',
        createdAt: '2024-12-15T16:30:00',
        proofPhotos: ['/assets/Images/placeholder-proof.jpg'],
        statusHistory: [
          { status: 'pending', changedAt: '2024-12-15T16:30:00', changedBy: 'System', notes: 'تم إنشاء الشكوى' }
        ]
      },
      {
        id: 'DSP-002',
        orderId: 'PKG-2024-005',
        type: 'damaged',
        status: 'in_review',
        priority: 'medium',
        complainantType: 'customer',
        complainantId: 'U456',
        complainantName: 'محمود حسين',
        description: 'وصل الطرد وهو مكسور من الداخل. يبدو أنه تعرض لسقوط أو ضغط شديد أثناء النقل.',
        createdAt: '2024-12-14T11:00:00',
        updatedAt: '2024-12-15T09:00:00',
        proofPhotos: ['/assets/Images/placeholder-proof.jpg', '/assets/Images/placeholder-proof2.jpg'],
        assignedTo: 'Admin-01',
        statusHistory: [
          { status: 'pending', changedAt: '2024-12-14T11:00:00', changedBy: 'System', notes: 'تم إنشاء الشكوى' },
          { status: 'in_review', changedAt: '2024-12-15T09:00:00', changedBy: 'Admin-01', notes: 'جاري مراجعة الصور المرفقة' }
        ]
      },
      {
        id: 'DSP-003',
        orderId: 'PKG-2024-003',
        type: 'late_delivery',
        status: 'resolved',
        priority: 'low',
        complainantType: 'sender',
        complainantId: 'S789',
        complainantName: 'شركة ABC',
        description: 'تأخر التوصيل 3 أيام عن الموعد المحدد مما أثر على رضا العميل.',
        createdAt: '2024-12-12T14:00:00',
        updatedAt: '2024-12-13T10:00:00',
        resolvedAt: '2024-12-13T10:00:00',
        resolution: 'تم التواصل مع المندوب وتنبيهه. سيتم خصم نسبة من أرباحه كعقوبة.',
        resolutionType: 'penalize_carrier',
        statusHistory: [
          { status: 'pending', changedAt: '2024-12-12T14:00:00', changedBy: 'System', notes: 'تم إنشاء الشكوى' },
          { status: 'in_review', changedAt: '2024-12-12T16:00:00', changedBy: 'Admin-02', notes: 'جاري التحقق من سجل التوصيل' },
          { status: 'resolved', changedAt: '2024-12-13T10:00:00', changedBy: 'Admin-02', notes: 'تم حل النزاع بمعاقبة المندوب' }
        ]
      },
      {
        id: 'DSP-004',
        orderId: 'PKG-2024-006',
        type: 'other',
        status: 'escalated',
        priority: 'urgent',
        complainantType: 'carrier',
        complainantId: 'C456',
        complainantName: 'خالد سعيد',
        description: 'العميل يرفض استلام الطرد ويدعي أنه لم يطلبه. الطرد صحيح والعنوان صحيح.',
        createdAt: '2024-12-11T18:00:00',
        updatedAt: '2024-12-14T14:00:00',
        assignedTo: 'Admin-Manager',
        statusHistory: [
          { status: 'pending', changedAt: '2024-12-11T18:00:00', changedBy: 'System', notes: 'تم إنشاء الشكوى' },
          { status: 'in_review', changedAt: '2024-12-12T09:00:00', changedBy: 'Admin-01', notes: 'جاري التحقق من الطلب الأصلي' },
          { status: 'escalated', changedAt: '2024-12-14T14:00:00', changedBy: 'Admin-01', notes: 'تم تصعيد الحالة للإدارة العليا' }
        ]
      }
    ];
  }

  private getMockSystemReport(): SystemReport {
    return {
      totalOrders: 856,
      totalOrdersChange: 8,
      activeCarriers: 45,
      activeCarriersChange: 5,
      totalRevenue: 15750,
      revenueChange: 15,
      failedDeliveries: 23,
      failedDeliveriesChange: -3,
      pendingApprovals: 3,
      openDisputes: 5,
      completedDeliveries: 789,
      avgDeliveryTime: '2.5 ساعة'
    };
  }

  private getMockDailyStats(): DailyStats[] {
    return [
      { date: '2024-12-10', orders: 45, revenue: 1250, completedDeliveries: 42, failedDeliveries: 3 },
      { date: '2024-12-11', orders: 52, revenue: 1480, completedDeliveries: 48, failedDeliveries: 4 },
      { date: '2024-12-12', orders: 38, revenue: 980, completedDeliveries: 35, failedDeliveries: 2 },
      { date: '2024-12-13', orders: 61, revenue: 1720, completedDeliveries: 58, failedDeliveries: 3 },
      { date: '2024-12-14', orders: 55, revenue: 1550, completedDeliveries: 51, failedDeliveries: 4 },
      { date: '2024-12-15', orders: 48, revenue: 1380, completedDeliveries: 45, failedDeliveries: 2 },
      { date: '2024-12-16', orders: 35, revenue: 890, completedDeliveries: 32, failedDeliveries: 1 }
    ];
  }
}
