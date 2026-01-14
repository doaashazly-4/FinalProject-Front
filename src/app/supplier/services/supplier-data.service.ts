import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of, from } from 'rxjs';
import { AssignmentObservation } from '../../models/assignment-observation.model';

import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../shared/services/notification.service';
import { NotificationHubService } from '../../shared/services/notification-hub.service';




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

// Supplier tier categorization
export type SupplierTier = 'prime' | 'plus' | 'platinum';

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
  customerID?: string | number;

  // Supplier categorization
  supplierTier: SupplierTier;  // prime, plus, platinum
  isAutoAssigned?: boolean;     // true if auto-assigned (platinum urgent)

  // Backend Raw Fields (for compatibility)
  source?: string;
  requestId?: string;
  pickupLat?: number;
  pickupLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}

export interface FailedAttempt {
  attemptNumber: number;
  reason: string;
  timestamp: string;
  notes?: string;
}

export interface CreateRequestDTO {
  source: string,
  priority: string,
  pickupLat: number,
  pickupLng: number,
  packages: [
    {
      description: string,
      weight: number,
      fragile: boolean,
      shipmentCost: number,
      destination: string,

      lat: number,
      lng: number,
      expireDate: string,
      notes: string,
      customerID?: number,
      receiverName: string,
      receiverPhone: string
    }
  ]
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
  carrierName?: string; // For display in notifications
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

// ========= CUSTOMERS (UC-SUP-02 - assumed) =========

export interface Customer {
  id: number;
  phoneNumber: string;
  name?: string;
}



@Injectable({ providedIn: 'root' })
export class SupplierDataService {
  private apiUrl = `${environment.apiUrl}/Supplier`;

  // Cache for customers
  private customerCache: { data: Customer[], timestamp: number } | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private hubService: NotificationHubService
  ) { }

  // ================= SMART CREATE SHIPMENT (FR1, FR2, FR3) =================

  /**
   * Safe create parcel method with retry mechanism
   * 1. Try with original CustomerID
   * 2. Try with first valid CustomerID found in system
   * 3. Try with CustomerID = 0 (Safe Fallback)
   */
  createParcelSafe(dto: CreateRequestDTO): Observable<any> {
    return this.tryWithOriginalCustomerId(dto).pipe(
      catchError(err => {
        console.warn('Attempt 1 failed (Original ID). Retrying with first valid ID...', err);
        return this.tryWithFirstValidCustomerId(dto).pipe(
          catchError(err2 => {
            console.warn('Attempt 2 failed (First Valid ID). Retrying with ID 0...', err2);
            return this.tryWithCustomerIdZero(dto);
          })
        );
      })
    );
  }

  private tryWithOriginalCustomerId(dto: CreateRequestDTO): Observable<any> {
    console.log('Trying with Original CustomerID:', dto.packages[0].customerID);
    return this.createParcel(dto);
  }

  private tryWithFirstValidCustomerId(dto: CreateRequestDTO): Observable<any> {
    return this.getCustomers().pipe(
      switchMap(customers => {
        if (customers && customers.length > 0) {
          // Clone and update
          const newDto = JSON.parse(JSON.stringify(dto));
          // Try to match by phone first (if available in logic, but here we just take first valid as per strategy B/D fallback)
          // Better: If we have context about receiver phone, we could look it up. 
          // But DTO has phone inside packages logic? No, DTO has packages.
          // Let's just pick the first one as a generic fallback if specific one failed.
          newDto.packages[0].customerID = customers[0].id;
          console.log('Trying with First Valid CustomerID:', newDto.packages[0].customerID);
          return this.createParcel(newDto);
        }
        return throwError(() => new Error('No customers available for fallback'));
      })
    );
  }

  private tryWithCustomerIdZero(dto: CreateRequestDTO): Observable<any> {
    const newDto = JSON.parse(JSON.stringify(dto));
    newDto.packages[0].customerID = 0;
    console.log('Trying with CustomerID 0 (Safe Fallback)');
    return this.createParcel(newDto);
  }

  // ================= DASHBOARD =================

  getDashboardData(): Observable<SenderDashboardData> {
    return this.http.get<any>(`${this.apiUrl}/Dashboard`).pipe(
      map(data => ({
        ...data,
        recentParcels: (data.recentParcels || []).map((p: any) => this.mapToParcel(p))
      }))
    );
  }

  getStats(): Observable<SenderStat[]> {
    return this.http.get<SenderStat[]>(`${this.apiUrl}/Stats`);
  }

  // ================= PARCELS =================

