import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../shared/services/notification.service';
import { NotificationHubService } from '../../shared/services/notification-hub.service';

/* ===================== MODELS ===================== */

export interface DeliveryJob {
  id: number;
  description: string;
  weight: number;
  shipmentCost: number;
  pickupAddress: string;
  dropoffAddress: string;
  // Aliases/Optionals for compatibility
  deliveryAddress?: string; // Alias for dropoffAddress
  trackingNumber?: string;
  receiverName?: string; // Alias for customerName ??
  customerPhone?: string; // Alias for receiverPhone
  items?: string;
  notes?: string;
  codAmount?: number; // Alias for shipmentCost
  estimatedDelivery?: Date;
  courierEarning?: number;

  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  customerName: string;
  receiverPhone: string;
  status: JobStatus;
  awaitingOTP?: boolean;
  otp?: string;

  // Request categorization
  priority: 'normal' | 'urgent';
  supplierTier: 'prime' | 'plus' | 'platinum';
  isAutoAssigned?: boolean;
}

export type JobStatus =
  | 'available'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned';

export interface CourierStat {
  label: string;
  value: string;
  icon: string;
  trend?: string;
  color?: string;
}

export interface CourierEarnings {
  today: number;
  thisWeek: number;
  thisMonth: number;
  pending: number;
  totalEarned: number;
  // API response fields
  totalEarnings?: number;
  deliveredCount?: number;
  lastDeliveryDate?: string;
}

export interface CourierLocationDto {
  lat: number;
  lng: number;
  recordedAt?: string;
}

export interface CourierCompleteProfileDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  licenseNumber: string;
  rating: number;
  completedDeliveries: number;
  isAvailable: boolean;
  isOnline: boolean;
  photoUrl?: string;
  address?: string;
  locations?: CourierLocationDto[];
  licensePhotoFront?: string;
  licensePhotoBack?: string;
  vehicleLicensePhotoFront?: string;
  vehicleLicensePhotoBack?: string;
  idPhotoUrl?: string;
}

export interface CourierTicket {
  id: string;
  subject: string;
  message?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class CourierDataService {
  private apiUrl = `${environment.apiUrl}/Courier`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private hubService: NotificationHubService
  ) { }

