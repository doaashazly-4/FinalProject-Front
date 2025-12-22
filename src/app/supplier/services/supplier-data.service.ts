import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, delay } from 'rxjs/operators';

// ========== PARCEL INTERFACES (UC-SUP-02) ==========

export type ParcelStatus = 
  | 'pending'           // Waiting for pickup confirmation
  | 'ready_for_pickup'  // Ready, waiting for carrier assignment
  | 'assigned'          // Carrier assigned
  | 'picked_up'         // Courier picked up the parcel
  | 'in_transit'        // On the way to receiver
  | 'out_for_delivery'  // Near destination
  | 'delivered'         // Successfully delivered
  | 'failed_delivery'   // Delivery attempt failed
  | 'returned'          // Returned to sender
  | 'cancelled';        // Cancelled by sender

export type ParcelPriority = 'normal' | 'urgent';

export interface Parcel {
  id: string;
  trackingNumber: string;
  description: string;
  weight: number;
  dimensions?: string;
  pickupAddress: string;
  deliveryAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail?: string;
  status: ParcelStatus;
  priority: ParcelPriority;
  estimatedDelivery?: string;
  actualDelivery?: string;
  createdAt: string;
  updatedAt?: string;
  courierId?: string;
  courierName?: string;
  courierPhone?: string;
  deliveryFee: number;
  codAmount: number; // Cash on delivery
  notes?: string;
  isFragile?: boolean;
  requiresSignature?: boolean;
  isReadyForPickup: boolean;
  failedAttempts?: FailedAttempt[];
  carrierRating?: number;
  carrierReview?: string;
}

export interface FailedAttempt {
  attemptNumber: number;
  reason: string;
  timestamp: string;
  notes?: string;
}

export interface CreateParcelDTO {
  description: string;
  weight: number;
  dimensions?: string;
  pickupAddress: string;
  deliveryAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail?: string;
  notes?: string;
  isFragile?: boolean;
  requiresSignature?: boolean;
  codAmount: number;
  priority: ParcelPriority;
}

export interface ParcelFilter {
  status?: ParcelStatus | ParcelStatus[];
  priority?: ParcelPriority;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// ========== CARRIER INTERFACES (UC-SUP-03) ==========

export interface AvailableCarrier {
  id: string;
  name: string;
  phone: string;
  photoUrl?: string;
  vehicleType: 'Motorcycle' | 'Car' | 'Van' | 'Truck';
  rating: number;
  totalDeliveries: number;
  isOnline: boolean;
  isAvailable: boolean;
  distanceKm: number;
  estimatedArrival: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

export interface AssignCarrierDTO {
  orderId: string;
  carrierId: string;
  notes?: string;
}

// ========== TRACKING INTERFACES (UC-SUP-04) ==========

export interface ParcelTimelineEvent {
  id: string;
  status: ParcelStatus;
  title: string;
  description: string;
  timestamp: string;
  location?: string;
  actor?: string;
  photoProof?: string;
}

export interface CarrierLiveLocation {
  carrierId: string;
  carrierName: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  updatedAt: string;
  estimatedArrival: string;
}

// ========== DASHBOARD & STATS INTERFACES ==========

export interface SenderStat {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  color?: string;
}

export interface SenderDashboardData {
  stats: SenderStat[];
  recentParcels: Parcel[];
  pendingCount: number;
  readyForPickupCount: number;
  inTransitCount: number;
  deliveredTodayCount: number;
  totalCodToday: number;
}

// ========== REPORTS INTERFACES (UC-SUP-05) ==========

export interface DailyReport {
  date: string;
  totalOrders: number;
  deliveredOrders: number;
  failedOrders: number;
  returnedOrders: number;
  totalCodCollected: number;
  totalDeliveryFees: number;
  averageDeliveryTime: string;
}

export interface ReportSummary {
  period: 'today' | 'week' | 'month';
  totalOrders: number;
  deliveredOrders: number;
  failedOrders: number;
  successRate: number;
  totalCodCollected: number;
  totalDeliveryFees: number;
  averageRating: number;
  topCarriers: { name: string; deliveries: number; rating: number }[];
}

export interface ExportReportDTO {
  startDate: string;
  endDate: string;
  format: 'pdf' | 'excel' | 'csv';
  includeDetails: boolean;
}

// ========== RATING INTERFACE ==========

export interface RateCarrierDTO {
  orderId: string;
  carrierId: string;
  rating: number;
  review?: string;
}

// ========== FEE CALCULATION ==========

export interface DeliveryFeeRequest {
  pickupAddress: string;
  deliveryAddress: string;
  weight: number;
  priority: ParcelPriority;
}

export interface DeliveryFeeResponse {
  baseFee: number;
  distanceFee: number;
  weightFee: number;
  priorityFee: number;
  totalFee: number;
  estimatedDistance: number;
  estimatedDuration: string;
}

// ========== SUPPLIER PROFILE ==========

export interface SupplierProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  businessName?: string;
  businessType?: string;
  isVerified: boolean;
  createdAt: string;
  totalOrders: number;
  averageRating: number;
}

// ========== PRODUCTS (UC-SUP-01 - assumed) ==========

export interface SupplierProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class SupplierDataService {
  calculateDeliveryFee(request: DeliveryFeeRequest): Observable<DeliveryFeeResponse> {
    return of(this.getMockDeliveryFee(request)).pipe(delay(500));
  }
  private apiUrl = 'https://localhost:7104/api/Supplier';

