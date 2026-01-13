import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Subject } from 'rxjs';

export interface DeliveryEvent {
  type: 'new_request' | 'urgent_request' | 'courier_assigned' | 'delivery_started' |
  'out_for_delivery' | 'otp_requested' | 'delivered' | 'failed';
  requestId: string | number;
  packageId?: string | number;
  description?: string;
  priority?: 'normal' | 'urgent';
  courierName?: string;
  customerName?: string;
  receiverName?: string;
  receiverPhone?: string;
  source?: string;
  destination?: string;
  timestamp: Date;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationHubService {
  private hubConnection: signalR.HubConnection | null = null;
  private isConnected = false;

  // Event streams for all notification types
  private newRequestSubject = new Subject<DeliveryEvent>();
  private courierAssignedSubject = new Subject<DeliveryEvent>();
  private deliveryStartedSubject = new Subject<DeliveryEvent>();
  private deliveryCompletedSubject = new Subject<DeliveryEvent>();
  private deliveryEventSubject = new Subject<DeliveryEvent>();

  public newRequest$ = this.newRequestSubject.asObservable();
  public courierAssigned$ = this.courierAssignedSubject.asObservable();
  public deliveryStarted$ = this.deliveryStartedSubject.asObservable();
  public deliveryCompleted$ = this.deliveryCompletedSubject.asObservable();
  public deliveryEvent$ = this.deliveryEventSubject.asObservable();

  // Connection status
  private connectionStatus = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatus.asObservable();

  startConnection(): void {
    if (this.isConnected || this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      console.log('🔔 SignalR already connected');
      return;
    }

    const token = localStorage.getItem('lynx_token') || '';

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/notificationHub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Register all event handlers before starting connection
    this.registerEventHandlers();

    this.hubConnection
      .start()
      .then(() => {
        console.log('🔔 SignalR connected successfully');
        this.isConnected = true;
        this.connectionStatus.next(true);
      })
      .catch(err => {
        console.warn('SignalR connection failed, using polling fallback:', err.message);
        this.isConnected = false;
        this.connectionStatus.next(false);
      });

    // Handle reconnection
    this.hubConnection.onreconnected(() => {
      console.log('🔔 SignalR reconnected');
      this.isConnected = true;
      this.connectionStatus.next(true);
    });

    this.hubConnection.onclose(() => {
      console.log('🔔 SignalR disconnected');
      this.isConnected = false;
      this.connectionStatus.next(false);
    });
  }

  private registerEventHandlers(): void {
    if (!this.hubConnection) return;

    // New Request Created (for couriers)
    this.hubConnection.on('NewRequestCreated', (data: any) => {
      console.log('📦 New request notification:', data);
      const event: DeliveryEvent = {
        type: data.priority === 'urgent' ? 'urgent_request' : 'new_request',
        requestId: data.requestId || data.id,
        description: data.description,
        priority: data.priority || 'normal',
        source: data.source,
        destination: data.destination,
        receiverName: data.receiverName,
        receiverPhone: data.receiverPhone,
        timestamp: new Date()
      };
      this.newRequestSubject.next(event);
      this.deliveryEventSubject.next(event);
    });

    // Courier Assigned (for customers & suppliers)
    this.hubConnection.on('CourierAssigned', (data: any) => {
      console.log('🚴 Courier assigned notification:', data);
      const event: DeliveryEvent = {
        type: 'courier_assigned',
        requestId: data.requestId || data.id,
        packageId: data.packageId,
        courierName: data.courierName,
        customerName: data.customerName,
        timestamp: new Date(),
        message: `تم تعيين المندوب ${data.courierName} لطلبك`
      };
      this.courierAssignedSubject.next(event);
      this.deliveryEventSubject.next(event);
    });

    // Delivery Started (for customers & suppliers)
    this.hubConnection.on('DeliveryStarted', (data: any) => {
      console.log('🚚 Delivery started notification:', data);
      const event: DeliveryEvent = {
        type: 'delivery_started',
        requestId: data.requestId || data.id,
        packageId: data.packageId,
        courierName: data.courierName,
        timestamp: new Date(),
        message: 'المندوب بدأ رحلة التوصيل'
      };
      this.deliveryStartedSubject.next(event);
      this.deliveryEventSubject.next(event);
    });

    // Out for Delivery
    this.hubConnection.on('OutForDelivery', (data: any) => {
      console.log('📍 Out for delivery notification:', data);
      const event: DeliveryEvent = {
        type: 'out_for_delivery',
        requestId: data.requestId || data.id,
        packageId: data.packageId,
        courierName: data.courierName,
        timestamp: new Date(),
        message: 'المندوب في طريقه إليك!'
      };
      this.deliveryEventSubject.next(event);
    });

    // OTP Required
    this.hubConnection.on('OTPRequired', (data: any) => {
      console.log('🔐 OTP required notification:', data);
      const event: DeliveryEvent = {
        type: 'otp_requested',
        requestId: data.requestId || data.id,
        packageId: data.packageId,
        timestamp: new Date(),
        message: 'أدخل رمز التسليم لإتمام الشحنة'
      };
      this.deliveryEventSubject.next(event);
    });

    // Delivery Completed (for all users)
    this.hubConnection.on('DeliveryCompleted', (data: any) => {
      console.log('✅ Delivery completed notification:', data);
      const event: DeliveryEvent = {
        type: 'delivered',
        requestId: data.requestId || data.id,
        packageId: data.packageId,
        courierName: data.courierName,
        timestamp: new Date(),
        message: 'تم تسليم الشحنة بنجاح!'
      };
      this.deliveryCompletedSubject.next(event);
      this.deliveryEventSubject.next(event);
    });

    // Delivery Failed
    this.hubConnection.on('DeliveryFailed', (data: any) => {
      console.log('❌ Delivery failed notification:', data);
      const event: DeliveryEvent = {
        type: 'failed',
        requestId: data.requestId || data.id,
        packageId: data.packageId,
        timestamp: new Date(),
        message: data.reason || 'فشل التوصيل'
      };
      this.deliveryEventSubject.next(event);
    });
  }

  // Callback-based API for backward compatibility
  onNewRequest(callback: (data: any) => void): void {
    this.newRequest$.subscribe(callback);
  }

  onCourierAssigned(callback: (data: any) => void): void {
    this.courierAssigned$.subscribe(callback);
  }

  onDeliveryStarted(callback: (data: any) => void): void {
    this.deliveryStarted$.subscribe(callback);
  }

  onDeliveryCompleted(callback: (data: any) => void): void {
    this.deliveryCompleted$.subscribe(callback);
  }

  onAnyDeliveryEvent(callback: (data: DeliveryEvent) => void): void {
    this.deliveryEvent$.subscribe(callback);
  }

  // Manual event triggers (for local notifications when SignalR not available)
  triggerLocalEvent(event: DeliveryEvent): void {
    this.deliveryEventSubject.next(event);

    switch (event.type) {
      case 'new_request':
      case 'urgent_request':
        this.newRequestSubject.next(event);
        break;
      case 'courier_assigned':
        this.courierAssignedSubject.next(event);
        break;
      case 'delivery_started':
        this.deliveryStartedSubject.next(event);
        break;
      case 'delivered':
        this.deliveryCompletedSubject.next(event);
        break;
    }
  }

  stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop().then(() => {
        console.log('🔔 SignalR stopped');
        this.isConnected = false;
        this.connectionStatus.next(false);
      });
    }
  }
}