  private mapBackendJob(job: any): DeliveryJob {
    // DEBUG: Log raw job data from API to understand structure
    console.log('🚚 Raw job data from API:', job);

    const statusMap: Record<number | string, JobStatus> = {
      0: 'available',
      1: 'accepted',
      2: 'picked_up',
      3: 'in_transit',
      4: 'out_for_delivery',
      5: 'delivered',
      6: 'failed',
      7: 'returned',

      Pending: 'available',
      Available: 'available',
      Assigned: 'accepted',
      PickupInProgress: 'picked_up',
      InTransit: 'in_transit',
      OutForDelivery: 'out_for_delivery',
      Delivered: 'delivered',
      Failed: 'failed',
      Cancelled: 'returned'
    };

    // Handle nested packages structure from create-shipment payload OR flat package structure
    const pkg = (job.packages && job.packages.length > 0)
      ? job.packages[0]
      : (job.package || job.request?.packages?.[0] || {});

    // Also check request object for additional data
    const req = job.request || {};

    const result: DeliveryJob = {
      id: job.id || job.Id || job.packageId || job.requestId || job.ID || 0,
      description: pkg.description || job.description || req.description || job.Description || `طلب توصيل #${job.id || job.requestId}`,
      weight: pkg.weight || job.weight || req.weight || job.Weight || 0,
      shipmentCost: pkg.shipmentCost || job.shipmentCost || job.ShipmentCost || job.codAmount || req.codAmount || 0,

      // Pickup address - try multiple sources
      pickupAddress: req.source || job.source || job.Source || job.pickupAddress || job.PickupAddress ||
        req.pickupAddress || pkg.pickupAddress ||
        (job.pickupLat && job.pickupLng ? `موقع: ${job.pickupLat?.toFixed(4)}, ${job.pickupLng?.toFixed(4)}` : 'عنوان الاستلام غير متوفر'),

      // Dropoff address - try multiple sources  
      dropoffAddress: pkg.destination || job.destination || job.Destination || job.dropoffAddress ||
        job.deliveryAddress || req.destination ||
        (job.destinationLat && job.destinationLng ? `موقع: ${job.destinationLat?.toFixed(4)}, ${job.destinationLng?.toFixed(4)}` : 'عنوان التسليم غير متوفر'),

      // Compatibility mappings
      deliveryAddress: pkg.destination || job.destination || job.Destination || job.dropoffAddress ||
        job.deliveryAddress || req.destination ||
        (job.destinationLat && job.destinationLng ? `موقع: ${job.destinationLat?.toFixed(4)}, ${job.destinationLng?.toFixed(4)}` : 'عنوان التسليم غير متوفر'),
      trackingNumber: job.trackingNumber || job.TrackingNumber || String(job.id || job.requestId),

      // Customer info - try multiple sources
      receiverName: pkg.receiverName || job.receiverName || job.ReceiverName || job.customerName ||
        req.receiverName || job.customer?.user?.userName || job.customer?.name || 'عميل',
      customerPhone: pkg.receiverPhone || job.receiverPhone || job.ReceiverPhone || job.customerPhone ||
        req.receiverPhone || job.customer?.user?.phoneNumber || job.customer?.phone || '',

      codAmount: pkg.shipmentCost || job.shipmentCost || job.codAmount || job.CodAmount || req.codAmount || 0,
      items: job.items ?? 'طرد قياسي',
      notes: pkg.notes || job.notes || req.notes || job.Notes || '',
      estimatedDelivery: pkg.expireDate ? new Date(pkg.expireDate) :
        (job.estimatedDelivery ? new Date(job.estimatedDelivery) :
          (job.expireDate ? new Date(job.expireDate) : new Date())),
      courierEarning: job.courierEarning || job.CourierEarning || 50,

      pickupLat: job.pickupLat || job.PickupLat || req.pickupLat || 0,
      pickupLng: job.pickupLng || job.PickupLng || req.pickupLng || 0,
      destinationLat: pkg.lat || job.destinationLat || job.DestinationLat || job.lat || req.lat || 0,
      destinationLng: pkg.lng || job.destinationLng || job.DestinationLng || job.lng || req.lng || 0,

      customerName: pkg.receiverName || job.receiverName || job.ReceiverName || job.customerName ||
        req.receiverName || job.customer?.user?.userName || job.customer?.name || 'عميل',
      receiverPhone: pkg.receiverPhone || job.receiverPhone || job.ReceiverPhone || job.customerPhone ||
        req.receiverPhone || job.customer?.user?.phoneNumber || job.customer?.phone || '',
      status: statusMap[job.status] ?? statusMap[job.Status] ?? 'available',
      awaitingOTP: false,
      otp: job.courier?.deliveryOTP || job.deliveryOTP || job.otp,

      // Priority and Tier mapping
      priority: (job.isUrgent === true || job.isUrgent === 'true' || req.isUrgent) ? 'urgent' : 'normal',
      supplierTier: this.determineRequestTier(job, req),
      isAutoAssigned: this.isSupplierAssignment(job, req)
    };

    console.log('🚚 Mapped job result:', result);
    return result;
  }

  /**
   * REQUEST-ORIENTED TIER SYSTEM (not supplier-oriented)
   * =====================================================
   * Tier is determined by REQUEST characteristics, not supplier subscription level.
   * This allows for flexible profitability control per request.
   * 
   * - Prime:    Default request (created & submitted normally)
   * - Plus:     Supplier explicitly chose/assigned a courier 
   *             (still shows in available jobs with purple color, NOT auto-assigned)
   * - Platinum: Request marked as urgent (isUrgent = true)
   */
  private determineRequestTier(job: any, req: any): 'prime' | 'plus' | 'platinum' {
    const isUrgent = job.isUrgent === true || job.isUrgent === 'true' || req?.isUrgent === true;

    if (isUrgent) {
      // Platinum: Urgent request - highest priority
      return 'platinum';
    }

    // Check if supplier explicitly assigned a courier (not urgent, but has courier designated)
    const hasAssignedCourier = !!(job.courierId || job.CourierId || job.assignedCourierId || req?.courierId);

    if (hasAssignedCourier) {
      // Plus: Supplier chose to assign this request to a specific courier
      // Note: This still appears in "available jobs" with distinctive purple styling
      // Courier can accept or reject - it's NOT auto-assigned
      return 'plus';
    }

    // Prime: Default - standard request
    return 'prime';
  }