  constructor(private http: HttpClient) {}

  // ================= DASHBOARD =================

  getDashboardData(): Observable<SenderDashboardData> {
    // الباك معندوش dashboard → Mock مباشر
    return of(this.getMockDashboardData()).pipe(delay(300));
  }

  getStats(): Observable<SenderStat[]> {
    return of(this.getMockStats());
  }

  // ================= PARCELS =================

  getParcels(filter?: ParcelFilter): Observable<Parcel[]> {
    // الباك مفيهوش endpoint list orders
    return of(this.getMockParcels(filter)).pipe(delay(300));
  }

  getParcelById(id: string): Observable<Parcel> {
    return of(this.getMockParcels().find(p => p.id === id)!);
  }

  // ================= CREATE REQUEST =================

  createParcel(dto: CreateParcelDTO): Observable<any> {
    const backendDto = {
      source: dto.pickupAddress,
      priority: dto.priority,
      pickupLat: 0,
      pickupLng: 0,
      packages: [
        {
          description: dto.description,
          weight: dto.weight,
          fragile: dto.isFragile,
          shipmentCost: dto.codAmount,
          destination: dto.deliveryAddress,
          lat: 0,
          lng: 0
        }
      ]
    };

    return this.http.post(`${this.apiUrl}/CreateRequest`, backendDto).pipe(
      catchError(() => {
        console.warn('CreateRequest API failed → using MOCK');
        return of({
          message: 'Mock request created',
          requestId: Date.now()
        }).pipe(delay(500));
      })
    );
  }

  // ================= READY FOR PICKUP =================

  markReadyForPickup(orderId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/ConfirmReady/${orderId}`,
      {}
    ).pipe(
      catchError(() => {
        const parcel = this.getMockParcels().find(p => p.id === orderId);
        if (parcel) {
          parcel.status = 'ready_for_pickup';
          parcel.isReadyForPickup = true;
        }
        return of(parcel).pipe(delay(300));
      })
    );
  }

  // ================= ASSIGN COURIER =================

  assignCarrier(dto: AssignCarrierDTO): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/AssignCourier/${dto.orderId}`,
      { courierId: dto.carrierId }
    ).pipe(
      catchError(() => {
        const parcel = this.getMockParcels().find(p => p.id === dto.orderId);
        const carrier = this.getMockAvailableCarriers()
          .find(c => c.id === dto.carrierId);

        if (parcel && carrier) {
          parcel.status = 'assigned';
          parcel.courierId = carrier.id;
          parcel.courierName = carrier.name;
          parcel.courierPhone = carrier.phone;
        }
        return of(parcel).pipe(delay(400));
      })
    );
  }

  // ================= TRACKING =================

  trackParcel(requestId: string): Observable<Parcel> {
    return this.http.get<any>(`${this.apiUrl}/TrackOrder/${requestId}`).pipe(
      map(res => ({
        id: res.requestId,
        trackingNumber: res.requestId,
        status: res.status.toLowerCase(),
        isReadyForPickup: false,
        deliveryFee: 0,
        codAmount: 0,
        createdAt: new Date().toISOString()
      }) as Parcel),
      catchError(() => {
        const parcel = this.getMockParcels()
          .find(p => p.trackingNumber === requestId || p.id === requestId);
        return of(parcel!);
      })
    );
  }

  // ================= AVAILABLE COURIERS =================

  getAvailableCarriers(orderId: string): Observable<AvailableCarrier[]> {
    // الباك مش موفرها → Mock
    return of(this.getMockAvailableCarriers()).pipe(delay(300));
  }

  // ================= REPORTS =================

  getReportSummary(period: 'today' | 'week' | 'month'): Observable<ReportSummary> {
    return of(this.getMockReportSummary(period));
  }

