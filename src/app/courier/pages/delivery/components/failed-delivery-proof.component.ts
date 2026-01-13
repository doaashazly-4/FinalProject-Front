import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfflineService } from '../.,/../../../services/offline.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-failed-delivery-proof',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './failed-delivery-proof.component.html',
  styleUrls: ['./failed-delivery-proof.component.css']
})
export class FailedDeliveryProofComponent {
  @Input() isVisible: boolean = false;
  @Input() job: any = null;
  @Output() onSubmit = new EventEmitter<{ reason: string; photos: string[]; notes: string }>();
  @Output() onCancel = new EventEmitter<void>();

  selectedReason: string = '';
  photos: File[] = [];
  photoPreviews: string[] = [];
  notes: string = '';
  isSubmitting: boolean = false;

  // المتغيرات الجديدة
  deliveryAttempts: number = 1;
  maxAttempts: number = 2;
  shouldAutoReturn: boolean = false;
  supplierNotified: boolean = false;

  reasons = [
    { value: 'no_answer', label: 'لا يوجد رد من العميل' },
    { value: 'refused', label: 'رفض العميل الاستلام' },
    { value: 'wrong_address', label: 'العنوان خاطئ' },
    { value: 'damaged', label: 'الطرد تالف' },
    { value: 'other', label: 'سبب آخر' }
  ];

  constructor(
    private offlineService: OfflineService,
    private notificationService: NotificationService
  ) { }

  // الدوال الجديدة
  private checkAttemptsAndAutoReturn(): void {
    this.deliveryAttempts++;

    if (this.deliveryAttempts >= this.maxAttempts) {
      this.shouldAutoReturn = true;
      console.log('🚨 تفعيل الإرجاع التلقائي');
      this.executeAutoReturn();
    }
  }

  private async executeAutoReturn(): Promise<void> {
    if (!this.job || !this.shouldAutoReturn) return;

    console.log('📦 بدء عملية الإرجاع للمورد...');

    const returnReason = `إرجاع تلقائي بعد ${this.maxAttempts} محاولات فاشلة - ${this.selectedReason}`;

    // ✅ استخدام OfflineService
    await this.offlineService.saveReturnToSupplier(
      this.job.id,
      returnReason,
      true // isAutoReturn
    );
  }

  private async notifySupplier(returnData: any): Promise<void> {
    if (this.supplierNotified) return;

    console.log('📨 إرسال إشعار للمورد...');

    this.supplierNotified = true;
    console.log('✅ تم إشعار المورد تلقائياً');
  }

  // الدوال الأساسية (مع التحديثات)
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (this.photos.length < 3) {
        if (!file.type.startsWith('image/')) {
          this.notificationService.showNotification({ title: '⚠️ تنبيه', message: 'يرجى اختيار صورة فقط', type: 'warning' });
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          this.notificationService.showNotification({ title: '⚠️ تنبيه', message: 'حجم الصورة كبير جداً (الحد الأقصى 5MB)', type: 'warning' });
          return;
        }
        this.photos.push(file);
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.photoPreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        this.notificationService.showNotification({ title: '⚠️ تنبيه', message: 'يمكنك إضافة 3 صور كحد أقصى', type: 'warning' });
      }
    }
  }

  takePhoto(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e: any) => {
      if (e.target.files && e.target.files.length > 0) {
        this.onFileSelected(e);
      }
    };
    input.click();
  }

  removePhoto(index: number): void {
    this.photos.splice(index, 1);
    this.photoPreviews.splice(index, 1);
  }

  async submitFailure(): Promise<void> {
    if (!this.selectedReason) {
      this.notificationService.showNotification({ title: '⚠️ تنبيه', message: 'يرجى اختيار سبب الفشل', type: 'warning' });
      return;
    }

    if (this.photoPreviews.length === 0) {
      this.notificationService.showNotification({ title: '⚠️ تنبيه', message: 'يرجى التقاط صورة واحدة على الأقل كدليل', type: 'warning' });
      return;
    }

    this.isSubmitting = true;

    // ✅ التحقق من المحاولات (محدث)
    this.deliveryAttempts++;

    if (this.deliveryAttempts >= this.maxAttempts) {
      this.shouldAutoReturn = true;
      console.log('🚨 تفعيل الإرجاع التلقائي');
    }

    const failureData = {
      jobId: this.job?.id,
      reason: this.selectedReason,
      photos: this.photoPreviews,
      photoFiles: this.photos,
      notes: this.notes,
      deliveryAttempts: this.deliveryAttempts,
      maxAttempts: this.maxAttempts,
      shouldAutoReturn: this.shouldAutoReturn,
      timestamp: new Date().toISOString()
    };

    // ✅ ربط مع Offline Service
    try {
      if (this.offlineService.isCurrentlyOnline) {
        await this.offlineService.saveFailedDelivery(
          this.job?.id,
          this.selectedReason,
          this.photoPreviews,
          this.notes
        );

        this.onSubmit.emit(failureData);

      } else {
        await this.offlineService.saveFailedDelivery(
          this.job?.id,
          this.selectedReason,
          this.photoPreviews,
          this.notes
        );

        this.notificationService.showNotification({ title: '💾 تم الحفظ', message: 'تم حفظ تقرير الفشل، سيتم إرساله عند عودة الإنترنت', type: 'info' });
        this.onSubmit.emit(failureData);
      }

      // ✅ إذا كان Auto-return مطلوب
      if (this.shouldAutoReturn) {
        await this.handleAutoReturn(failureData);
      }

    } catch (error) {
      console.error('❌ فشل حفظ/إرسال التقرير:', error);
      this.notificationService.showNotification({ title: '❌ خطأ', message: 'حدث خطأ في حفظ التقرير، حاول مرة أخرى', type: 'error' });
    } finally {
      this.isSubmitting = false;
    }
  }

  // ✅ دالة جديدة لمعالجة الإرجاع التلقائي
  private async handleAutoReturn(failureData: any): Promise<void> {
    const returnReason = `إرجاع تلقائي بعد ${this.maxAttempts} محاولات فاشلة - ${this.selectedReason}`;

    try {
      await this.offlineService.saveReturnToSupplier(
        this.job?.id,
        returnReason,
        true
      );

      console.log('📦 تم جدولة/إرسال الإرجاع للمورد');

      this.notificationService.showNotification({ title: '⚠️ الإرجاع التلقائي', message: 'تم تفعيل الإرجاع التلقائي للمورد', type: 'warning' });

    } catch (error) {
      console.error('❌ فشل حفظ/إرسال الإرجاع:', error);
    }
  }

  cancel(): void {
    this.photos = [];
    this.photoPreviews = [];
    this.notes = '';
    this.selectedReason = '';
    this.onCancel.emit();
  }

  closeModal(): void {
    this.cancel();
  }

  // دوال مساعدة للعرض
  get attemptsInfo(): string {
    return `المحاولة: ${this.deliveryAttempts} من ${this.maxAttempts}`;
  }

  get isFinalAttempt(): boolean {
    return this.deliveryAttempts >= this.maxAttempts;
  }
}