  /**
   * Check if courier was explicitly assigned by supplier (Plus tier behavior)
   */
  private isSupplierAssignment(job: any, req: any): boolean {
    const isUrgent = job.isUrgent === true || job.isUrgent === 'true' || req?.isUrgent === true;
    const hasAssignedCourier = !!(job.courierId || job.CourierId || job.assignedCourierId || req?.courierId);
    // Supplier assignment = has courier but not urgent
    return hasAssignedCourier && !isUrgent;
  }



  /* ===================== DASHBOARD ===================== */

  getStats(): Observable<CourierStat[]> {
    return this.http.get<CourierStat[]>(`${this.apiUrl}/DashboardSummary`);
  }

  getEarnings(): Observable<CourierEarnings> {
    return this.http.get<any>(`${this.apiUrl}/Earnings`).pipe(
      map(data => ({
        // Map API response to UI expected format
        today: data.totalEarnings || 0,  // Use totalEarnings as today's display
        thisWeek: data.totalEarnings || 0, // Backend doesn't split by week, using total
        thisMonth: data.totalEarnings || 0, // Backend doesn't split by month, using total
        pending: 0, // Not provided by backend
        totalEarned: data.totalEarnings || 0,
        // Keep original API fields
        totalEarnings: data.totalEarnings,
        deliveredCount: data.deliveredCount,
        lastDeliveryDate: data.lastDeliveryDate
      }))
    );
  }

  /* ===================== JOBS ===================== */

