import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { filter } from 'rxjs/operators';
import { OfflineService } from './courier/services/offline.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'PickGo';
  showNavbar = true;
  showFooter = true;
  isOnline: boolean = true;
  pendingActions: number = 0;

  // Routes where navbar and footer should be hidden
  private hiddenRoutes = [
    '/customer',
    '/supplier',
    '/courier',
    '/admin'
  ];

  constructor(private router: Router, private offlineService: OfflineService) {
    console.log('🔧 Testing OfflineService:', {
      serviceExists: !!offlineService,
      isOnlineProperty: offlineService?.isCurrentlyOnline,
      hasOnlineStatus$: !!offlineService?.onlineStatus$
    });
  }

  ngOnInit(): void {
    console.log('🚀 App started successfully');
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateLayoutVisibility(event.urlAfterRedirects);
    });
    
    this.updateLayoutVisibility(this.router.url);

    this.initNetworkMonitoring();
    this.setupNetworkAlerts();
    
    // 🔔 السطر الجديد فقط:
    this.startPushNotifications(); // ⬅️ أضف هذا
  }

  private updateLayoutVisibility(url: string): void {
    const shouldHide = this.hiddenRoutes.some(route => url.startsWith(route));
    this.showNavbar = !shouldHide;
    this.showFooter = !shouldHide;
  }

  // ✅ دالة جديدة: مراقبة حالة الإنترنت
  private initNetworkMonitoring(): void {
    this.offlineService.onlineStatus$.subscribe(isOnline => {
      this.isOnline = isOnline;
      console.log(isOnline ? '🌐 الإنترنت متصل' : '📴 الإنترنت مقطوع');
      
      this.updatePendingActionsCount();
    });
    
    this.isOnline = this.offlineService.isCurrentlyOnline;
  }
  
  // ✅ دالة جديدة: عرض تنبيهات الإنترنت
  private setupNetworkAlerts(): void {
    let lastStatus = this.isOnline;
    
    this.offlineService.onlineStatus$.subscribe(isOnline => {
      if (lastStatus !== isOnline) {
        lastStatus = isOnline;
        
        if (isOnline) {
          console.log('🔄 بدء المزامنة التلقائية...');
          this.showToast('🌐 عودة الاتصال بالإنترنت', 'سيتم مزامنة البيانات تلقائياً');
        } else {
          this.showToast('📴 فقدان الاتصال بالإنترنت', 'أنت تعمل الآن محلياً');
        }
      }
    });
    
    setInterval(() => {
      this.updatePendingActionsCount();
    }, 30000);
  }
  
  // ✅ دالة جديدة: تحديث عدد الإجراءات المعلقة
  private async updatePendingActionsCount(): Promise<void> {
    try {
      const count = await this.offlineService.getPendingCount();
      this.pendingActions = count;
      
      if (count > 0 && this.isOnline) {
        console.log(`📋 لديك ${count} إجراء معلق للـمزامنة`);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب عدد الإجراءات:', error);
    }
  }
  
  // ✅ دالة جديدة: عرض Toast
  private showToast(title: string, message: string): void {
    console.log(`${title}: ${message}`);
  }
  
  // ✅ دالة جديدة: مزامنة يدوية
  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      this.showToast('تنبيه', 'لا يمكن المزامنة بدون إنترنت');
      return;
    }
    
    try {
      this.showToast('جاري المزامنة', 'يرجى الانتظار...');
      
      await this.offlineService.syncPendingActions();
      
      const newCount = await this.offlineService.getPendingCount();
      
      if (newCount === 0) {
        this.showToast('تمت المزامنة', 'تمت مزامنة جميع الإجراءات بنجاح');
      } else {
        this.showToast('جزئي', `باقي ${newCount} إجراءات معلقة`);
      }
      
      this.pendingActions = newCount;
      
    } catch (error) {
      console.error('❌ خطأ في المزامنة اليدوية:', error);
      this.showToast('خطأ', 'فشل في المزامنة');
    }
  }
  
  // 🔔 PUSH NOTIFICATIONS - إضافة جديدة فقط
  // =========================================
  
  /**
   * 🔔 تهيئة Push Notifications (إضافة جديدة)
   */
  private async initPushNotifications(): Promise<void> {
    // ⏳ ننتظر 3 ثواني علشان التطبيق يخلص تحميل
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔄 محاولة تشغيل Push Notifications...');
    
    // 1. تحقق من دعم المتصفح
    if (!this.isPushSupported()) {
      console.log('⚠️ المتصفح لا يدعم Push Notifications');
      return;
    }
    
    // 2. تحقق إذا كان مسجل مسبقاً
    if (await this.isAlreadyRegistered()) {
      console.log('✅ Push Notifications مسجلة مسبقاً');
      return;
    }
    
    // 3. طلب الإذن
    const permission = await this.requestPushPermission();
    if (permission !== 'granted') {
      console.log('⏸️ المستخدم رفض الإذن للإشعارات');
      return;
    }
    
    // 4. تسجيل Service Worker بسيط
    try {
      await this.registerSimpleServiceWorker();
      console.log('🎉 Push Notifications جاهزة');
    } catch (error) {
      console.log('❌ فشل تسجيل Push Notifications:', error);
    }
  }
  
  /**
   * 🔧 التحقق من دعم Push Notifications
   */
  private isPushSupported(): boolean {
    return (
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );
  }
  
  /**
   * 🔍 التحقق من التسجيل المسبق
   */
  private async isAlreadyRegistered(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch {
      return false;
    }
  }
  
  /**
   * 📝 طلب إذن الإشعارات
   */
  private async requestPushPermission(): Promise<NotificationPermission> {
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    
    return await Notification.requestPermission();
  }
  
  /**
   * ⚙️ تسجيل Service Worker بسيط
   */
  private async registerSimpleServiceWorker(): Promise<void> {
    // Service Worker بسيط في الذاكرة
    const swCode = `
      self.addEventListener('install', (event) => {
        console.log('📱 PickGo Service Worker: Installed');
        self.skipWaiting();
      });
      
      self.addEventListener('activate', (event) => {
        console.log('🎯 PickGo Service Worker: Activated');
        event.waitUntil(clients.claim());
      });
      
      self.addEventListener('push', (event) => {
        console.log('🔔 Push Event Received');
        
        let data = { title: 'إشعار جديد', body: 'من PickGo' };
        if (event.data) {
          try {
            data = event.data.json();
          } catch {
            data.body = event.data.text() || data.body;
          }
        }
        
        event.waitUntil(
          self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/assets/logo.png',
            badge: '/assets/badge.png',
            vibrate: [200, 100, 200]
          })
        );
      });
      
      self.addEventListener('notificationclick', (event) => {
        event.notification.close();
        const url = '/courier/dashboard';
        event.waitUntil(
          clients.openWindow(url)
        );
      });
    `;
    
    // إنشاء Service Worker من الكود
    const blob = new Blob([swCode], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(blob);
    
    // التسجيل
    await navigator.serviceWorker.register(swUrl, {
      scope: '/',
      updateViaCache: 'none'
    });
    
    console.log('✅ Service Worker مسجل بنجاح');
  }
  
  /**
   * 🎯 بدء Push Notifications (دالة عامة للاستدعاء)
   */
  async startPushNotifications(): Promise<void> {
    await this.initPushNotifications();
  }
}