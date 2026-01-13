import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../shared/services/notification.service';
import { NotificationHubService, DeliveryEvent } from '../../shared/services/notification-hub.service';


// Delivery interfaces for Receiver module
export interface IncomingDelivery {
  id: string;
  trackingNumber: string;
  description: string;
  senderName: string;
  senderPhone?: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: DeliveryStatus;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  createdAt: Date;
  weight: number;
  courierName?: string;
  courierPhone?: string;
  isFragile?: boolean;
  requiresSignature?: boolean;
  deliveryFee?: number;
  deliveryProofImage?: string;
  notes?: string;
  deliveryOTP?: string;
  otpVerified?: boolean;
}


export type DeliveryStatus =
  | 'pending'           // Waiting for courier
  | 'assigned'          // Courier assigned
  | 'picked_up'         // Courier picked up
  | 'in_transit'        // On the way
  | 'out_for_delivery'  // Near destination
  | 'delivered'         // Successfully delivered
  | 'failed_delivery'   // Delivery failed
  | 'returned'          // Returned to sender
  | 'cancelled';        // Cancelled

export interface ReceiverStat {
  label: string;
  value: number;
  icon: string;
  trend?: string;
  color?: string;
}

export interface ReceiverProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
}

export interface CustomerProfile {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  plan?: string;
}

export interface CustomerOrder {
  id: string;
  status: 'جارٍ التنفيذ' | 'مكتمل' | 'ملغي';
  destination: string;
  date: Date;
  amount: number;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  deliveryId?: string;
}

export interface DeliveryConfirmation {
  deliveryId: string;
  confirmed: boolean;
  rating?: number;
  feedback?: string;
  signature?: string;
}

export interface OTPRequest {
  phoneNumber: string;
}

export interface OTPVerification {
  phoneNumber: string;
  otp: string;
}

export interface DeliveryRating {
  deliveryId: string;
  rating: number; // 1-5 stars
  comment?: string;
}

export interface DeliveryNote {
  deliveryId: string;
  note: string;
}

export interface TimeChangeRequest {
  deliveryId: string;
  newTime: Date;
  reason?: string;
}

export interface CarrierLocation {
  lat: number;
  lng: number;
  timestamp: Date;
  courierId: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerDataService {
  private apiUrl = `${environment.apiUrl}/Customer`;


  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private hubService: NotificationHubService
  ) {
    // Listen for delivery events and show notifications
    this.hubService.deliveryEvent$.subscribe((event: DeliveryEvent) => {
      this.handleDeliveryEvent(event);
    });
  }

  private handleDeliveryEvent(event: DeliveryEvent): void {
    switch (event.type) {
      case 'courier_assigned':
        this.notificationService.notifyCourierAssigned({
          courierName: event.courierName,
          requestId: event.requestId
        });
        break;
      case 'delivery_started':
        this.notificationService.notifyDeliveryStarted({
          courierName: event.courierName,
          requestId: event.requestId
        });
        break;
      case 'out_for_delivery':
        this.notificationService.notifyOutForDelivery({
          courierName: event.courierName
        });
        break;
      case 'otp_requested':
        this.notificationService.notifyOTPRequired({});
        break;
      case 'delivered':
        this.notificationService.notifyDeliveryCompleted({
          requestId: event.requestId
        });
        break;
      case 'failed':
        this.notificationService.notifyDeliveryFailed({
          reason: event.message
        });
        break;
    }
  }

  private getCustomerId(): string {
    const id = localStorage.getItem('customer_id');
    if (!id) {
      throw new Error('Customer ID not found in session');
    }
    return id;
  }

  // ========== Stats ==========
  getStats(): Observable<ReceiverStat[]> {
    return this.getDeliveries().pipe(
      map((deliveries: IncomingDelivery[]) => {
        const total = deliveries.length;

        const delivered = deliveries.filter(
          (d: IncomingDelivery) => d.status === 'delivered'
        ).length;

        const active = deliveries.filter(
          (d: IncomingDelivery) =>
            !['delivered', 'cancelled', 'returned'].includes(d.status)
        ).length;

        return [
          {
            label: 'إجمالي الشحنات',
            value: total,
            icon: 'bi-box-seam'
          },
          {
            label: 'تم تسليمها',
            value: delivered,
            icon: 'bi-check-circle'
          },
          {
            label: 'قيد التوصيل',
            value: active,
            icon: 'bi-truck'
          }
        ];
      })
    );
  }

