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


  deliverPackage(
    packageId: number,
    otp: string,
    signatureUrl?: string
  ) {
    return this.http.post(`/api/packages/${packageId}/deliver`, {
      customerOTP: otp,
      signatureUrl
    });
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
    return this.http.get<CourierStat[]>(`${this.apiUrl}/stats`).pipe(
      catchError(() => of(this.getMockStats()))
    );
  }

  checkOTPStatus(packageId: number) {
    return this.http.get<{ otpVerified: boolean }>(
      `${this.apiUrl}/Courier/CheckOTPStatus/${packageId}`
    );
  }


  // ========== Jobs ==========
  getAvailableJobs(): Observable<DeliveryJob[]> {
    return this.http.get<DeliveryJob[]>(`${this.apiUrl}/jobs/available`).pipe(
      catchError(() => of(this.getMockAvailableJobs()))
    );
  }

  getMyJobs(): Observable<DeliveryJob[]> {
    return this.http.get<DeliveryJob[]>(`${this.apiUrl}/jobs`).pipe(
      catchError(() => of(this.getMockMyJobs()))
    );
  }

  getActiveJobs(): Observable<DeliveryJob[]> {
    return this.http.get<DeliveryJob[]>(`${this.apiUrl}/jobs/active`).pipe(
      catchError(() => of(this.getMockMyJobs().filter(j => !['delivered', 'failed', 'returned'].includes(j.status))))
    );
  }

  getJobById(id: string): Observable<DeliveryJob> {
    return this.http.get<DeliveryJob>(`${this.apiUrl}/jobs/${id}`).pipe(
      catchError(() => of(this.getMockMyJobs().find(j => j.id === id)!))
    );
  }

  acceptJob(jobId: string): Observable<DeliveryJob> {
    return this.http.post<DeliveryJob>(`${this.apiUrl}/jobs/${jobId}/accept`, {});
  }

  rejectJob(jobId: string, reason?: string): Observable<void> {
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

  toggleOnlineStatus(isOnline: boolean): Observable<CourierProfile> {
    return this.http.patch<CourierProfile>(`${this.apiUrl}/online-status`, { isOnline });
  }

  updateLocation(lat: number, lng: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/location`, { latitude: lat, longitude: lng });
  }

  // ========== Earnings ==========
  getEarnings(): Observable<CourierEarnings> {
    return this.http.get<CourierEarnings>(`${this.apiUrl}/earnings`).pipe(
      catchError(() => of({
        today: 125,
        thisWeek: 875,
        thisMonth: 3250,
        pending: 250,
        totalEarned: 15750
      }))
    );
  }

  // ========== Support ==========
  getTickets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tickets`);
  }

  createTicket(ticket: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/tickets`, ticket);
  }

  // ========== Mock Data ==========
  private getMockStats(): CourierStat[] {
    return [
      { label: 'التوصيلات اليوم', value: '8', icon: 'bi-box-seam', trend: '+2', color: 'green' },
      { label: 'في الطريق', value: '2', icon: 'bi-truck', color: 'blue' },
      { label: 'أرباح اليوم', value: '125 ج.م', icon: 'bi-cash', trend: '+15%', color: 'emerald' },
      { label: 'التقييم', value: '4.9', icon: 'bi-star-fill', color: 'yellow' }
    ];
  }

  private getMockAvailableJobs(): DeliveryJob[] {
    return [
      {
        id: 'job-1',
        trackingNumber: 'PKG-2024-201',
        description: 'مستندات مهمة',
        weight: 0.5,
        status: 'available',
        pickupAddress: 'القاهرة - المعادي، شارع 9، عمارة 12',
        deliveryAddress: 'الجيزة - المهندسين، شارع شهاب، عمارة 5',
        pickupLocation: { lat: 29.9667, lng: 31.2833, address: 'القاهرة - المعادي، شارع 9، عمارة 12' },
        dropoffLocation: { lat: 30.0667, lng: 31.2, address: 'الجيزة - المهندسين، شارع شهاب، عمارة 5' },
        senderName: 'شركة الأعمال',
        senderPhone: '01012345678',
        receiverName: 'أحمد محمد',
        receiverPhone: '01098765432',
        customerName: 'أحمد محمد',
        customerPhone: '01098765432',
        codAmount: 0,
        items: 'مستندات',
        createdAt: new Date(Date.now() - 3600000),
        deliveryFee: 35,
        courierEarning: 25,
        distance: 12.5
      },
      {
        id: 'job-2',
        trackingNumber: 'PKG-2024-202',
        description: 'هدية - قابل للكسر',
        weight: 2.0,
        status: 'available',
        pickupAddress: 'القاهرة - مصر الجديدة، شارع النزهة',
        deliveryAddress: 'القاهرة - مدينة نصر، شارع عباس العقاد',
        pickupLocation: { lat: 30.1167, lng: 31.3333, address: 'القاهرة - مصر الجديدة، شارع النزهة' },
        dropoffLocation: { lat: 30.0667, lng: 31.3333, address: 'القاهرة - مدينة نصر، شارع عباس العقاد' },
        senderName: 'سارة علي',
        senderPhone: '01112345678',
        receiverName: 'نورة محمود',
        receiverPhone: '01187654321',
        customerName: 'نورة محمود',
        customerPhone: '01187654321',
        codAmount: 300,
        items: 'هدية',
        createdAt: new Date(Date.now() - 7200000),
        deliveryFee: 45,
        courierEarning: 32,
        isFragile: true,
        distance: 8.3
      },
      {
        id: 'job-3',
        trackingNumber: 'PKG-2024-203',
        description: 'ملابس',
        weight: 1.5,
        status: 'available',
        pickupAddress: 'القاهرة - التجمع الخامس',
        deliveryAddress: 'القاهرة - الرحاب',
        pickupLocation: { lat: 30.0333, lng: 31.4667, address: 'القاهرة - التجمع الخامس' },
        dropoffLocation: { lat: 30.0667, lng: 31.4833, address: 'القاهرة - الرحاب' },
        senderName: 'متجر الأزياء',
        senderPhone: '01234567890',
        receiverName: 'خالد العمري',
        receiverPhone: '01076543210',
        customerName: 'خالد العمري',
        customerPhone: '01076543210',
        codAmount: 250,
        items: 'ملابس',
        createdAt: new Date(Date.now() - 1800000),
        deliveryFee: 30,
        courierEarning: 22,
        distance: 5.2
      }
    ];
  }

  private getMockMyJobs(): DeliveryJob[] {
    return [
      {
        id: 'myjob-1',
        trackingNumber: 'PKG-2024-198',
        description: 'طرد إلكتروني',
        weight: 3.0,
        status: 'in_transit',
        pickupAddress: 'القاهرة - وسط البلد',
        deliveryAddress: 'القاهرة - المقطم، الهضبة الوسطى',
        pickupLocation: { lat: 30.0444, lng: 31.2357, address: 'القاهرة - وسط البلد' },
        dropoffLocation: { lat: 30.1167, lng: 31.3167, address: 'القاهرة - المقطم، الهضبة الوسطى' },
        senderName: 'متجر الإلكترونيات',
        senderPhone: '01055555555',
        receiverName: 'محمد حسن',
        receiverPhone: '01066666666',
        customerName: 'محمد حسن',
        customerPhone: '01066666666',
        codAmount: 500,
        items: 'هاتف محمول، شاحن',
        createdAt: new Date(Date.now() - 86400000),
        acceptedAt: new Date(Date.now() - 3600000),
        pickedUpAt: new Date(Date.now() - 1800000),
        deliveryFee: 50,
        courierEarning: 35,
        isFragile: true,
        requiresSignature: true
      },
      {
        id: 'myjob-2',
        trackingNumber: 'PKG-2024-197',
        description: 'كتب',
        weight: 4.5,
        status: 'accepted',
        pickupAddress: 'القاهرة - الزمالك',
        deliveryAddress: 'القاهرة - شبرا',
        pickupLocation: { lat: 30.0667, lng: 31.2167, address: 'القاهرة - الزمالك' },
        dropoffLocation: { lat: 30.0833, lng: 31.2833, address: 'القاهرة - شبرا' },
        senderName: 'مكتبة النور',
        senderPhone: '01077777777',
        receiverName: 'علي أحمد',
        receiverPhone: '01088888888',
        customerName: 'علي أحمد',
        customerPhone: '01088888888',
        codAmount: 200,
        items: 'كتب مدرسية',
        createdAt: new Date(Date.now() - 43200000),
        acceptedAt: new Date(Date.now() - 600000),
        deliveryFee: 40,
        courierEarning: 28
      },
      {
        id: 'myjob-3',
        trackingNumber: 'PKG-2024-195',
        description: 'أدوات مكتبية',
        weight: 2.0,
        status: 'delivered',
        pickupAddress: 'القاهرة - مدينة نصر',
        deliveryAddress: 'القاهرة - المعادي',
        pickupLocation: { lat: 30.0667, lng: 31.3333, address: 'القاهرة - مدينة نصر' },
        dropoffLocation: { lat: 29.9667, lng: 31.2833, address: 'القاهرة - المعادي' },
        senderName: 'شركة المستلزمات',
        senderPhone: '01099999999',
        receiverName: 'سامي يوسف',
        receiverPhone: '01011111111',
        customerName: 'سامي يوسف',
        customerPhone: '01011111111',
        codAmount: 150,
        items: 'أقلام، ورق، مجلدات',
        createdAt: new Date(Date.now() - 172800000),
        acceptedAt: new Date(Date.now() - 86400000),
        pickedUpAt: new Date(Date.now() - 82800000),
        deliveredAt: new Date(Date.now() - 79200000),
        deliveryFee: 35,
        courierEarning: 25
      }
    ];
  }
}
