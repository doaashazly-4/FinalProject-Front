import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/* ===================== MODELS ===================== */

export interface DeliveryJob {
  id: number;
  description: string;
  weight: number;
  shipmentCost: number;

  pickupAddress: string;
  dropoffAddress: string;

  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;

  customerName: string;
  receiverPhone: string;

  status: JobStatus;
  awaitingOTP?: boolean;
  otp?: string;
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

  // Missing properties
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

  constructor(private http: HttpClient) { }

  /* ===================== NORMALIZER (CORE FIX) ===================== */

  private mapBackendJob(job: any): DeliveryJob {
    const statusMap: Record<number | string, JobStatus> = {
      0: 'available',
      1: 'accepted',
      2: 'picked_up',
      3: 'in_transit',
      4: 'out_for_delivery',
      5: 'delivered',
      6: 'failed',
      7: 'returned',

      Assigned: 'accepted',
      PickupInProgress: 'picked_up',
      InTransit: 'in_transit',
      OutForDelivery: 'out_for_delivery',
      Delivered: 'delivered',
      Failed: 'failed',
      Cancelled: 'returned'
    };

    return {
      id: job.id,

      description:
        job.description ??
        job.requestDescription ??
        `طلب توصيل #${job.id}`,

      weight: job.weight ?? 0,

      shipmentCost:
        job.shipmentCost ??
        job.codAmount ??
        0,

      pickupAddress:
        job.pickupAddress ??
        job.pickupLocation ??
        'عنوان الاستلام غير متوفر',

      dropoffAddress:
        job.dropoffAddress ??
        job.destination ??
        'عنوان التسليم غير متوفر',

      pickupLat: job.pickupLat ?? 0,
      pickupLng: job.pickupLng ?? 0,

      destinationLat: job.destinationLat ?? 0,
      destinationLng: job.destinationLng ?? 0,

      customerName:
        job.customerName ??
        job.customer?.user?.userName ??
        'عميل',

      receiverPhone:
        job.receiverPhone ??
        job.customer?.user?.phoneNumber ??
        '',

      status: statusMap[job.status] ?? 'available',

      awaitingOTP: false
    };
  }

  /* ===================== DASHBOARD ===================== */

  getStats(): Observable<CourierStat[]> {
    return this.http.get<CourierStat[]>(`${this.apiUrl}/DashboardSummary`);
  }

  getEarnings(): Observable<CourierEarnings> {
    return this.http.get<CourierEarnings>(`${this.apiUrl}/Earnings`);
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

  getJobById(id: string): Observable<DeliveryJob> {
    return this.http
      .get<any>(`${this.apiUrl}/jobs/${id}`)
      .pipe(map(job => this.mapBackendJob(job)));
  }

  /* ===================== JOB ACTIONS ===================== */

  acceptJob(jobId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/AcceptPackage/${jobId}`, {});
  }

  rejectJob(jobId: number, reason?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/RejectPackage/${jobId}`, reason ?? '');
  }

  updateJobStatus(
    jobId: number,
    status: JobStatus,
    reason?: string,
    extra?: any
  ): Observable<any> {
    if (status === 'failed') {
      return this.http.post(`${this.apiUrl}/FailDelivery/${jobId}`, reason ?? '');
    }

    return this.http.post(
      `${this.apiUrl}/UpdateStatus/${jobId}?status=${status}`,
      extra ?? {}
    );
  }

  startDelivery(jobId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/StartDelivery/${jobId}`, {});
  }

  deliverPackage(jobId: number, customerOTP: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/DeliverPackage/${jobId}`, {
      customerOTP
    });
  }

  verifyDeliveryOTP(jobId: number, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/VerifyOTP/${jobId}`, otp, {
      responseType: 'text'
    });
  }

  pickupJob(jobId: number | string): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs/${jobId}/pickup`, {});
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
    return this.http.get<{ otpVerified: boolean }>(
      `${this.apiUrl}/CheckOTPStatus/${packageId}`
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