  //========== Deliveries ==========
  getDeliveries(): Observable<IncomingDelivery[]> {
    // First try the authenticated /packages endpoint
    return this.http.get<any[]>(`${this.apiUrl}/packages`).pipe(
      map(packages => {
        console.log('📦 Customer packages from API:', packages);
        return packages.map(pkg => this.mapToDelivery(pkg));
      }),
      catchError((err) => {
        console.warn('Failed to get packages via auth endpoint, trying phone fallback:', err);
        // Fallback to phone-based endpoint for non-registered customers
        const phone = localStorage.getItem('customer_mobile');
        if (!phone) {
          return of([]);
        }
        return this.http.get<any[]>(
          `${this.apiUrl}/MyOrders`,
          { params: { phoneNumber: phone } }
        ).pipe(
          map(orders => orders.map(order => this.mapToDelivery(order))),
          catchError(() => of([]))
        );
      })
    );
  }

  // Map API response to IncomingDelivery interface
  private mapToDelivery(data: any): IncomingDelivery {
    // Handle nested packages structure from create-shipment payload
    const pkg = (data.packages && data.packages.length > 0) ? data.packages[0] : (data.package || {});

    // Map status (backend now returns string like "Pending", "Assigned", etc.)
    const mapStatus = (s: any): DeliveryStatus => {
      if (typeof s === 'number') {
        switch (s) {
          case 0: return 'pending';
          case 1: return 'assigned';
          case 2: return 'picked_up';
          case 3: return 'in_transit';
          case 4: return 'out_for_delivery';
          case 5: return 'delivered';
          case 6: return 'failed_delivery';
          case 7: return 'cancelled';
          default: return 'pending';
        }
      }
      // Handle string statuses from backend
      const statusStr = (s || 'pending').toString().toLowerCase();
      const statusMap: Record<string, DeliveryStatus> = {
        'pending': 'pending',
        'assigned': 'assigned',
        'outfordelivery': 'out_for_delivery',
        'out_for_delivery': 'out_for_delivery',
        'delivered': 'delivered',
        'failed': 'failed_delivery',
        'cancelled': 'cancelled'
      };
      return statusMap[statusStr] || 'pending';
    };

    return {
      id: (data.id || data.requestId || data.ID || pkg.id)?.toString() || '',
      trackingNumber: (data.trackingNumber || data.requestId || data.id || data.ID)?.toString() || '',
      // Use new backend fields directly
      description: data.description || pkg.description || 'شحنة واردة',
      senderName: data.supplierName || data.source || data.senderName || data.Source || 'المورد',
      senderPhone: data.senderPhone || '',
      pickupAddress: data.source || data.Source || data.pickupAddress || '',
      deliveryAddress: data.destination || data.Destination || pkg.destination || data.deliveryAddress || '',
      status: mapStatus(data.status || pkg.status),
      estimatedDelivery: pkg.expireDate ? new Date(pkg.expireDate) : (data.estimatedDelivery ? new Date(data.estimatedDelivery) : undefined),
      actualDelivery: data.deliveredAt ? new Date(data.deliveredAt) : undefined,
      createdAt: new Date(data.createdAt || data.createDate || new Date()),
      weight: data.weight || pkg.weight || 0,
      // Courier info from new backend fields
      courierName: data.courierName || data.courier?.name,
      courierPhone: data.courierPhone || data.courier?.phone || data.receiverPhone,
      isFragile: data.fragile || pkg.fragile || pkg.isFragile || data.isFragile || false,
      requiresSignature: pkg.requiresSignature || data.requiresSignature || false,
      deliveryFee: data.shipmentCost || pkg.shipmentCost || data.deliveryFee || data.codAmount || 0,
      notes: data.notes || pkg.notes || data.shipmentNotes || '',
      deliveryOTP: data.deliveryOTP || data.otp,
      otpVerified: data.otpVerified || false
    };
  }




