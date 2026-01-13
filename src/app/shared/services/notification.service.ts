import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface AppNotification {
  id?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning' | 'lynx';
  icon?: string;
  sound?: string;
  duration?: number; // ms, 0 = persistent
  timestamp?: Date;
}

export interface DeliveryNotification {
  deliveryId: string;
  phase: 'accepted' | 'courier_assigned' | 'on_the_way' | 'nearby' | 'arrived' | 'otp_required' | 'delivered';
  courierName?: string;
  eta?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<AppNotification | null>(null);
  public notifications$ = this.notificationsSubject.asObservable();

  // Toast notifications queue
  private toastQueue: AppNotification[] = [];
  private toastQueueSubject = new BehaviorSubject<AppNotification[]>([]);
  public toastQueue$ = this.toastQueueSubject.asObservable();

  // Demo simulation control
  private stopSimulation$ = new Subject<void>();
  private isSimulating = false;

  constructor() { }

  // ================= CORE NOTIFICATIONS =================

  showLynxNotification(title: string, message: string) {
    this.showNotification({
      title: '✨ Lynx Talisman',
      message: `${title}: ${message}`,
      type: 'lynx',
      icon: 'bi-stars',
      sound: 'assets/sounds/notification.mp3',
      duration: 5000
    });
  }

  showNotification(notification: AppNotification) {
    const enriched: AppNotification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
      duration: notification.duration ?? 4000
    };

    // Add to queue
    this.toastQueue.push(enriched);
    this.toastQueueSubject.next([...this.toastQueue]);

    // Trigger main notification
    this.notificationsSubject.next(enriched);

    // Play sound
    if (notification.sound) {
      this.playSound(notification.sound);
    }

