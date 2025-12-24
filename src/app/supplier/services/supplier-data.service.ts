import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
  private apiUrl = `${environment.apiUrl}/Supplier`;

  constructor(private http: HttpClient) {}

  // ================= DASHBOARD =================

  getDashboardData(): Observable<SenderDashboardData> {
    return this.http.get<SenderDashboardData>(`${this.apiUrl}/Dashboard`);
  }

  getStats(): Observable<SenderStat[]> {
    return this.http.get<SenderStat[]>(`${this.apiUrl}/Stats`);
  }

  // ================= PARCELS =================

  getParcels(filter?: ParcelFilter): Observable<Parcel[]> {
    const params: any = {};
    if (filter) {
      if (filter.status) params.status = Array.isArray(filter.status) ? filter.status.join(',') : filter.status;
      if (filter.priority) params.priority = filter.priority;
      if (filter.dateFrom) params.dateFrom = filter.dateFrom;
      if (filter.dateTo) params.dateTo = filter.dateTo;
      if (filter.search) params.search = filter.search;
    }
    return this.http.get<Parcel[]>(`${this.apiUrl}/Parcels`, { params });
  }

  getParcelById(id: string): Observable<Parcel> {
    return this.http.get<Parcel>(`${this.apiUrl}/Parcel/${id}`);
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

    return this.http.post(`${this.apiUrl}/CreateRequest`, backendDto);
  }

  // ================= READY FOR PICKUP =================

  markReadyForPickup(orderId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/ConfirmReady/${orderId}`, {});
  }

  // ================= ASSIGN COURIER =================

  assignCarrier(dto: AssignCarrierDTO): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/AssignCourier/${dto.orderId}`,
      { courierId: dto.carrierId }
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
      }) as Parcel)
    );
  }

  // ================= TRACKING METHODS =================

  getParcelTimeline(parcelId: string): Observable<ParcelTimelineEvent[]> {
    return this.http.get<ParcelTimelineEvent[]>(`${this.apiUrl}/Parcel/${parcelId}/Timeline`);
  }

  getCarrierLiveLocation(parcelId: string): Observable<CarrierLiveLocation> {
    return this.http.get<CarrierLiveLocation>(`${this.apiUrl}/Parcel/${parcelId}/CarrierLocation`);
  }

  rateCarrier(dto: RateCarrierDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/RateCarrier`, dto);
  }

  // ================= AVAILABLE COURIERS =================

  getAvailableCarriers(orderId: string): Observable<AvailableCarrier[]> {
    return this.http.get<AvailableCarrier[]>(`${this.apiUrl}/AvailableCarriers/${orderId}`);
  }

  // ================= REPORTS =================

  getReportSummary(period: 'today' | 'week' | 'month'): Observable<ReportSummary> {
    return this.http.get<ReportSummary>(`${this.apiUrl}/Reports/Summary?period=${period}`);
  }

  getDailyReports(startDate: string, endDate: string): Observable<DailyReport[]> {
    return this.http.get<DailyReport[]>(`${this.apiUrl}/Reports/Daily?startDate=${startDate}&endDate=${endDate}`);
  }

  exportReport(dto: ExportReportDTO): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/Reports/Export`, dto, { responseType: 'blob' });
  }

  // ================= PROFILE =================

  getProfile(): Observable<SupplierProfile> {
    return this.http.get<SupplierProfile>(`${this.apiUrl}/Profile`);
  }

  updateProfile(profile: Partial<SupplierProfile>): Observable<SupplierProfile> {
    return this.http.put<SupplierProfile>(`${this.apiUrl}/Profile`, profile);
  }

  // ================= PRODUCTS =================

  getProducts(): Observable<SupplierProduct[]> {
    return this.http.get<SupplierProduct[]>(`${this.apiUrl}/Products`);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Products/${id}`);
  }

  // ================= CANCEL PARCEL =================

  cancelParcel(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/CancelParcel/${id}`, {});
  }

  // ================= FEE CALCULATION =================

  calculateDeliveryFee(request: DeliveryFeeRequest): Observable<DeliveryFeeResponse> {
    return this.http.post<DeliveryFeeResponse>(`${this.apiUrl}/CalculateFee`, request);
  }
}
