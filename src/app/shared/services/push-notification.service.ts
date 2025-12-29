import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PushMessage {
  title: string;
  body: string;
  icon?: string;
  data?: any;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private messageSubject = new BehaviorSubject<PushMessage | null>(null);
  public messages$ = this.messageSubject.asObservable();

  private subscription: PushSubscription | null = null;
  private isRegistered = false;

  constructor() {
    this.checkExistingSubscription();
  }

  // ===============================
  // 🔍 Check existing subscription
  // ===============================
  private async checkExistingSubscription(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();

      if (existing) {
        this.subscription = existing;
        this.isRegistered = true;
        console.log('✅ Existing push subscription found');
      }
    } catch (error) {
      console.warn('⚠️ Error checking subscription:', error);
    }
  }

  // ===============================
  // 🚀 Initialize Push Notifications
  // ===============================
  async initialize(): Promise<void> {
    await this.requestPermissionAndRegister();
  }

  async requestPermissionAndRegister(): Promise<boolean> {
    if (this.isRegistered) return true;
    if (!this.isSupported()) return false;

    try {
      const permission = await this.requestNotificationPermission();
      if (permission !== 'granted') return false;

      const registration = await this.registerServiceWorker();
      if (!registration) return false;

      const subscription = await this.subscribeToPush(registration);
      if (!subscription) return false;

      this.subscription = subscription;
      this.isRegistered = true;

      await this.sendSubscriptionToServer(subscription);
      this.setupMessageListeners();

      console.log('🎉 Push Notifications Ready');
      return true;
    } catch (error) {
      console.error('❌ Push init error:', error);
      return false;
    }
  }

  // ===============================
  // 🔧 Support Check
  // ===============================
  private isSupported(): boolean {
    return (
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );
  }

  // ===============================
  // 📝 Request Permission
  // ===============================
  private async requestNotificationPermission(): Promise<NotificationPermission> {
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return await Notification.requestPermission();
  }

  // ===============================
  // ⚙️ Register Service Worker
  // ===============================
  private async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      console.error('❌ SW registration failed:', error);
      return null;
    }
  }

  // ===============================
  // 🔔 Subscribe to Push
  // ===============================
  private async subscribeToPush(
    registration: ServiceWorkerRegistration
  ): Promise<PushSubscription | null> {
    try {
      const vapidKey = environment.pushVapidPublicKey;

      if (!vapidKey) {
        console.warn('⚠️ Missing VAPID key');
        return null;
      }

      // ✅ الحل النهائي للمشكلة
      const applicationServerKey =
        this.urlBase64ToUint8Array(vapidKey).buffer;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      console.log('✅ Push subscribed');
      return subscription;
    } catch (error) {
      console.error('❌ Subscribe failed:', error);
      return null;
    }
  }

  // ===============================
  // 📡 Send subscription to backend
  // ===============================
  async sendSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
    try {
      const payload: any = {
        endpoint: subscription.endpoint
      };

      const raw = JSON.parse(JSON.stringify(subscription));
      if (raw.keys) {
        payload.keys = {
          p256dh: raw.keys.p256dh,
          auth: raw.keys.auth
        };
      }

      const res = await fetch(
        `${environment.apiUrl}/notifications/register-subscription`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      return res.ok;
    } catch (error) {
      console.warn('⚠️ Backend unreachable, saving locally');
      this.saveSubscriptionLocally(subscription);
      return false;
    }
  }

  // ===============================
  // 💾 Save locally (offline)
  // ===============================
  private saveSubscriptionLocally(subscription: PushSubscription): void {
    const raw = JSON.parse(JSON.stringify(subscription));
    localStorage.setItem('push_subscription', JSON.stringify(raw));
  }

  // ===============================
  // 🎧 Listen to messages
  // ===============================
  private setupMessageListeners(): void {
    navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
      const msg: PushMessage = {
        title: event.data?.title || 'إشعار جديد',
        body: event.data?.body || 'لديك رسالة',
        data: event.data?.data,
        timestamp: new Date()
      };
      this.messageSubject.next(msg);
    });
  }

  // ===============================
  // 🔄 Unsubscribe
  // ===============================
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) return true;

    const success = await this.subscription.unsubscribe();
    if (success) {
      this.subscription = null;
      this.isRegistered = false;
      localStorage.removeItem('push_subscription');
    }
    return success;
  }

  // ===============================
  // 🧠 Helper
  // ===============================
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const raw = window.atob(base64);
    const output = new Uint8Array(raw.length);

    for (let i = 0; i < raw.length; i++) {
      output[i] = raw.charCodeAt(i);
    }

    return output;
  }
}