  // getParcels(filter?: ParcelFilter): Observable<Parcel[]> {
  //   const params: any = {};
  //   if (filter) {
  //     if (filter.status) params.status = Array.isArray(filter.status) ? filter.status.join(',') : filter.status;
  //     if (filter.priority) params.priority = filter.priority;
  //     if (filter.dateFrom) params.dateFrom = filter.dateFrom;
  //     if (filter.dateTo) params.dateTo = filter.dateTo;
  //     if (filter.search) params.search = filter.search;
  //   }
  //   return this.http.get<Parcel[]>(`${this.apiUrl}/Request`, { params });
  // }

  // getParcelById(id: string): Observable<Parcel> {
  //   return this.http.get<Parcel>(`${this.apiUrl}/Request/${id}`);
  // }

  getParcels(filter?: ParcelFilter): Observable<Parcel[]> {
    const params: any = {};
    if (filter) {
      if (filter.status) params.status = Array.isArray(filter.status) ? filter.status.join(',') : filter.status;
      if (filter.priority) params.priority = filter.priority;
      if (filter.dateFrom) params.dateFrom = filter.dateFrom;
      if (filter.dateTo) params.dateTo = filter.dateTo;
      if (filter.search) params.search = filter.search;
    }

    return this.http.get<any[]>(
      `${environment.apiUrl}/Request`,
      { params }
    ).pipe(
      map(requests => requests.map(req => this.mapToParcel(req)))
    );
  }

  private mapToParcel(req: any): Parcel {
    // Helper to map numeric status to string
    const mapStatus = (s: any): string => {
      if (typeof s === 'number') {
        // Backend RequestStatus: 0:Pending, 1:Assigned, 2:Accepted, 3:PickupInProgress, 4:Delivered, 5:Cancelled
        // Backend PackageStatus: 0:Pending, 1:Assigned, 2:PickupInProgress, 3:OutForDelivery, 4:Delivered, 5:Cancelled, 6:Failed

        // We need a unified mapping. Since we use string statuses in FE:
        // 'pending', 'ready_for_pickup', 'assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned', 'cancelled'

        // Mapping based on observation of backend Enums:
        switch (s) {
          case 0: return 'pending';
          case 1: return 'assigned'; // or ready_for_pickup? Backend Assigned usually means courier assigned.
          case 2: return 'assigned'; // Accepted
          case 3: return 'picked_up'; // PickupInProgress roughly maps to picked up or in_transit
          case 4: return 'delivered';
          case 5: return 'cancelled';
          case 6: return 'failed_delivery';
          default: return 'pending';
        }
      }
      return (s || 'pending').toString().toLowerCase();
    };

    // If it's already a Parcel object and has the main identifying field, return it
    if (req.trackingNumber && req.deliveryAddress && req.status && typeof req.status === 'string') {
      return {
        ...req,
        status: req.status.toLowerCase() as ParcelStatus,
        isReadyForPickup: req.isReadyForPickup || (req.status.toLowerCase() === 'ready_for_pickup')
      };
    }

    // Handle nested packages structure if present
    const pkg = (req.packages && req.packages.length > 0) ? req.packages[0] : (req.package || {});

    const status = mapStatus(req.status || pkg.status);

    // Determine priority from isUrgent flag (API returns true/false)
    const isUrgent = req.isUrgent === true || req.isUrgent === 'true';
    const priority: ParcelPriority = isUrgent ? 'urgent' :
      (req.priority || req.Priority || 'normal').toLowerCase() as ParcelPriority;

    // ===============================================
    // REQUEST-ORIENTED TIER SYSTEM (not supplier-oriented)
    // ===============================================
    // - Prime:    Default request (created & submitted normally)
    // - Plus:     Supplier explicitly chose/assigned a courier 
    //             (still appears in available jobs with purple color, NOT auto-assigned)
    // - Platinum: Request marked as urgent (isUrgent = true)
    // ===============================================

    // Check if supplier explicitly assigned a courier to this request
    const hasAssignedCourier = !!(req.courierId || req.CourierId || req.assignedCourierId || pkg.courierId);

    // Check if this was a supplier-initiated assignment (they chose a specific courier)
    const isSupplierAssignment = hasAssignedCourier && !isUrgent;

    let supplierTier: SupplierTier = 'prime'; // Default: standard request

    if (isUrgent) {
      // Platinum: Urgent request (highest priority, marked with isUrgent flag)
      supplierTier = 'platinum';
    } else if (isSupplierAssignment) {
      // Plus: Supplier explicitly chose to assign this request to a specific courier
      // Note: This still appears in "available jobs" for the courier with distinctive purple styling
      // The courier can accept or reject - it's NOT auto-assigned
      supplierTier = 'plus';
    }
    // else: Prime (default) - standard request shown normally

    return {
      id: (req.requestId || req.id || req.ID)?.toString() || 'ID-' + Math.random().toString(36).substr(2, 9),
      trackingNumber: (req.trackingNumber || req.requestId || req.id || req.ID || req.RequestID)?.toString() || 'TRK-' + Math.random().toString(36).substr(2, 9),
      description: pkg.description || req.description || req.Description || 'شحنة بدون وصف',
      weight: pkg.weight || req.weight || req.Weight || 1,
      dimensions: pkg.dimensions || req.dimensions || '',
      pickupAddress: req.source || req.pickupAddress || req.Source || 'عنوان الاستلام',
      deliveryAddress: pkg.destination || req.deliveryAddress || req.Destination || 'عنوان التسليم',
      receiverName: pkg.receiverName || req.receiverName || req.CustomerName || pkg.customerName || 'عميل',
      receiverPhone: pkg.receiverPhone || req.receiverPhone || req.CustomerPhone || '-',
      receiverEmail: pkg.receiverEmail || req.receiverEmail || '',
      customerID: pkg.customerID || req.customerID || pkg.CustomerID || req.CustomerID || '-',
      status: status as ParcelStatus,
      priority,
      supplierTier,
      isAutoAssigned: isSupplierAssignment, // True if supplier explicitly assigned a courier
      createdAt: req.createDate || req.createdAt || req.CreatedAt || new Date().toISOString(),
      updatedAt: req.updatedAt || req.UpdatedAt,
      deliveryFee: req.deliveryFee || req.DeliveryFee || 0,
      codAmount: pkg.shipmentCost || req.codAmount || req.CodAmount || 0,
      isReadyForPickup: (status === 'ready_for_pickup') || req.isReadyForPickup || false,
      isFragile: pkg.fragile || req.isFragile || false,
      requiresSignature: pkg.requiresSignature || req.requiresSignature || false,
      notes: pkg.notes || req.notes || req.Notes || '',
      source: req.source || req.Source || req.pickupAddress,
      requestId: (req.requestId || req.id || req.RequestID || req.ID)?.toString(),
      pickupLat: req.pickupLat || req.PickupLat || 0,
      pickupLng: req.pickupLng || req.PickupLng || 0,
      destinationLat: pkg.lat || req.lat || 0,
      destinationLng: pkg.lng || pkg.lang || req.lng || req.lang || 0
    };
  }

