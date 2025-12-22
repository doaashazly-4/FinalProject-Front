import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
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
  value: string;
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

@Injectable({ providedIn: 'root' })
export class CustomerDataService {
  private apiUrl = `${environment.apiUrl}/Customer`;


  constructor(private http: HttpClient) { }

  // ========== Stats ==========
  getStats(): Observable<ReceiverStat[]> {
    return this.http.get<ReceiverStat[]>(`${this.apiUrl}/stats`);
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

  // ========== Mock Data ==========
  private getMockStats(): ReceiverStat[] {
    return [
      { label: 'شحنات واردة', value: '5', icon: 'bi-box-arrow-in-down', trend: '', color: 'blue' },
      { label: 'تم الاستلام', value: '23', icon: 'bi-check-circle', trend: '+3', color: 'green' },
      { label: 'في الطريق', value: '2', icon: 'bi-truck', trend: '', color: 'purple' }
    ];
  }

  private getMockDeliveries(): IncomingDelivery[] {
    return [
      {
        id: '1',
        trackingNumber: 'PKG-2024-101',
        description: 'طرد من متجر إلكتروني',
        senderName: 'متجر الإلكترونيات',
        pickupAddress: 'القاهرة - وسط البلد',
        deliveryAddress: 'القاهرة - المعادي، شارع 9، عمارة 15، شقة 5',
        status: 'out_for_delivery',
        estimatedDelivery: new Date(),
        createdAt: new Date(Date.now() - 172800000),
        weight: 1.5,
        courierName: 'أحمد محمد',
        courierPhone: '01098765432'
      },
      {
        id: '2',
        trackingNumber: 'PKG-2024-102',
        description: 'مستندات مهمة',
        senderName: 'شركة التوظيف',
        pickupAddress: 'الجيزة - المهندسين',
        deliveryAddress: 'القاهرة - المعادي، شارع 9، عمارة 15، شقة 5',
        status: 'in_transit',
        estimatedDelivery: new Date(Date.now() + 86400000),
        createdAt: new Date(Date.now() - 86400000),
        weight: 0.3,
        courierName: 'محمد علي',
        courierPhone: '01087654321',
        requiresSignature: true
      },
      {
        id: '3',
        trackingNumber: 'PKG-2024-100',
        description: 'هدية - قابل للكسر',
        senderName: 'سارة أحمد',
        senderPhone: '01112345678',
        pickupAddress: 'الإسكندرية - سموحة',
        deliveryAddress: 'القاهرة - المعادي، شارع 9، عمارة 15، شقة 5',
        status: 'delivered',
        actualDelivery: new Date(Date.now() - 259200000),
        createdAt: new Date(Date.now() - 345600000),
        weight: 2.0,
        isFragile: true,
        courierName: 'علي حسن'
      },
      {
        id: '4',
        trackingNumber: 'PKG-2024-099',
        description: 'ملابس',
        senderName: 'متجر الأزياء',
        pickupAddress: 'القاهرة - التجمع الخامس',
        deliveryAddress: 'القاهرة - المعادي، شارع 9، عمارة 15، شقة 5',
        status: 'delivered',
        actualDelivery: new Date(Date.now() - 432000000),
        createdAt: new Date(Date.now() - 518400000),
        weight: 1.0
      }
    ];
  }
}
