import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProofCameraComponent } from '../../../../shared/components/proof-camera/proof-camera.component'; 
import { OfflineService } from '../../../services/offline.service'; 

@Component({
  selector: 'app-delivery-proof',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ProofCameraComponent
  ],
  templateUrl: './delivery-proof.component.html',
  styleUrls: ['./delivery-proof.component.css']
})
export class DeliveryProofComponent implements OnChanges {
  @Input() isVisible: boolean = false;
  @Input() job: any = null;
  @Output() onComplete = new EventEmitter<any>();
  @Output() onCancel = new EventEmitter<void>();

  photos: File[] = [];
  photoPreviews: string[] = [];
  otp: string = '';
  isSubmitting: boolean = false;
  requiresOTP: boolean = false;
  
  // متغير جديد لإدارة حالة الكاميرا
  isCameraActive: boolean = false;

  constructor(private offlineService: OfflineService) {} // ✅ جديد

  ngOnChanges(): void {
    // Check if OTP is required (for COD or high-value orders)
    if (this.job) {
      this.requiresOTP = this.job?.codAmount > 0 || (this.job?.deliveryFee && this.job.deliveryFee > 100);
    } else {
      this.requiresOTP = false;
    }
  }

  // ========== 📸 الدوال الجديدة للكاميرا ========== //
  
  /**
   * عند التقاط صورة من الكاميرا الجديدة
   */
  onCameraPhotoCaptured(photoData: { file: File, preview: string }): void {
    console.log('📸 Photo captured from camera:', photoData);
    
    if (this.photos.length >= 3) {
      alert('يمكنك إضافة 3 صور كحد أقصى');
      return;
    }
    
    // إضافة الصورة للقائمة
    this.photos.push(photoData.file);
    this.photoPreviews.push(photoData.preview);
    
    console.log(`✅ Total photos: ${this.photos.length}/3`);
  }

  /**
   * عند تغيير الصور من الكاميرا
   */
  onCameraPhotosChanged(files: File[]): void {
    console.log('🔄 Photos changed from camera:', files.length);
    
    // تحديث الصور
    this.photos = [...files];
    
    // تحديث الـ previews
    this.photoPreviews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreviews.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * عند إغلاق الكاميرا
   */
  onCameraClosed(): void {
    console.log('🚪 Camera closed');
    this.isCameraActive = false;
  }

  /**
   * تشغيل/إيقاف الكاميرا
   */
  toggleCamera(): void {
    this.isCameraActive = !this.isCameraActive;
    console.log('📷 Camera toggled:', this.isCameraActive);
  }

  // ========== 📁 الدوال القديمة (للتوافق) ========== //
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (this.photos.length < 3) {
        if (!file.type.startsWith('image/')) {
          alert('يرجى اختيار صورة فقط');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert('حجم الصورة كبير جداً (الحد الأقصى 5MB)');
          return;
        }
        this.photos.push(file);
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.photoPreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        alert('يمكنك إضافة 3 صور كحد أقصى');
      }
    }
  }

  takePhoto(): void {
    // هذا سيتم استبداله بالكاميرا الجديدة
    // يمكنك تركه للتوابق أو حذفه
    console.log('📱 Using legacy camera method');
    
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

  // ========== 🛠️ الدوال الأساسية (كما هي) ========== //
  
  removePhoto(index: number): void {
    if (index >= 0 && index < this.photos.length) {
      this.photos.splice(index, 1);
      this.photoPreviews.splice(index, 1);
      console.log(`🗑️ Photo removed, remaining: ${this.photos.length}`);
    }
  }

  sendOTP(): void {
    alert('تم إرسال رمز OTP إلى هاتف العميل');
    // هنا يمكنك إضافة API call لإرسال OTP
  }

  submitProof(): void {
    // استخدم الدالة المحسنة للتحقق
    this.validateAndSubmitProof();
  }

  /**
   * 🔥 تحقق وإرسال الإثبات (نسخة محسنة مع Offline Support)
   */
  private async validateAndSubmitProof(): Promise<void> {
    // التحقق من الصور
    if (this.photos.length === 0) {
      alert('يرجى التقاط صورة واحدة على الأقل (1-3 صور)');
      return;
    }

    // التحقق من OTP إذا كان مطلوباً
    if (this.requiresOTP && !this.otp) {
      alert('يرجى إدخال رمز OTP للتحقق من الدفع (إلزامي للطلبات COD)');
      return;
    }

    this.isSubmitting = true;
    console.log('📤 Submitting delivery proof...');

    const proof = {
      jobId: this.job.id,
      photos: this.photos,
      photoPreviews: this.photoPreviews,
      photoFiles: this.photos,
      otp: this.otp,
      timestamp: new Date(),
      photosCount: this.photos.length,
      requiresOTP: this.requiresOTP
    };

    try {
      // ✅ استخدام Offline Service
      if (this.offlineService.isCurrentlyOnline) {
        await this.offlineService.saveDeliveryProof(
          this.job.id,
          this.photoPreviews,
          this.otp
        );
        
        console.log('✅ تم إرسال إثبات التسليم (أونلاين)');
        
      } else {
        await this.offlineService.saveDeliveryProof(
          this.job.id,
          this.photoPreviews,
          this.otp
        );
        
        console.log('💾 تم حفظ إثبات التسليم (أوفلاين)');
        alert('تم حفظ إثبات التسليم، سيتم إرساله عند عودة الإنترنت');
      }

      // إرسال البيانات للمكون الأب (للعرض الفوري)
      this.onComplete.emit(proof);

    } catch (error) {
      console.error('❌ فشل حفظ/إرسال إثبات التسليم:', error);
      alert('حدث خطأ في حفظ إثبات التسليم، حاول مرة أخرى');
      
      // مع ذلك، أرسل البيانات للمكون الأب للعرض الفوري
      this.onComplete.emit(proof);
      
    } finally {
      setTimeout(() => {
        this.isSubmitting = false;
      }, 1000);
    }
  }

  /**
   * 🔥 دالة مساعدة لحفظ الصور في Offline Service
   */
  private async savePhotosToOfflineService(): Promise<void> {
    if (this.photoPreviews.length === 0) return;
    
    try {
      await this.offlineService.saveDeliveryProof(
        this.job.id,
        this.photoPreviews,
        this.otp || undefined
      );
      console.log('💾 تم حفظ الصور في Offline Service');
    } catch (error) {
      console.error('❌ فشل حفظ الصور:', error);
    }
  }

  cancel(): void {
    // تنظيف البيانات
    this.clearAllPhotos();
    this.otp = '';
    this.isCameraActive = false;
    
    // إرسال حدث الإلغاء
    this.onCancel.emit();
    
    console.log('❌ Delivery proof cancelled');
  }

  closeModal(): void {
    this.cancel();
  }

  /**
   * مسح جميع الصور (دالة مساعدة جديدة)
   */
  private clearAllPhotos(): void {
    const count = this.photos.length;
    this.photos = [];
    this.photoPreviews = [];
    console.log(`🧹 Cleared ${count} photos`);
  }

  /**
   * دالة مساعدة للحصول على عدد الصور المتبقية
   */
  get remainingPhotos(): number {
    return 3 - this.photos.length;
  }

  /**
   * دالة مساعدة للتحقق إذا كان يمكن إضافة المزيد من الصور
   */
  get canAddMorePhotos(): boolean {
    return this.photos.length < 3;
  }
}