  getParcelById(id: string): Observable<Parcel> {
    return this.http.get<any>(
      `${environment.apiUrl}/Request/${id}`
    ).pipe(
      map(res => this.mapToParcel(res))
    );
  }

  // ================= LYNX TALISMAN =================
  getAssignmentExplanation(requestId: string): Observable<AssignmentObservation | null> {
    return this.http.get<AssignmentObservation>(
      `${this.apiUrl}/Explanation/${requestId}`
    ).pipe(
      catchError(() => of(null)) // Silent fail as per requirements
    );
  }

  // ================= CREATE REQUEST =================

  createParcel(dto: CreateRequestDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/CreateRequest`, dto).pipe(
      tap((response: any) => {
        // Notify supplier that request was created successfully
        this.notificationService.notifyRequestCreated({
          requestId: response?.id || response?.requestId || 'جديد',
          description: dto.packages?.[0]?.description || 'شحنة جديدة'
        });

        // Trigger local event for couriers (will be broadcast via SignalR if available)
        this.hubService.triggerLocalEvent({
          type: dto.priority === 'urgent' ? 'urgent_request' : 'new_request',
          requestId: response?.id || response?.requestId || 0,
          description: dto.packages?.[0]?.description,
          priority: dto.priority as 'normal' | 'urgent',
          source: dto.source,
          destination: dto.packages?.[0]?.destination,
          receiverName: dto.packages?.[0]?.receiverName,
          receiverPhone: dto.packages?.[0]?.receiverPhone,
          timestamp: new Date()
        });
      })
    );
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
    ).pipe(
      tap((response: any) => {
        // Notify all parties about courier assignment
        this.notificationService.notifyCourierAssigned({
          courierName: dto.carrierName || 'مندوب',
          requestId: dto.orderId
        });

        // Trigger event for all users
        this.hubService.triggerLocalEvent({
          type: 'courier_assigned',
          requestId: dto.orderId,
          courierName: dto.carrierName,
          timestamp: new Date(),
          message: `تم تعيين المندوب ${dto.carrierName || 'مندوب'} للطلب #${dto.orderId}`
        });
      })
    );
  }

  // ================= TRACKING =================

  trackParcel(requestId: string): Observable<Parcel> {
    // First try to get full parcel data from the Request endpoint
    return this.getParcelById(requestId).pipe(
      catchError((err) => {
        console.warn('Failed to get parcel from Request endpoint, trying TrackOrder:', err);
        // Fallback to TrackOrder endpoint
        return this.http.get<any>(`${this.apiUrl}/TrackOrder/${requestId}`).pipe(
          map(res => ({
            id: res.requestId || requestId,
            trackingNumber: res.requestId || requestId,
            description: res.description || 'شحنة',
            weight: res.weight || 0,
            pickupAddress: res.source || '',
            deliveryAddress: res.destination || '',
            receiverName: res.receiverName || 'عميل',
            receiverPhone: res.receiverPhone || '-',
            status: (res.status || 'pending').toString().toLowerCase() as any,
            priority: (res.priority || 'normal').toLowerCase() as any,
            isReadyForPickup: false,
            deliveryFee: res.deliveryFee || 0,
            codAmount: res.codAmount || res.shipmentCost || 0,
            createdAt: res.createdAt || new Date().toISOString()
          }) as Parcel)
        );
      })
    );
  }

  // ================= TRACKING METHODS =================

  getParcelTimeline(parcelId: string): Observable<ParcelTimelineEvent[]> {
    return this.http.get<{ timeline: ParcelTimelineEvent[] }>(`${this.apiUrl}/TrackOrder/${parcelId}`)
      .pipe(
        map(res => res.timeline ?? []) // لو السيرفر بيرجع timeline جوه object
      );
  }


  getCarrierLiveLocation(parcelId: string): Observable<CarrierLiveLocation> {
    return this.http.get<CarrierLiveLocation>(`${this.apiUrl}/Request/${parcelId}/CarrierLocation`);
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

  // ================= Get CustomerNumber =================

  getCustomers(): Observable<Customer[]> {
    // Check cache
    if (this.customerCache && (Date.now() - this.customerCache.timestamp < this.CACHE_DURATION)) {
      return of(this.customerCache.data);
    }

    return this.http.get<Customer[]>(`${environment.apiUrl}/Customer`).pipe(
      tap(data => {
        this.customerCache = {
          data: data,
          timestamp: Date.now()
        };
      }),
      catchError(err => {
        console.error('Error fetching customers', err);
        return of([]); // Return empty array on error to allow graceful degradation
      })
    );
  }


  // ================= INVENTORY HELPERS =================

  getProductCategories(): Observable<string[]> {
    return this.getProducts().pipe(
      map(products => [...new Set(products.map(p => p.category))])
    );
  }

  getLowStockProducts(): Observable<SupplierProduct[]> {
    return this.getProducts().pipe(
      map(products => products.filter(p => p.quantity > 0 && p.quantity <= 10))
    );
  }

  getOutOfStockProducts(): Observable<SupplierProduct[]> {
    return this.getProducts().pipe(
      map(products => products.filter(p => p.quantity === 0))
    );
  }

  updateProductQuantity(id: string, quantity: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/Products/${id}`, { quantity });
  }

  // ================= ORDERS (Mapped from Parcels for UI) =================

  getOrders(): Observable<SupplierOrderRow[]> {
    return this.getParcels().pipe(
      map(parcels => parcels.map(p => this.mapParcelToOrderRow(p)))
    );
  }

  private mapParcelToOrderRow(p: Parcel): SupplierOrderRow {
    let uiStatus = 'pending';

    // Map backend status to UI status
    switch (p.status) {
      case 'ready_for_pickup':
        uiStatus = 'ready';
        break;
      case 'assigned':
      case 'picked_up':
      case 'in_transit':
      case 'out_for_delivery':
        uiStatus = 'shipping';
        break;
      case 'delivered':
        uiStatus = 'delivered';
        break;
      case 'cancelled':
      case 'failed_delivery':
      case 'returned':
        uiStatus = 'cancelled';
        break;
      default:
        uiStatus = 'pending';
    }

    return {
      id: p.id,
      customer: p.receiverName || 'Unknown Customer',
      destination: p.deliveryAddress || 'Unknown Destination',
      total: p.codAmount || 0,
      createdAt: p.createdAt,
      status: uiStatus
    };
  }

  matchCouriers(pickupLat: number, pickupLng: number) {
    return this.http.post<any[]>(
      `${environment.apiUrl}/Supplier/MatchCourier`,
      {
        pickupLat,
        pickupLng
      }
    );
  }

  updateOrderStatus(orderId: string, newStatus: string): Observable<SupplierOrderRow> {
    let action$: Observable<any>;

    switch (newStatus) {
      case 'ready':
        action$ = this.markReadyForPickup(orderId);
        break;
      case 'cancelled':
        action$ = this.cancelParcel(orderId);
        break;
      default:
        // For statuses we can't trigger, we just re-fetch to see if it changed externally 
        // or return current state.
        action$ = of({});
        console.log(`Update status to ${newStatus} requested but no API action mapped.`);
    }

    return action$.pipe(
      switchMap(() => this.getParcelById(orderId)),
      map(parcel => this.mapParcelToOrderRow(parcel))
    );
  }

}



export interface SupplierOrderRow {
  id: string;
  customer: string;
  destination: string;
  total: number;
  createdAt: string | Date;
  status: string;
}