  getDailyReports(startDate: string, endDate: string): Observable<DailyReport[]> {
    return of(this.getMockDailyReports());
  }

  exportReport(dto: ExportReportDTO): Observable<Blob> {
    return of(new Blob()).pipe(delay(500));
  }

  // ================= PROFILE =================

  getProfile(): Observable<SupplierProfile> {
    return of(this.getMockProfile());
  }

  updateProfile(profile: Partial<SupplierProfile>): Observable<SupplierProfile> {
    return of({ ...this.getMockProfile(), ...profile });
  }

  // ================= PRODUCTS =================

  getProducts(): Observable<SupplierProduct[]> {
    return of(this.getMockProducts()).pipe(delay(300));
  }

  deleteProduct(id: string): Observable<void> {
    return of(undefined).pipe(delay(500));
  }

  // ================= CANCEL PARCEL =================

  cancelParcel(id: string): Observable<void> {
    const parcel = this.getMockParcels().find(p => p.id === id);
    if (parcel) {
      parcel.status = 'cancelled';
    }
    return of(undefined).pipe(delay(400));
  }

  // ========== MOCK DATA ==========

  private getMockDashboardData(): SenderDashboardData {
    return {
      stats: this.getMockStats(),
      recentParcels: this.getMockParcels().slice(0, 5),
      pendingCount: 3,
      readyForPickupCount: 2,
      inTransitCount: 5,
      deliveredTodayCount: 12,
      totalCodToday: 2450
    };
  }

  private getMockStats(): SenderStat[] {
    return [
      { label: 'إجمالي الشحنات', value: '176', icon: 'bi-box-seam', trend: '+12%', color: 'green' },
      { label: 'قيد التوصيل', value: '8', icon: 'bi-truck', color: 'blue' },
      { label: 'تم التسليم اليوم', value: '12', icon: 'bi-check-circle', trend: '+5', color: 'emerald' },
      { label: 'في الانتظار', value: '5', icon: 'bi-clock', color: 'yellow' }
    ];
  }

  private getMockParcels(filter?: ParcelFilter): Parcel[] {
    const parcels: Parcel[] = [
      {
        id: '1',
        trackingNumber: 'PKG-2024-001',
        description: 'مستندات مهمة',
        weight: 0.5,
        pickupAddress: 'القاهرة - المعادي، شارع 9',
        deliveryAddress: 'الجيزة - المهندسين، شارع شهاب',
        receiverName: 'أحمد محمد',
        receiverPhone: '01012345678',
        status: 'in_transit',
        priority: 'normal',
        estimatedDelivery: new Date(Date.now() + 3600000).toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        deliveryFee: 35,
        codAmount: 250,
        courierName: 'محمد علي',
        courierPhone: '01098765432',
        courierId: 'C001',
        isReadyForPickup: true
      },
      {
        id: '2',
        trackingNumber: 'PKG-2024-002',
        description: 'هدية - قابل للكسر',
        weight: 2.5,
        pickupAddress: 'القاهرة - مصر الجديدة',
        deliveryAddress: 'الإسكندرية - سموحة',
        receiverName: 'سارة علي',
        receiverPhone: '01112345678',
        status: 'pending',
        priority: 'urgent',
        createdAt: new Date().toISOString(),
        deliveryFee: 75,
        codAmount: 500,
        isFragile: true,
        isReadyForPickup: false
      },
      {
        id: '3',
        trackingNumber: 'PKG-2024-003',
        description: 'ملابس',
        weight: 1.0,
        pickupAddress: 'القاهرة - التجمع الخامس',
        deliveryAddress: 'القاهرة - مدينة نصر',
        receiverName: 'خالد العمري',
        receiverPhone: '01234567890',
        status: 'delivered',
        priority: 'normal',
        actualDelivery: new Date(Date.now() - 172800000).toISOString(),
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        deliveryFee: 25,
        codAmount: 350,
        courierName: 'أحمد حسن',
        courierId: 'C002',
        isReadyForPickup: true,
        carrierRating: 5
      },
      {
        id: '4',
        trackingNumber: 'PKG-2024-004',
        description: 'إلكترونيات',
        weight: 3.0,
        pickupAddress: 'القاهرة - الزمالك',
        deliveryAddress: 'القاهرة - المقطم',
        receiverName: 'نورة السالم',
        receiverPhone: '01198765432',
        status: 'picked_up',
        priority: 'urgent',
        createdAt: new Date(Date.now() - 43200000).toISOString(),
        deliveryFee: 45,
        codAmount: 1200,
        courierName: 'علي محمود',
        courierId: 'C003',
        isFragile: true,
        requiresSignature: true,
        isReadyForPickup: true
      },
      {
        id: '5',
        trackingNumber: 'PKG-2024-005',
        description: 'كتب ومطبوعات',
        weight: 4.5,
        pickupAddress: 'القاهرة - وسط البلد',
        deliveryAddress: 'القاهرة - شبرا',
        receiverName: 'محمود حسين',
        receiverPhone: '01087654321',
        status: 'ready_for_pickup',
        priority: 'normal',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        deliveryFee: 30,
        codAmount: 150,
        isReadyForPickup: true
      },
      {
        id: '6',
        trackingNumber: 'PKG-2024-006',
        description: 'طلبية ملابس',
        weight: 2.0,
        pickupAddress: 'القاهرة - المعادي',
        deliveryAddress: 'الجيزة - الهرم',
        receiverName: 'فاطمة أحمد',
        receiverPhone: '01055667788',
        status: 'failed_delivery',
        priority: 'normal',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        deliveryFee: 40,
        codAmount: 600,
        courierName: 'كريم سعيد',
        courierId: 'C004',
        isReadyForPickup: true,
        failedAttempts: [
          {
            attemptNumber: 1,
            reason: 'العميل غير متواجد',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            notes: 'تم الاتصال 3 مرات بدون رد'
          }
        ]
      },
      {
        id: '7',
        trackingNumber: 'PKG-2024-007',
        description: 'أجهزة منزلية',
        weight: 5.0,
        pickupAddress: 'القاهرة - مدينة نصر',
        deliveryAddress: 'القاهرة - العباسية',
        receiverName: 'يوسف إبراهيم',
        receiverPhone: '01122334455',
        status: 'assigned',
        priority: 'normal',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        deliveryFee: 50,
        codAmount: 800,
        courierName: 'محمد سامي',
        courierPhone: '01099887766',
        courierId: 'C005',
        isReadyForPickup: true
      }
    ];

    if (filter?.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      return parcels.filter(p => statuses.includes(p.status));
    }

    return parcels;
  }

