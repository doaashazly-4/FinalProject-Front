import { CommonModule } from '@angular/common';
import { Component , EventEmitter, Output, OnInit, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-proof-camera',
  imports: [FormsModule , CommonModule],
  templateUrl: './proof-camera.component.html',
  styleUrl: './proof-camera.component.css'
})
export class ProofCameraComponent implements OnInit, OnDestroy {
  // Inputs
  @Input() maxPhotos: number = 3;          // الحد الأقصى للصور
  @Input() required: boolean = true;       // هل الصورة إلزامية؟
  @Input() quality: number = 0.8;          // جودة الصورة (0.1 إلى 1)
  
  // Outputs
  @Output() photoCaptured = new EventEmitter<{ file: File, preview: string }>();
  @Output() photosChanged = new EventEmitter<File[]>();
  @Output() cameraClosed = new EventEmitter<void>();
  
  // ViewChild للوصول لعناصر DOM
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  // متغيرات الحالة
  isCameraActive: boolean = false;
  stream: MediaStream | null = null;
  facingMode: 'user' | 'environment' = 'environment'; // 'user' للأمامية، 'environment' للخلفية
  flashEnabled: boolean = false;
  zoomLevel: number = 1;
  maxZoom: number = 3;
  
  // الصور المحفوظة
  capturedPhotos: { file: File, preview: string }[] = [];
  
  // رسائل وأخطاء
  errorMessage: string = '';
  isProcessing: boolean = false;
  
  // أبعاد الكاميرا
  videoWidth: number = 0;
  videoHeight: number = 0;
  
  ngOnInit(): void {
    console.log('📸 Proof Camera Component Initialized');
  }
  
  ngOnDestroy(): void {
    this.stopCamera();
  }
  
  // ========== إدارة الكاميرا ==========
  
