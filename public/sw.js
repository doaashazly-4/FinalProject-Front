// Simple Service Worker for Push Notifications
console.log('📱 Service Worker Loaded - PickGo Courier');

// Install
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker: Installed');
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  console.log('🎯 Service Worker: Activated');
  event.waitUntil(clients.claim());
});

// Push Event - إستقبال الإشعارات
self.addEventListener('push', (event) => {
  console.log('🔔 Push Event Received');
  
  let notificationData = {
    title: 'إشعار جديد',
    body: 'لديك إشعار جديد',
    icon: '/assets/logo.png',
    data: { url: '/' }
  };
  
  // محاولة قراءة البيانات المرسلة
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      console.log('📨 Push data (text):', event.data.text());
      notificationData.body = event.data.text() || notificationData.body;
    }
  }
  
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: '/assets/badge.png',
    data: notificationData.data,
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'فتح'
      },
      {
        action: 'close',
        title: 'إغلاق'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification Click - عند الضغط على الإشعار
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification Clicked');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/courier/dashboard';
  
  // فتح التطبيق أو التركيز عليه
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/courier') && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message from App - رسائل من التطبيق
self.addEventListener('message', (event) => {
  console.log('📨 Message from App:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch - لطلب البيانات
self.addEventListener('fetch', (event) => {
  // يمكنك إضافة منطق للتخزين المؤقت هنا
  event.respondWith(fetch(event.request));
});