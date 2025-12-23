import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Delivery job interfaces for Courier/Carrier module
export interface DeliveryJob {
  id: string;
  trackingNumber: string;
  description: string;
  weight: number;
  status: JobStatus;
  pickupAddress: string;
  deliveryAddress: string;
  pickupLocation: { lat: number; lng: number; address: string };
  dropoffLocation: { lat: number; lng: number; address: string };
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  customerName: string;
  customerPhone: string;
  codAmount: number;
  items: string;
  estimatedDelivery?: Date;
  createdAt: Date;
  acceptedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  deliveryFee: number;
  courierEarning: number;
  isFragile?: boolean;
  requiresSignature?: boolean;
  notes?: string;
  distance?: number;
}

export type JobStatus =
  | 'available'         // Available for pickup
  | 'accepted'          // Courier accepted the job
  | 'picked_up'         // Parcel picked up from sender
  | 'in_transit'        // On the way to receiver
  | 'out_for_delivery'  // Near receiver location
  | 'delivered'         // Successfully delivered
  | 'failed'            // Delivery failed
  | 'returned';         // Returned to sender

export interface CourierStat {
  label: string;
  value: string;
  icon: string;
  trend?: string;
  color?: string;
}

export interface CourierProfile {
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
  currentLocation?: { lat: number; lng: number };
}

export interface CourierEarnings {
  today: number;
  thisWeek: number;
  thisMonth: number;
  pending: number;
  totalEarned: number;
}

export interface DeliveryProof {
  jobId: string;
  photos?: string[];
  imageUrl?: string;
  otp?: string;
  signature?: string;
  notes?: string;
  timestamp: Date;
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

  constructor(private http: HttpClient) { }

  // ========== Online Status & Location ==========
  
