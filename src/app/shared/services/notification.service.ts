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
