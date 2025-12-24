import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';


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

// ================= MOCK DATA (TEMPORARY) =================

const MOCK_DELIVERIES: IncomingDelivery[] = [
  {
    id: '101',
    trackingNumber: 'PKG-101',
    description: 'شحنة إلكترونيات',
    senderName: 'متجر الإلكترونيات',
    pickupAddress: 'القاهرة - مدينة نصر',
    deliveryAddress: 'الجيزة - الدقي',
    status: 'out_for_delivery',
    estimatedDelivery: new Date(),
    createdAt: new Date(),
    weight: 2.5,
    courierName: 'أحمد',
    courierPhone: '01012345678',
    isFragile: true,
    requiresSignature: true
  },
  {
    id: '102',
    trackingNumber: 'PKG-102',
    description: 'أدوية',
    senderName: 'صيدلية الشفاء',
    pickupAddress: 'القاهرة - المعادي',
    deliveryAddress: 'الجيزة - المهندسين',
    status: 'in_transit',
    estimatedDelivery: new Date(),
    createdAt: new Date(),
    weight: 1,
    courierName: 'محمد',
    courierPhone: '01198765432'
  },
  {
    id: '103',
    trackingNumber: 'PKG-103',
    description: 'ملابس',
    senderName: 'متجر الملابس',
    pickupAddress: 'الإسكندرية',
    deliveryAddress: 'القاهرة',
    status: 'delivered',
    estimatedDelivery: new Date(),
    actualDelivery: new Date(),
    createdAt: new Date(),
    weight: 3,
    courierName: 'يوسف',
    courierPhone: '01234567890'
  }
];

@Injectable({ providedIn: 'root' })
export class CustomerDataService {
  private apiUrl = `${environment.apiUrl}/Customer`;


  constructor(private http: HttpClient) { }

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




  // ========== Deliveries ==========
  getDeliveries(): Observable<IncomingDelivery[]> {
    return this.http.get<IncomingDelivery[]>(`${this.apiUrl}/orders`);
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


