import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-delivery-proof',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery-proof.component.html',
  styleUrls: ['./delivery-proof.component.css'] // ✅ تصحيح
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

  constructor() {}

  ngOnChanges(): void {
    // Check if OTP is required (for COD or high-value orders)
    if (this.job) {
      this.requiresOTP = this.job?.codAmount > 0 || (this.job?.deliveryFee && this.job.deliveryFee > 100);
    } else {
      this.requiresOTP = false;
    }
  }

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

  sendOTP(): void {
    alert('تم إرسال رمز OTP إلى هاتف العميل');
  }

  submitProof(): void {
    if (this.photos.length === 0) {
      alert('يرجى التقاط صورة واحدة على الأقل (1-3 صور)');
      return;
    }

    if (this.requiresOTP && !this.otp) {
      alert('يرجى إدخال رمز OTP للتحقق من الدفع (إلزامي للطلبات COD)');
      return;
    }

    this.isSubmitting = true;

    const proof = {
      jobId: this.job.id,
      photos: this.photos,
      photoFiles: this.photos,
      otp: this.otp,
      timestamp: new Date()
    };

    this.onComplete.emit(proof);
  }

  cancel(): void {
    this.photos = [];
    this.photoPreviews = [];
    this.otp = '';
    this.onCancel.emit();
  }

  closeModal(): void {
    this.cancel();
  }
}