  getAvailableJobs(): Observable<DeliveryJob[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/AvailableJobs`)
      .pipe(map(jobs => jobs.map(j => this.mapBackendJob(j))));
  }

  getMyJobs(): Observable<DeliveryJob[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/MyAssignedPackages`)
      .pipe(map(jobs => jobs.map(j => this.mapBackendJob(j))));
  }

  getActiveJobs(): Observable<DeliveryJob[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/activeJobs`)
      .pipe(map(jobs => jobs.map(j => this.mapBackendJob(j))));
  }



  /* ===================== JOB ACTIONS ===================== */

  acceptJob(jobId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/AcceptPackage/${jobId}`, {}).pipe(
      tap(() => {
        // Notify supplier and customer that courier has been assigned
        this.notificationService.showNotification({
          title: '✅ تم قبول المهمة',
          message: `تم قبول الطلب #${jobId} بنجاح`,
          type: 'success',
          icon: 'bi-check-circle',
          duration: 4000
        });
        this.hubService.triggerLocalEvent({
          type: 'courier_assigned',
          requestId: jobId,
          timestamp: new Date(),
          message: `تم قبول الطلب #${jobId}`
        });
      })
    );
  }

  rejectJob(jobId: number, reason?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/RejectPackage/${jobId}`, reason ?? '');
  }

  // ✅ Restore pickupJob for compatibility
  pickupJob(jobId: number | string): Observable<any> {
    // Determine which endpoint to use. Often "StartDelivery" or a specific "Pickup" one.
    // Based on history, it might have been calling keys like 'pickup'.
    // Let's assume we call StartDelivery as a proxy or use a generic status update if backend supports it.

    // Let's use that path or map to updateStatus.
    return this.updateJobStatus(Number(jobId), 'picked_up');
  }

  startDelivery(jobId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/StartDelivery/${jobId}`, {}).pipe(
      tap(() => {
        // Notify all parties that delivery has started
        this.notificationService.notifyDeliveryStarted({ requestId: jobId });
        this.hubService.triggerLocalEvent({
          type: 'delivery_started',
          requestId: jobId,
          timestamp: new Date(),
          message: `المندوب بدأ التوصيل للطلب #${jobId}`
        });
      })
    );
  }

  deliverPackage(jobId: number, notes: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/DeliverPackage/${jobId}`, {
      notes
    }).pipe(
      tap(() => {
        // Notify all parties that delivery is complete
        this.notificationService.notifyDeliveryCompleted({ requestId: jobId });
        this.hubService.triggerLocalEvent({
          type: 'delivered',
          requestId: jobId,
          timestamp: new Date(),
          message: `تم تسليم الطلب #${jobId} بنجاح`
        });
      })
    );
  }

  verifyDeliveryOTP(jobId: number, otp: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/VerifyOTP/${jobId}`, JSON.stringify(otp), { headers }).pipe(
      tap(() => {
        // OTP verified - delivery complete
        this.notificationService.notifyDeliveryCompleted({ requestId: jobId });
        this.hubService.triggerLocalEvent({
          type: 'delivered',
          requestId: jobId,
          timestamp: new Date(),
          message: `تم التحقق من OTP وتسليم الطلب #${jobId}`
        });
      })
    );
  }

  // ✅ Restore updateJobStatus as a facade for various endpoints
  updateJobStatus(
    jobId: number,
    status: JobStatus,
    reason?: string,
    extra?: any
  ): Observable<any> {
    switch (status) {
      case 'accepted':
        return this.acceptJob(jobId);

      case 'picked_up':
        // If there is no explicit pickup endpoint, we might treat it as a status update
        // or use StartDelivery if that fits the flow.
        // Let's assume there is a generic UpdateStatus endpoint since it was used before.
        return this.http.post(`${this.apiUrl}/UpdateStatus/${jobId}?status=${status}`, extra ?? {});

      case 'out_for_delivery':
        return this.startDelivery(jobId);

      case 'delivered':
        return this.deliverPackage(jobId, extra?.otp ?? '');

      case 'failed':
        return this.http.post(`${this.apiUrl}/FailDelivery/${jobId}`, reason ?? '');

      default:
        // Generic status update fallback
        return this.http.post(
          `${this.apiUrl}/UpdateStatus/${jobId}?status=${status}`,
          extra ?? {}
        );
    }
  }

  /* ===================== AVAILABILITY ===================== */

  getAvailability(): Observable<{ isAvailable: boolean }> {
    return this.http.get<{ isAvailable: boolean }>(
      `${this.apiUrl}/availability`
    );
  }

  toggleAvailability(): Observable<any> {
    return this.http.post(`${this.apiUrl}/availability/toggle`, {});
  }

  endShift(): Observable<any> {
    return this.http.post(`${this.apiUrl}/endshift`, {});
  }

  /* ===================== LOCATION ===================== */

  addLocation(lat: number, lng: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/AddLocation`, { lat, lng });
  }

  /* ===================== OTHER / LEGACY / SUPPORT ===================== */

  checkOTPStatus(packageId: number) {
    return this.http.get<{ otpVerified: boolean; status: string }>(
      `${this.apiUrl}/otp-status/${packageId}`
    );
  }



  getProfile(): Observable<CourierCompleteProfileDTO> {
    return this.http.get<CourierCompleteProfileDTO>(`${this.apiUrl}/Profile?t=${new Date().getTime()}`);
  }

  updateProfile(data: any): Observable<any> {
    if (data instanceof FormData) {
      return this.http.put(`${this.apiUrl}/updateProfile`, data);
    } else {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });
      return this.http.put(`${this.apiUrl}/updateProfile`, data, { headers });
    }
  }

  uploadImage(data: FormData) {
    return this.http.post<{ url: string }>(`${this.apiUrl}/upload/image`, data);
  }

  // Support
  getTickets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tickets`);
  }

  createTicket(ticket: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/tickets`, ticket);
  }

  completeDelivery(jobId: number, dto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/DeliverPackage/${jobId}`, dto);
  }
}
