import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProofCameraComponent } from '../../../../shared/components/proof-camera/proof-camera.component';
import { OfflineService } from '../../../services/offline.service';
import { CourierDataService } from '../../../services/courier-data.service'; // ✅ ADDED

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

  isCameraActive: boolean = false;

  constructor(
    private offlineService: OfflineService,
    private courierDataService: CourierDataService // ✅ ADDED
  ) { }

  ngOnChanges(): void {
    if (this.job) {
      this.requiresOTP = this.job?.codAmount > 0 || (this.job?.deliveryFee && this.job.deliveryFee > 100);
    } else {
      this.requiresOTP = false;
    }
  }

  onCameraPhotoCaptured(photoData: { file: File, preview: string }): void {
    if (this.photos.length >= 3) {
      alert('يمكنك إضافة 3 صور كحد أقصى');
      return;
    }

    this.photos.push(photoData.file);
    this.photoPreviews.push(photoData.preview);
  }

  onCameraPhotosChanged(files: File[]): void {
    this.photos = [...files];
    this.photoPreviews = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => this.photoPreviews.push(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  onCameraClosed(): void {
    this.isCameraActive = false;
  }

  toggleCamera(): void {
    this.isCameraActive = !this.isCameraActive;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار صورة فقط');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً (الحد الأقصى 5MB)');
      return;
    }

    if (this.photos.length >= 3) {
      alert('يمكنك إضافة 3 صور كحد أقصى');
      return;
    }

    this.photos.push(file);
    const reader = new FileReader();
    reader.onload = (e: any) => this.photoPreviews.push(e.target.result);
    reader.readAsDataURL(file);
  }

  removePhoto(index: number): void {
    this.photos.splice(index, 1);
    this.photoPreviews.splice(index, 1);
  }

  submitProof(): void {
    this.validateAndSubmitProof();
  }

  private async validateAndSubmitProof(): Promise<void> {
    if (this.photos.length === 0) {
      alert('يرجى التقاط صورة واحدة على الأقل (1-3 صور)');
      return;
    }

    if (this.requiresOTP && !this.otp) {
      alert('يرجى إدخال رمز OTP');
      return;
    }

    this.isSubmitting = true;

    const proofPayload = {
      notes: 'Delivery proof submitted'
    };

    try {
      if (this.offlineService.isCurrentlyOnline) {
        // ✅ SEND TO BACKEND (REQUIRED FIX)
        await this.courierDataService
          .completeDelivery(this.job.id, proofPayload)
          .toPromise();

        // ✅ SAVE LOCALLY (UNCHANGED BEHAVIOR)
        await this.offlineService.saveDeliveryProof(
          this.job.id,
          this.photoPreviews,
          this.otp
        );
      } else {
        await this.offlineService.saveDeliveryProof(
          this.job.id,
          this.photoPreviews,
          this.otp
        );

        alert('تم حفظ إثبات التسليم وسيتم إرساله عند عودة الإنترنت');
      }

      this.onComplete.emit({
        jobId: this.job.id,
        photos: this.photos,
        otp: this.otp
      });

    } catch (err) {
      console.error('Delivery proof submission failed', err);
      alert('حدث خطأ أثناء إرسال إثبات التسليم');
    } finally {
      this.isSubmitting = false;
    }
  }

  cancel(): void {
    this.photos = [];
    this.photoPreviews = [];
    this.otp = '';
    this.isCameraActive = false;
    this.onCancel.emit();
  }

  closeModal(): void {
    this.cancel();
  }

  sendOTP(): void {
    // This functionality seems to be a placeholder or client-side simulation in the previous code context
    // Ideally this should call a backend service to re-send OTP
    alert('تم إرسال رمز OTP جديد (محاكاة)');
  }

  get remainingPhotos(): number {
    return 3 - this.photos.length;
  }

  get canAddMorePhotos(): boolean {
    return this.photos.length < 3;
  }
}