  private getMockAvailableCarriers(): AvailableCarrier[] {
    return [
      {
        id: 'C001',
        name: 'محمد علي',
        phone: '01098765432',
        photoUrl: '/assets/Images/courier1.jpg',
        vehicleType: 'Motorcycle',
        rating: 4.8,
        totalDeliveries: 342,
        isOnline: true,
        isAvailable: true,
        distanceKm: 1.2,
        estimatedArrival: '10 دقائق',
        currentLocation: { lat: 30.0444, lng: 31.2357 }
      },
      {
        id: 'C002',
        name: 'أحمد حسن',
        phone: '01012345678',
        photoUrl: '/assets/Images/courier2.jpg',
        vehicleType: 'Car',
        rating: 4.9,
        totalDeliveries: 567,
        isOnline: true,
        isAvailable: true,
        distanceKm: 2.5,
        estimatedArrival: '15 دقيقة',
        currentLocation: { lat: 30.0500, lng: 31.2400 }
      },
      {
        id: 'C003',
        name: 'علي محمود',
        phone: '01155667788',
        photoUrl: '/assets/Images/courier3.jpg',
        vehicleType: 'Motorcycle',
        rating: 4.6,
        totalDeliveries: 189,
        isOnline: true,
        isAvailable: true,
        distanceKm: 3.8,
        estimatedArrival: '20 دقيقة',
        currentLocation: { lat: 30.0600, lng: 31.2500 }
      },
      {
        id: 'C004',
        name: 'كريم سعيد',
        phone: '01199887766',
        photoUrl: '/assets/Images/courier4.jpg',
        vehicleType: 'Van',
        rating: 4.7,
        totalDeliveries: 421,
        isOnline: true,
        isAvailable: false,
        distanceKm: 4.2,
        estimatedArrival: '25 دقيقة',
        currentLocation: { lat: 30.0700, lng: 31.2600 }
      }
    ];
  }