  /**
   * 1️⃣ Get Online Status
   * GET /api/Courier/Online
   */
  getOnlineStatus(): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/Online`);
  }

  /**
   * 2️⃣ Add Location
   * POST /api/Courier/AddLocation
   */
  addLocation(lat: number, lng: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/AddLocation`, { lat, lng });
  }

  /**
   * 3️⃣ Toggle Online Status
   * POST /api/Courier/ToggleOnlineStatus
   * Note: This method is implemented below with backward compatibility
   */

  /**
   * 4️⃣ Match Courier
   * POST /api/Courier/MatchCourier
   */
  matchCourier(pickupLat: number, pickupLng: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/MatchCourier`, {
      pickupLat,
      pickupLng
    });
  }

  // ========== Packages ==========

  /**
   * 5️⃣ My Assigned Packages
   * GET /api/Courier/MyAssignedPackages
   */
  getMyAssignedPackages(): Observable<DeliveryJob[]> {
    return this.http.get<DeliveryJob[]>(`${this.apiUrl}/MyAssignedPackages`);
  }

  /**
   * 6️⃣ Accept Package
   * POST /api/Courier/AcceptPackage/{packageId}
   */
  acceptPackage(packageId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/AcceptPackage/${packageId}`, {});
  }

  /**
   * 7️⃣ Reject Package
   * POST /api/Courier/RejectPackage/{packageId}
   */
  rejectPackage(packageId: number, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/RejectPackage/${packageId}`, reason);
  }

  /**
   * 8️⃣ Update Status
   * POST /api/Courier/UpdateStatus/{packageId}?status={status}
   */
  updateStatus(packageId: number, status: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/UpdateStatus/${packageId}?status=${status}`, {});
  }

  /**
   * 9️⃣ Deliver Package
   * POST /api/Courier/DeliverPackage/{packageId}
   */
  deliverPackage(packageId: number, customerOTP: string, signatureUrl?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/DeliverPackage/${packageId}`, {
      customerOTP,
      signatureUrl: signatureUrl || ''
    });
  }

  /**
   * 🔟 Fail Delivery
   * POST /api/Courier/FailDelivery/{packageId}
   */
  failDelivery(packageId: number, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/FailDelivery/${packageId}`, reason);
  }

  /**
   * 1️⃣1️⃣ Delete Courier
   * DELETE /api/Courier/{id}
   */
  deleteCourier(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }


  // Legacy method - kept for backward compatibility
  // Use deliverPackage() method above instead
  deliverPackageLegacy(
    packageId: number,
    otp: string,
    signatureUrl?: string
  ) {
    return this.deliverPackage(packageId, otp, signatureUrl);
  }

  verifyDeliveryOTP(packageId: number, otp: string) {
    return this.http.post(
      `${this.apiUrl}/VerifyOTP/${packageId}`,
      otp,
      { responseType: 'text' }
    );
  }


  // ========== Stats ==========
  getStats(): Observable<CourierStat[]> {
    return this.http.get<CourierStat[]>(`${this.apiUrl}/stats`);
  }

  checkOTPStatus(packageId: number) {
    return this.http.get<{ otpVerified: boolean }>(
      `${this.apiUrl}/Courier/CheckOTPStatus/${packageId}`
    );
  }


  // ========== Jobs ==========
  getAvailableJobs(): Observable<DeliveryJob[]> {
    return this.http.get<DeliveryJob[]>(`${this.apiUrl}/jobs/available`);
  }

  getMyJobs(): Observable<DeliveryJob[]> {
    // Try new API first, fallback to old
    return this.http.get<DeliveryJob[]>(`${this.apiUrl}/MyAssignedPackages`).pipe(
      catchError(() => this.http.get<DeliveryJob[]>(`${this.apiUrl}/jobs`))
    );
  }

  getActiveJobs(): Observable<DeliveryJob[]> {
    return this.http.get<DeliveryJob[]>(`${this.apiUrl}/jobs/active`);
  }

  getJobById(id: string): Observable<DeliveryJob> {
    return this.http.get<DeliveryJob>(`${this.apiUrl}/jobs/${id}`);
  }

  acceptJob(jobId: string): Observable<DeliveryJob> {
    // Try new API first, fallback to old
    const packageId = parseInt(jobId);
    if (!isNaN(packageId)) {
      return this.http.post<DeliveryJob>(`${this.apiUrl}/AcceptPackage/${packageId}`, {}).pipe(
        catchError(() => this.http.post<DeliveryJob>(`${this.apiUrl}/jobs/${jobId}/accept`, {}))
      );
    }
    return this.http.post<DeliveryJob>(`${this.apiUrl}/jobs/${jobId}/accept`, {});
  }

  rejectJob(jobId: string, reason?: string): Observable<void> {
    // Try new API first, fallback to old
    const packageId = parseInt(jobId);
    if (!isNaN(packageId) && reason) {
      return this.http.post<void>(`${this.apiUrl}/RejectPackage/${packageId}`, reason).pipe(
        catchError(() => this.http.post<void>(`${this.apiUrl}/jobs/${jobId}/reject`, { reason }))
      );
    }
    return this.http.post<void>(`${this.apiUrl}/jobs/${jobId}/reject`, { reason });
  }

  pickupJob(jobId: string): Observable<DeliveryJob> {
    return this.http.post<DeliveryJob>(`${this.apiUrl}/jobs/${jobId}/pickup`, {});
  }

  startDelivery(jobId: string): Observable<DeliveryJob> {
    return this.http.post<DeliveryJob>(`${this.apiUrl}/jobs/${jobId}/start-delivery`, {});
  }

  completeJob(jobId: string, proof: DeliveryProof): Observable<DeliveryJob> {
    return this.http.post<DeliveryJob>(`${this.apiUrl}/jobs/${jobId}/complete`, proof);
  }

  failJob(jobId: string, reason: string): Observable<DeliveryJob> {
    // Try new API first, fallback to old
    const packageId = parseInt(jobId);
    if (!isNaN(packageId)) {
      return this.http.post<DeliveryJob>(`${this.apiUrl}/FailDelivery/${packageId}`, reason).pipe(
        catchError(() => this.http.post<DeliveryJob>(`${this.apiUrl}/jobs/${jobId}/fail`, { reason }))
      );
    }
    return this.http.post<DeliveryJob>(`${this.apiUrl}/jobs/${jobId}/fail`, { reason });
  }

  updateJobStatus(jobId: string, status: JobStatus, reason?: string, additionalData?: any): Observable<DeliveryJob> {
    const body = { status, reason, ...additionalData };
    return this.http.patch<DeliveryJob>(`${this.apiUrl}/jobs/${jobId}/status`, body);
  }

  // ========== Profile & Status ==========
  getProfile(): Observable<CourierProfile> {
    return this.http.get<CourierProfile>(`${this.apiUrl}/profile`);
  }

  updateProfile(profile: Partial<CourierProfile>): Observable<CourierProfile> {
    return this.http.put<CourierProfile>(`${this.apiUrl}/profile`, profile);
  }

  toggleAvailability(isAvailable: boolean): Observable<CourierProfile> {
    return this.http.patch<CourierProfile>(`${this.apiUrl}/availability`, { isAvailable });
  }

  toggleOnlineStatus(isOnline?: boolean): Observable<CourierProfile | any> {
    // New API doesn't require parameters - just toggles status
    return this.http.post<any>(`${this.apiUrl}/ToggleOnlineStatus`, {}).pipe(
      catchError(() => {
        // Fallback to old API if provided
        if (isOnline !== undefined) {
          return this.http.patch<CourierProfile>(`${this.apiUrl}/online-status`, { isOnline });
        }
        throw new Error('Failed to toggle online status');
      })
    );
  }

  updateLocation(lat: number, lng: number): Observable<void> {
    // Try new API first, fallback to old
    return this.http.post<void>(`${this.apiUrl}/AddLocation`, { lat, lng }).pipe(
      catchError(() => this.http.post<void>(`${this.apiUrl}/location`, { latitude: lat, longitude: lng }))
    );
  }

  // ========== Earnings ==========
  getEarnings(): Observable<CourierEarnings> {
    return this.http.get<CourierEarnings>(`${this.apiUrl}/earnings`);
  }

  // ========== Support ==========
  getTickets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tickets`);
  }

  createTicket(ticket: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/tickets`, ticket);
  }

}