  async startCamera(): Promise<void> {
    try {
      this.isProcessing = true;
      this.errorMessage = '';
      
      // إيقاف الكاميرا إذا كانت تعمل
      this.stopCamera();
      
      // طلب إذن الوصول للكاميرا
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: this.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      };
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.isCameraActive = true;
      
      // عرض الفيديو
      setTimeout(() => {
        if (this.videoElement && this.stream) {
          this.videoElement.nativeElement.srcObject = this.stream;
          
          // الحصول على أبعاد الفيديو
          const videoTrack = this.stream.getVideoTracks()[0];
          const settings = videoTrack.getSettings();
          this.videoWidth = settings.width || 640;
          this.videoHeight = settings.height || 480;
          
          // تحديث Canvas بنفس الأبعاد
          if (this.canvasElement) {
            this.canvasElement.nativeElement.width = this.videoWidth;
            this.canvasElement.nativeElement.height = this.videoHeight;
          }
        }
        this.isProcessing = false;
      }, 100);
      
    } catch (error: any) {
      console.error('❌ Camera error:', error);
      this.errorMessage = this.getCameraErrorMessage(error);
      this.isProcessing = false;
      this.isCameraActive = false;
    }
  }
  
  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.isCameraActive = false;
    
    if (this.videoElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
  }
  
  toggleCamera(): void {
    if (this.isCameraActive) {
      this.stopCamera();
    } else {
      this.startCamera();
    }
  }
  
  switchCamera(): void {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    if (this.isCameraActive) {
      this.startCamera();
    }
  }
  
  toggleFlash(): void {
    this.flashEnabled = !this.flashEnabled;
    // Note: Flash control requires additional implementation
  }
  
  zoomIn(): void {
    if (this.zoomLevel < this.maxZoom) {
      this.zoomLevel += 0.5;
      this.applyZoom();
    }
  }
  
  zoomOut(): void {
    if (this.zoomLevel > 1) {
      this.zoomLevel -= 0.5;
      this.applyZoom();
    }
  }
  
 private applyZoom(): void {
  if (!this.stream || !this.videoElement) return;
  
  const video = this.videoElement.nativeElement;
  
  // استخدام CSS transform كبديل للـ zoom
  video.style.transform = `scale(${this.zoomLevel})`;
  video.style.transformOrigin = 'center center';
  
  console.log(`🔍 Zoom applied: ${this.zoomLevel}x (CSS transform)`);
}
  
  // ========== التقاط الصور ==========
  
  capturePhoto(): void {
    if (!this.isCameraActive || !this.videoElement || !this.canvasElement) {
      this.errorMessage = 'الكاميرا غير نشطة';
      return;
    }
    
    if (this.capturedPhotos.length >= this.maxPhotos) {
      this.errorMessage = `لا يمكنك إضافة أكثر من ${this.maxPhotos} صور`;
      return;
    }
    
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');
    
    if (!context) {
      this.errorMessage = 'تعذر الوصول إلى Canvas';
      return;
    }
    
    // رسم الفيديو على Canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // تحويل Canvas إلى Blob ثم File
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const fileName = `delivery_photo_${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          
          // إنشاء preview URL
          const preview = URL.createObjectURL(blob);
          
          // حفظ الصورة
          const photoData = { file, preview };
          this.capturedPhotos.push(photoData);
          
          // إرسال البيانات
          this.photoCaptured.emit(photoData);
          this.photosChanged.emit(this.capturedPhotos.map(p => p.file));
          
          // إظهار تأكيد
          this.showCaptureEffect();
          
          // إذا وصلنا للحد الأقصى، نوقف الكاميرا
          if (this.capturedPhotos.length >= this.maxPhotos) {
            this.stopCamera();
          }
        }
      },
      'image/jpeg',
      this.quality
    );
  }
  
  private showCaptureEffect(): void {
    // تأثير بصري عند التقاط الصورة
    const video = this.videoElement.nativeElement;
    video.style.opacity = '0.5';
    setTimeout(() => {
      video.style.opacity = '1';
    }, 200);
  }
  
  // ========== إدارة الصور ==========
  
  removePhoto(index: number): void {
    if (index >= 0 && index < this.capturedPhotos.length) {
      // تحرير URL لتفريش الذاكرة
      URL.revokeObjectURL(this.capturedPhotos[index].preview);
      
      // إزالة الصورة
      this.capturedPhotos.splice(index, 1);
      
      // إرسال التحديث
      this.photosChanged.emit(this.capturedPhotos.map(p => p.file));
    }
  }
  
  clearAllPhotos(): void {
    // تحرير جميع URLs
    this.capturedPhotos.forEach(photo => {
      URL.revokeObjectURL(photo.preview);
    });
    
    // مسح الصور
    this.capturedPhotos = [];
    
    // إرسال التحديث
    this.photosChanged.emit([]);
  }
  
  // ========== رفع الصور من المعرض ==========
  
  openGallery(): void {
    if (this.capturedPhotos.length >= this.maxPhotos) {
      this.errorMessage = `لا يمكنك إضافة أكثر من ${this.maxPhotos} صور`;
      return;
    }
    
    this.fileInput.nativeElement.click();
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const remainingSlots = this.maxPhotos - this.capturedPhotos.length;
      const filesToProcess = Math.min(input.files.length, remainingSlots);
      
      for (let i = 0; i < filesToProcess; i++) {
        const file = input.files[i];
        
        // التحقق من نوع الملف
        if (!file.type.startsWith('image/')) {
          this.errorMessage = 'يرجى اختيار ملفات صور فقط';
          continue;
        }
        
        // التحقق من الحجم (5MB كحد أقصى)
        if (file.size > 5 * 1024 * 1024) {
          this.errorMessage = 'حجم الصورة كبير جداً (الحد الأقصى 5MB)';
          continue;
        }
        
        // إنشاء preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const photoData = {
            file: file,
            preview: e.target.result
          };
          
          this.capturedPhotos.push(photoData);
          this.photoCaptured.emit(photoData);
          this.photosChanged.emit(this.capturedPhotos.map(p => p.file));
        };
        reader.readAsDataURL(file);
      }
      
      // مسح قيمة الـ input للسماح باختيار نفس الملف مجدداً
      input.value = '';
    }
  }
  
  // ========== مساعدة وأخطاء ==========
  
  private getCameraErrorMessage(error: any): string {
    switch (error.name) {
      case 'NotAllowedError':
        return 'تم رفض إذن الكاميرا. يرجى السماح بالوصول إلى الكاميرا في إعدادات المتصفح.';
      case 'NotFoundError':
        return 'لم يتم العثور على كاميرا. تأكد من توصيل الكاميرا.';
      case 'NotReadableError':
        return 'لا يمكن الوصول إلى الكاميرا. قد تكون قيد الاستخدام من قبل تطبيق آخر.';
      case 'OverconstrainedError':
        return 'الكاميرا لا تدعم المتطلبات المحددة.';
      default:
        return 'حدث خطأ غير متوقع في الكاميرا.';
    }
  }
  
  closeCamera(): void {
    this.stopCamera();
    this.cameraClosed.emit();
  }
  
  // ========== أدوات مساعدة ==========
  
  get hasPhotos(): boolean {
    return this.capturedPhotos.length > 0;
  }
  
  get remainingPhotos(): number {
    return this.maxPhotos - this.capturedPhotos.length;
  }
  
  get cameraIcon(): string {
    return this.facingMode === 'user' ? '📱' : '📷';
  }
  
  get flashIcon(): string {
    return this.flashEnabled ? '✨' : '⚡';
  }

}
