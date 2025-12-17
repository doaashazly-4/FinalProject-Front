import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierDataService } from '../../services/supplier-data.service';

@Component({
  selector: 'app-supplier-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  // إعدادات الحساب (من جدول Suppliers و AspNetUsers)
  accountSettings = {
    companyName: '',
    email: '',
    phone: '',
    address: '',
    commercialRegister: '',
    taxNumber: '',
    businessType: '',
    accountRole: 'supplier' as 'supplier' | 'client' // Role selection: Supplier or Client
  };

  // Available roles for dropdown
  availableRoles = [
    { value: 'supplier', label: 'مُرسل', description: 'إرسال الطلبات وتتبع الشحنات' },
    { value: 'client', label: 'عميل', description: 'استلام الطلبات وتتبع الشحنات' }
  ];

  // إعدادات الشحن والتوصيل (من جدول Requests و Packages)
  shippingSettings = {
    defaultWeight: 1.0, // بالكيلو جرام
    fragileHandlingFee: 15, // رسوم إضافية للقابل للكسر
    defaultShipmentCost: 25, // تكلفة الشحن الافتراضية
    deliveryTime: '2-3 أيام عمل',
    packagingType: 'علبة كرتون',
    maxPackageWeight: 30 // الحد الأقصى للوزن
  };

  // إعدادات الدفع والفواتير (من جدول Invoices)
  paymentSettings = {
    defaultPaymentType: 'كاش عند الاستلام',
    acceptedPaymentMethods: ['كاش', 'بطاقة ائتمان', 'تحويل بنكي'],
    invoicePrefix: 'SUP-INV-',
    taxRate: 15, // نسبة الضريبة
    autoGenerateInvoice: true
  };

  // إعدادات المنتجات والمخزون (من جدول Packages وعلاقاته)
  productSettings = {
    lowStockThreshold: 10, // الحد الأدنى للمخزون المنخفض
    expiryNotificationDays: 30, // الإشعار قبل انتهاء الصلاحية
    autoDisableExpired: true,
    allowNegativeStock: false,
    defaultCategory: 'عام'
  };

  // إعدادات الإشعارات
  notificationSettings = {
    emailNotifications: true,
    lowStockAlerts: true,
    newOrderAlerts: true,
    orderUpdates: true,
    monthlyReports: true
  };

  // إعدادات الأمان
  securitySettings = {
    twoFactorAuth: false,
    sessionTimeout: 30, // دقيقة
    loginAlerts: true,
    passwordExpiryDays: 90
  };

  // إعدادات المظهر
  themeSettings = {
    theme: 'light',
    language: 'ar',
    timezone: 'Asia/Riyadh',
    dateFormat: 'dd/MM/yyyy'
  };

  // الحقول التي تم تعديلها
  changedFields: string[] = [];
  
  // حالة التحميل
  isLoading = false;

  constructor(private dataService: SupplierDataService) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;
    // في التطبيق الحقيقي: جلب الإعدادات من API
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  // تتبع التغييرات في الحقول
  onFieldChange(field: string, section: string): void {
    const fullField = `${section}.${field}`;
    if (!this.changedFields.includes(fullField)) {
      this.changedFields.push(fullField);
    }
  }

  // حفظ الإعدادات
  saveSettings(): void {
    this.isLoading = true;
    
    // محاكاة API call
    setTimeout(() => {
      console.log('تم حفظ الإعدادات:', {
        account: this.accountSettings,
        shipping: this.shippingSettings,
        payment: this.paymentSettings,
        product: this.productSettings,
        notifications: this.notificationSettings,
        security: this.securitySettings,
        theme: this.themeSettings
      });
      
      this.isLoading = false;
      this.changedFields = [];
      alert('✅ تم حفظ الإعدادات بنجاح');
    }, 1000);
  }

  // إعادة تعيين الإعدادات
  resetSettings(): void {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات؟ سيتم فقدان التغييرات غير المحفوظة.')) {
      this.accountSettings = {
        companyName: '',
        email: '',
        phone: '',
        address: '',
        commercialRegister: '',
        taxNumber: '',
        businessType: '',
        accountRole: 'supplier'
      };
      
      this.changedFields = [];
      alert('تم إعادة تعيين الإعدادات');
    }
  }

  // تصدير الإعدادات
  exportSettings(): void {
    const settingsData = {
      accountSettings: this.accountSettings,
      shippingSettings: this.shippingSettings,
      paymentSettings: this.paymentSettings,
      productSettings: this.productSettings,
      notificationSettings: this.notificationSettings,
      securitySettings: this.securitySettings,
      themeSettings: this.themeSettings,
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(settingsData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'supplier-settings-backup.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  // استيراد الإعدادات
  importSettings(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const importedSettings = JSON.parse(e.target.result);
        
        // التحقق من صحة البيانات قبل الاستيراد
        if (confirm('هل أنت متأكد من استيراد هذه الإعدادات؟ سيتم استبدال جميع الإعدادات الحالية.')) {
          if (importedSettings.accountSettings) {
            this.accountSettings = importedSettings.accountSettings;
          }
          if (importedSettings.shippingSettings) {
            this.shippingSettings = importedSettings.shippingSettings;
          }
          if (importedSettings.paymentSettings) {
            this.paymentSettings = importedSettings.paymentSettings;
          }
          alert('✅ تم استيراد الإعدادات بنجاح');
        }
      } catch (error) {
        alert('❌ ملف غير صالح. يرجى التأكد من صحة الملف.');
      }
    };
    reader.readAsText(file);
  }
}