  private getMockTimeline(orderId: string): ParcelTimelineEvent[] {
    return [
      {
        id: '1',
        status: 'pending',
        title: 'تم إنشاء الطلب',
        description: 'تم إنشاء طلب الشحن بنجاح',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        actor: 'المُرسل'
      },
      {
        id: '2',
        status: 'ready_for_pickup',
        title: 'جاهز للاستلام',
        description: 'الطرد جاهز لاستلامه من المندوب',
        timestamp: new Date(Date.now() - 82800000).toISOString(),
        actor: 'المُرسل'
      },
      {
        id: '3',
        status: 'assigned',
        title: 'تم تعيين مندوب',
        description: 'تم تعيين المندوب محمد علي',
        timestamp: new Date(Date.now() - 79200000).toISOString(),
        actor: 'النظام'
      },
      {
        id: '4',
        status: 'picked_up',
        title: 'تم الاستلام',
        description: 'المندوب استلم الطرد من موقع المُرسل',
        timestamp: new Date(Date.now() - 75600000).toISOString(),
        location: 'القاهرة - المعادي',
        actor: 'محمد علي'
      },
      {
        id: '5',
        status: 'in_transit',
        title: 'في الطريق',
        description: 'الطرد في طريقه إلى وجهة التسليم',
        timestamp: new Date(Date.now() - 72000000).toISOString(),
        actor: 'محمد علي'
      }
    ];
  }

  private getMockCarrierLocation(): CarrierLiveLocation {
    return {
      carrierId: 'C001',
      carrierName: 'محمد علي',
      lat: 30.0444,
      lng: 31.2357,
      heading: 45,
      speed: 25,
      updatedAt: new Date().toISOString(),
      estimatedArrival: '10 دقائق'
    };
  }

  private getMockReportSummary(period: 'today' | 'week' | 'month'): ReportSummary {
    const multiplier = period === 'today' ? 1 : period === 'week' ? 7 : 30;
    return {
      period,
      totalOrders: 15 * multiplier,
      deliveredOrders: 12 * multiplier,
      failedOrders: 2 * multiplier,
      successRate: 85.7,
      totalCodCollected: 2450 * multiplier,
      totalDeliveryFees: 525 * multiplier,
      averageRating: 4.7,
      topCarriers: [
        { name: 'محمد علي', deliveries: 45, rating: 4.9 },
        { name: 'أحمد حسن', deliveries: 38, rating: 4.8 },
        { name: 'علي محمود', deliveries: 32, rating: 4.7 }
      ]
    };
  }

  private getMockDailyReports(): DailyReport[] {
    const reports: DailyReport[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      reports.push({
        date: date.toISOString().split('T')[0],
        totalOrders: Math.floor(Math.random() * 20) + 10,
        deliveredOrders: Math.floor(Math.random() * 15) + 8,
        failedOrders: Math.floor(Math.random() * 3),
        returnedOrders: Math.floor(Math.random() * 2),
        totalCodCollected: Math.floor(Math.random() * 3000) + 1500,
        totalDeliveryFees: Math.floor(Math.random() * 500) + 300,
        averageDeliveryTime: `${Math.floor(Math.random() * 2) + 1}.${Math.floor(Math.random() * 5)} ساعة`
      });
    }
    return reports;
  }

  private getMockDeliveryFee(request: DeliveryFeeRequest): DeliveryFeeResponse {
    const baseFee = 15;
    const distanceFee = Math.floor(Math.random() * 20) + 10;
    const weightFee = request.weight > 5 ? (request.weight - 5) * 5 : 0;
    const priorityFee = request.priority === 'urgent' ? 20 : 0;
    
    return {
      baseFee,
      distanceFee,
      weightFee,
      priorityFee,
      totalFee: baseFee + distanceFee + weightFee + priorityFee,
      estimatedDistance: Math.floor(Math.random() * 15) + 5,
      estimatedDuration: `${Math.floor(Math.random() * 45) + 30} دقيقة`
    };
  }

  private getMockProfile(): SupplierProfile {
    return {
      id: 'SUP001',
      name: 'محمد أحمد',
      phone: '01012345678',
      email: 'supplier@example.com',
      address: 'القاهرة - المعادي، شارع 9، عمارة 15',
      businessName: 'متجر الأمل',
      businessType: 'ملابس وإكسسوارات',
      isVerified: true,
      createdAt: '2024-01-15',
      totalOrders: 176,
      averageRating: 4.8
    };
  }

  private getMockProducts(): SupplierProduct[] {
    return [
      {
        id: '1',
        name: 'تي شيرت قطن',
        description: 'تي شيرت قطن 100% عالي الجودة',
        price: 150,
        quantity: 50,
        category: 'ملابس',
        isActive: true,
        createdAt: '2024-01-01'
      },
      {
        id: '2',
        name: 'بنطلون جينز',
        description: 'بنطلون جينز أزرق كلاسيك',
        price: 300,
        quantity: 5,
        category: 'ملابس',
        isActive: true,
        createdAt: '2024-01-10'
      },
      {
        id: '3',
        name: 'حذاء رياضي',
        description: 'حذاء رياضي مريح للجري',
        price: 800,
        quantity: 0,
        category: 'أحذية',
        isActive: false,
        createdAt: '2024-02-01'
      }
    ];
  }
}