    // Auto-dismiss
    if (enriched.duration && enriched.duration > 0) {
      setTimeout(() => this.dismissNotification(enriched.id!), enriched.duration);
    }
  }

  dismissNotification(id: string) {
    this.toastQueue = this.toastQueue.filter(n => n.id !== id);
    this.toastQueueSubject.next([...this.toastQueue]);
  }

  // ================= DELIVERY PHASE NOTIFICATIONS =================

  notifyDeliveryPhase(phase: DeliveryNotification) {
    const messages: Record<DeliveryNotification['phase'], { title: string; message: string; icon: string; type: AppNotification['type'] }> = {
      accepted: {
        title: 'تم قبول طلبك',
        message: 'جاري البحث عن مندوب مناسب...',
        icon: 'bi-check-circle',
        type: 'success'
      },
      courier_assigned: {
        title: 'تم تعيين المندوب',
        message: `${phase.courierName || 'مندوب'} سيقوم بتوصيل طلبك`,
        icon: 'bi-person-check',
        type: 'info'
      },
      on_the_way: {
        title: 'المندوب في الطريق',
        message: phase.eta ? `الوصول المتوقع: ${phase.eta}` : 'يتجه إليك الآن',
        icon: 'bi-truck',
        type: 'info'
      },
      nearby: {
        title: 'المندوب قريب منك! 🚴',
        message: 'استعد لاستلام طلبك',
        icon: 'bi-geo-alt',
        type: 'warning'
      },
      arrived: {
        title: 'المندوب وصل! 📍',
        message: 'المندوب بالخارج الآن',
        icon: 'bi-pin-map-fill',
        type: 'warning'
      },
      otp_required: {
        title: 'رمز التسليم مطلوب 🔐',
        message: 'أعطِ المندوب رمز التسليم لإتمام الشحنة',
        icon: 'bi-shield-lock',
        type: 'warning'
      },
      delivered: {
        title: 'تم التسليم بنجاح ✅',
        message: 'شكراً لاستخدامك Lynx!',
        icon: 'bi-check-circle-fill',
        type: 'success'
      }
    };

    const config = messages[phase.phase];
    this.showNotification({
      title: config.title,
      message: config.message,
      type: config.type,
      icon: config.icon,
      duration: phase.phase === 'otp_required' ? 0 : 6000 // OTP notification stays
    });
  }

  // ================= NEW DELIVERY EVENT NOTIFICATIONS =================

  /**
   * Notify when a new request is created by supplier (for couriers)
   */
  notifyNewRequest(data: { requestId: string | number; description?: string; source?: string; destination?: string; priority?: string }) {
    const isUrgent = data.priority === 'urgent';
    this.showNotification({
      title: isUrgent ? '🚨 طلب عاجل جديد!' : '📦 طلب جديد متاح',
      message: `${data.description || 'شحنة جديدة'} من ${data.source || 'المورد'}`,
      type: isUrgent ? 'warning' : 'info',
      icon: isUrgent ? 'bi-exclamation-triangle-fill' : 'bi-box-seam',
      sound: 'assets/sounds/notification.mp3',
      duration: isUrgent ? 10000 : 6000
    });
  }

  /**
   * Notify when a courier is assigned (for customers & suppliers)
   */
  notifyCourierAssigned(data: { courierName?: string; requestId?: string | number }) {
    this.showNotification({
      title: '🚴 تم تعيين المندوب',
      message: `${data.courierName || 'مندوب'} سيقوم بتوصيل طلبك`,
      type: 'success',
      icon: 'bi-person-check',
      duration: 6000
    });
  }

  /**
   * Notify when delivery starts (for customers & suppliers)
   */
  notifyDeliveryStarted(data: { courierName?: string; requestId?: string | number }) {
    this.showNotification({
      title: '🚚 المندوب بدأ التوصيل',
      message: `${data.courierName || 'المندوب'} بدأ رحلة التوصيل`,
      type: 'info',
      icon: 'bi-truck',
      duration: 5000
    });
  }

  /**
   * Notify when courier is out for delivery / nearby
   */
  notifyOutForDelivery(data: { courierName?: string }) {
    this.showNotification({
      title: '📍 المندوب قريب منك!',
      message: 'استعد لاستلام طلبك - المندوب في منطقتك',
      type: 'warning',
      icon: 'bi-geo-alt-fill',
      sound: 'assets/sounds/notification.mp3',
      duration: 8000
    });
  }

  /**
   * Notify when OTP is required (for customers)
   */
  notifyOTPRequired(data: { otp?: string }) {
    this.showNotification({
      title: '🔐 رمز التسليم مطلوب',
      message: data.otp ? `رمز التسليم: ${data.otp}` : 'أعط المندوب رمز التسليم',
      type: 'warning',
      icon: 'bi-shield-lock-fill',
      duration: 0 // Persistent until dismissed
    });
  }

  /**
   * Notify when delivery is completed (for all users)
   */
  notifyDeliveryCompleted(data: { requestId?: string | number }) {
    this.showNotification({
      title: '✅ تم التسليم بنجاح!',
      message: 'شكراً لاستخدامك Lynx Delivery',
      type: 'success',
      icon: 'bi-check-circle-fill',
      sound: 'assets/sounds/notification.mp3',
      duration: 6000
    });
  }

  /**
   * Notify when delivery fails
   */
  notifyDeliveryFailed(data: { reason?: string }) {
    this.showNotification({
      title: '❌ فشل التوصيل',
      message: data.reason || 'تعذر إتمام التوصيل',
      type: 'error',
      icon: 'bi-x-circle-fill',
      duration: 8000
    });
  }

  /**
   * Notify supplier when request is created successfully
   */
  notifyRequestCreated(data: { requestId: string | number; description?: string }) {
    this.showNotification({
      title: '📦 تم إنشاء الطلب',
      message: `طلب #${data.requestId} - ${data.description || 'شحنة جديدة'}`,
      type: 'success',
      icon: 'bi-check-lg',
      duration: 5000
    });
  }

  // ================= DEMO SIMULATION =================

  /**
   * Simulates a complete delivery flow for demo purposes.
   * Triggers notifications at intervals to showcase the system.
   */
  simulateDeliveryFlow(deliveryId: string, courierName = 'أحمد محمد') {
    if (this.isSimulating) {
      this.stopSimulation$.next();
    }

    this.isSimulating = true;
    const phases: { phase: DeliveryNotification['phase']; delay: number; eta?: string }[] = [
      { phase: 'accepted', delay: 0 },
      { phase: 'courier_assigned', delay: 3000 },
      { phase: 'on_the_way', delay: 6000, eta: '15 دقيقة' },
      { phase: 'nearby', delay: 10000 },
      { phase: 'arrived', delay: 13000 },
      { phase: 'otp_required', delay: 15000 }
    ];

    phases.forEach(({ phase, delay, eta }) => {
      setTimeout(() => {
        if (this.isSimulating) {
          this.notifyDeliveryPhase({
            deliveryId,
            phase,
            courierName,
            eta
          });
        }
      }, delay);
    });
  }

  stopSimulation() {
    this.isSimulating = false;
    this.stopSimulation$.next();
  }

  // ================= HELPERS =================

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private playSound(soundPath: string) {
    try {
      const audio = new Audio('assets/sounds/ringtone-you-would-be-glad-to-know.ogg');
      audio.volume = 0.5;
      audio.play().catch(() => { /* Ignore autoplay restrictions */ });
    } catch (e) {
      // Silent fail for sound
    }
  }
}