  getOrders(): Observable<CustomerOrder[]> {
    return this.getDeliveries().pipe(
      map(deliveries => deliveries.map(d => {
        let status: 'جارٍ التنفيذ' | 'مكتمل' | 'ملغي' = 'جارٍ التنفيذ';

        switch (d.status) {
          case 'delivered':
            status = 'مكتمل';
            break;
          case 'cancelled':
          case 'returned':
          case 'failed_delivery':
            status = 'ملغي';
            break;
          default:
            status = 'جارٍ التنفيذ';
        }

        return {
          id: d.id,
          status: status,
          destination: d.deliveryAddress,
          date: d.createdAt,
          amount: d.deliveryFee || 0
        };
      }))
    );
  }


  getDeliveriesByPhoneNumber(phoneNumber: string) {
    return this.http.get<IncomingDelivery[]>(
      `${environment.apiUrl}/Customer/packages/${phoneNumber}`
    );
  }


  getRecentDeliveries(): Observable<IncomingDelivery[]> {
    return this.http.get<IncomingDelivery[]>(`${this.apiUrl}/orders/recent`);
  }


  getDeliveryById(id: string): Observable<IncomingDelivery> {
    return this.http.get<IncomingDelivery>(`${this.apiUrl}/orders/${id}`);
  }

  trackDelivery(trackingNumber: string): Observable<IncomingDelivery> {
    return this.http.get<IncomingDelivery>(`${this.apiUrl}/orders/track/${trackingNumber}`);
  }

  trackPackage(packageId: number) {
    // If backend returns deliveryOTP directly or inside courier object, we want to expose it generally
    return this.http.get<any>(
      `${this.apiUrl}/TrackPackage/${packageId}`
    );
  }

  getMyOrders(phoneNumber: string) {
    return this.http.get<any[]>(
      `${this.apiUrl}/MyOrders`,
      { params: { phoneNumber } }
    );
  }

  confirmDelivery(confirmation: DeliveryConfirmation): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/orders/${confirmation.deliveryId}/confirm`, confirmation);
  }

  reportIssue(deliveryId: string, issue: string): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.apiUrl}/orders/${deliveryId}/issue`, { issue });
  }

  confirmDeliveryOTP(packageId: number, otp: string) {
    return this.http.post(
      `/api/Courier/VerifyOTP/${packageId}`,
      otp,
      { responseType: 'text' }
    );
  }

  getPackageOTP(packageId: number) {
    return this.http.get<{
      otp: string;
      verified: boolean;
    }>(`${this.apiUrl}/Customer/packages/${packageId}/otp`);
  }

  // ========== Profile ==========
  getProfile(): Observable<CustomerProfile> {
    return this.http.get<CustomerProfile>(`${this.apiUrl}/profile`);
  }

  updateProfile(profile: Partial<CustomerProfile>): Observable<CustomerProfile> {
    return this.http.put<CustomerProfile>(`${this.apiUrl}/profile`, profile);
  }

  // ========== Support ==========
  getTickets(): Observable<SupportTicket[]> {
    return this.http.get<SupportTicket[]>(`${this.apiUrl}/tickets`);
  }

  createTicket(ticket: Partial<SupportTicket>): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.apiUrl}/tickets`, ticket);
  }

  // ========== OTP Authentication ==========
  requestOTP(phoneNumber: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/auth/request-otp`, { phoneNumber });
  }

  verifyOTP(phoneNumber: string, otp: string): Observable<{ success: boolean; token?: string }> {
    return this.http.post<{ success: boolean; token?: string }>(`${this.apiUrl}/auth/verify-otp`, { phoneNumber, otp });
  }

  // ========== Delivery Communication ==========
  updateDeliveryNote(deliveryId: string, note: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/orders/${deliveryId}/notes`, { note });
  }

  requestTimeChange(deliveryId: string, newTime: Date, reason?: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/orders/${deliveryId}/change-time`, { newTime, reason });
  }

  markNotAvailableToday(deliveryId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/orders/${deliveryId}/not-available`, {});
  }

  // ========== Rating ==========
  rateDelivery(deliveryId: string, rating: number, comment?: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/orders/${deliveryId}/rate`, { rating, comment });
  }

  // ========== Real-time Tracking ==========
  getCarrierLocation(deliveryId: string): Observable<CarrierLocation> {
    return this.http.get<CarrierLocation>(`${this.apiUrl}/orders/${deliveryId}/carrier-location`);
  }

  // ========== Supplier Upgrade ==========
  requestSupplierUpgrade(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/upgrade-to-supplier`, {});
  }
}
