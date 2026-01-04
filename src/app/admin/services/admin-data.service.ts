import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
  isBlocked?: boolean;
}


export interface PendingCarrier {
  id: number;
  name: string;
  email: string;
  phone?: string;
  passWord?: string;
  vehicleType: string;
  licenseNumber: string;
  maxWeight: number;
  photoUrl: string;
  licensePhotoFront: string;
  licensePhotoBack: string;
  idPhotoUrl?: string; // Not in current backend but kept for safety
  appliedAt: string;
  address: string;
  birthDate: string;
  gender: string;
}

export interface Dispute {
  id: string;
  orderId: string; // Mapped from backend packageId
  type: string;
  status: string;
  priority?: string;
  description: string;
  createdAt: string;
  resolutionNotes?: string;
  resolution?: string; // Compatible with resolutionNotes
  resolutionType?: string;
  proofPhotos?: string[]; // Mapped from proofImages
  statusHistory?: DisputeStatusHistory[];
  complainantName?: string;
  complainantType?: string;
}

export interface DisputeStatusHistory {
  status: string;
  changedAt: string;
  changedBy?: string;
  notes?: string;
}

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

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  private apiUrl = `${environment.apiUrl}/Admin`;

  constructor(private http: HttpClient) { }

  // 1. Get Pending Couriers
  getPendingCouriers(): Observable<PendingCarrier[]> {
    return this.http.get<any[]>(`${this.apiUrl}/PendingCouriers`).pipe(
      map(carriers => carriers.map(c => ({
        id: c.id ?? c.Id,
        name: c.name ?? c.UserName ?? c.Name,
        email: c.email ?? c.Email,
        phone: c.phone ?? c.PhoneNumber ?? c.Phone,
        passWord: c.passWord ?? c.PasswordHash,
        vehicleType: c.vehicleType ?? c.VehicleType,
        licenseNumber: c.licenseNumber ?? c.LicenseNumber,
        maxWeight: c.maxWeight ?? c.MaxWeight,
        photoUrl: c.photoUrl ?? c.PhotoUrl,
        licensePhotoFront: c.licensePhotoFront ?? c.LicensePhotoFront,
        licensePhotoBack: c.licensePhotoBack ?? c.LicensePhotoBack,
        appliedAt: c.appliedAt ?? c.CreatedAt,
        address: c.address ?? c.Address,
        birthDate: c.birthDate ?? c.BirthDate,
        gender: c.gender ?? c.Gender
      } as PendingCarrier)))
    );
  }

  // Aliases for backward compatibility
  getPendingCouriersAdmin(): Observable<PendingCarrier[]> {
    return this.getPendingCouriers();
  }

  getPendingCarriers(): Observable<PendingCarrier[]> {
    return this.getPendingCouriers();
  }

  // 2. Approve Courier
  approveCourier(courierId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/ApproveCourier/${courierId}`, {});
  }

  approveCourierAdmin(courierId: number): Observable<any> {
    return this.approveCourier(courierId);
  }

  // 3. Reject Courier
  rejectCourier(courierId: number, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/RejectCourier/${courierId}`, { reason });
  }

  rejectCourierAdmin(courierId: number, reason: string): Observable<any> {
    return this.rejectCourier(courierId, reason);
  }

  // 4. Get Online Couriers
  getOnlineCouriers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/OnlineCouriers`);
  }

  getOnlineCouriersAdmin(): Observable<any[]> {
    return this.getOnlineCouriers();
  }

  // 5. Get Dashboard Stats
  getDashboardStats(): Observable<AdminStat[]> {
    return this.http.get<any>(`${this.apiUrl}/DashboardStats`).pipe(
      map(data => [
        { label: 'إجمالي الطلبات', value: (data.totalOrders ?? data.TotalOrders ?? 0).toString(), icon: 'bi-box-seam', color: 'blue' },
        { label: 'المناديب النشطين', value: (data.activeCouriers ?? data.ActiveCouriers ?? 0).toString(), icon: 'bi-people', color: 'green' },
        { label: 'عمليات توصيل فاشلة', value: (data.failedDeliveries ?? data.FailedDeliveries ?? 0).toString(), icon: 'bi-x-circle', color: 'red' },
        { label: 'إجمالي الإيرادات', value: `${data.totalRevenue ?? data.TotalRevenue ?? 0} ج.م`, icon: 'bi-currency-dollar', color: 'orange' }
      ])
    );
  }

  getStats(): Observable<AdminStat[]> {
    return this.getDashboardStats();
  }

  getDashboardStatsAdmin(): Observable<any> {
    return this.getDashboardStats();
  }

  // 6. Block User
  blockUser(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/BlockUser/${userId}`, {});
  }

  blockUserAdmin(userId: string): Observable<any> {
    return this.blockUser(userId);
  }

  // 7. Delete User
  deleteUser(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/DeleteUser/${userId}`, {});
  }

  deleteUserAdmin(userId: string): Observable<any> {
    return this.deleteUser(userId);
  }

  // 8. Search Users
  searchUsers(email?: string, phone?: string): Observable<AdminUserRow[]> {
    let params = new HttpParams();
    if (email) params = params.set('email', email);
    if (phone) params = params.set('phone', phone);
    return this.http.get<any[]>(`${this.apiUrl}/SearchUsers`, { params }).pipe(
      map(users => users.map(u => ({
        id: u.id ?? u.Id,
        name: u.userName ?? u.UserName,
        email: u.email ?? u.Email,
        phone: u.phoneNumber ?? u.PhoneNumber,
        isBlocked: u.isBlocked ?? u.IsBlocked,
        role: 'customer',
        status: (u.isBlocked ?? u.IsBlocked) ? 'محظور' : 'نشط',
        joined: ''
      } as AdminUserRow)))
    );
  }

  searchUsersAdmin(email?: string, phone?: string): Observable<AdminUserRow[]> {
    return this.searchUsers(email, phone);
  }

  // 9. Get Disputes
  getDisputes(): Observable<Dispute[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Disputes`).pipe(
      map(disputes => disputes.map(d => ({
        id: d.id ?? d.Id,
        orderId: (d.packageId ?? d.PackageId ?? '').toString(),
        description: d.description ?? d.Description,
        status: d.status ?? d.Status ?? 'pending',
        type: d.disputeType ?? d.DisputeType ?? 'other',
        createdAt: d.createdAt ?? d.CreatedAt,
        complainantName: 'عميل', // Default as backend doesn't return name in list
        complainantType: 'customer'
      } as Dispute)))
    );
  }

  getDisputesAdmin(): Observable<Dispute[]> {
    return this.getDisputes();
  }

  // 10. Get Dispute by ID
  getDisputeDetails(id: number | string): Observable<Dispute> {
    return this.http.get<any>(`${this.apiUrl}/Dispute/${id}`).pipe(
      map(d => ({
        id: d.id ?? d.Id,
        orderId: (d.packageId ?? d.PackageId ?? '').toString(),
        description: d.description ?? d.Description,
        status: d.status ?? d.Status,
        type: d.disputeType ?? d.DisputeType,
        resolutionNotes: d.resolutionNotes ?? d.ResolutionNotes,
        resolution: d.resolutionNotes ?? d.ResolutionNotes, // Alias for UI
        proofPhotos: d.proofImages ?? d.ProofImages ?? [],
        statusHistory: (d.statusHistory ?? d.StatusHistory ?? []).map((h: any) => ({
          status: h.status ?? h.Status,
          changedAt: h.changedAt ?? h.ChangedAt
        })),
        createdAt: d.createdAt ?? d.CreatedAt,
        complainantName: 'عميل',
        complainantType: 'customer'
      } as Dispute))
    );
  }

  getDisputeByIdAdmin(id: string): Observable<Dispute> {
    return this.getDisputeDetails(id);
  }

  // Additional existing methods (restored for compatibility)

  getUsers(): Observable<AdminUserRow[]> {
    return this.searchUsers(); // Use the existing mapped search logic
  }

  unblockUser(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/BlockUser/${userId}`, {});
  }

  getSystemReport(period: string): Observable<SystemReport> {
    // Return empty/mock data instead of hitting non-existent endpoint to avoid timeouts
    return new Observable(observer => {
      observer.next({
        totalOrders: 0, totalOrdersChange: 0, activeCarriers: 0, activeCarriersChange: 0,
        totalRevenue: 0, revenueChange: 0, failedDeliveries: 0, failedDeliveriesChange: 0,
        pendingApprovals: 0, openDisputes: 0, completedDeliveries: 0, avgDeliveryTime: '0 mins'
      });
      observer.complete();
    });
  }

  getDailyStats(startDate: string, endDate: string): Observable<DailyStats[]> {
    return new Observable(observer => {
      observer.next([]);
      observer.complete();
    });
  }

  exportReport(dto: any): Observable<Blob> {
    return new Observable(observer => {
      observer.error('Export not implemented on backend');
    });
  }

  resolveDispute(disputeId: number | string, dto: { status: string, notes: string }): Observable<any> {
    // Backend ResolveDispute is currently commented out in controller
    return this.http.post(`${this.apiUrl}/ResolveDispute/${disputeId}`, dto);
  }
}
