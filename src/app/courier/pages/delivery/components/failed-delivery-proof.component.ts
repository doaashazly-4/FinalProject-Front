import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-failed-delivery-proof',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './failed-delivery-proof.component.html',
  styleUrls: ['./failed-delivery-proof.component.css'] // ✅ تصحيح
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

  reasons = [
    { value: 'no_answer', label: 'لا يوجد رد من العميل' },
    { value: 'refused', label: 'رفض العميل الاستلام' },
    { value: 'wrong_address', label: 'العنوان خاطئ' },
    { value: 'damaged', label: 'الطرد تالف' },
    { value: 'other', label: 'سبب آخر' }
  ];

  constructor() {}

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

  submitFailure(): void {
    if (!this.selectedReason) {
      alert('يرجى اختيار سبب الفشل');
      return;
    }

    if (this.photoPreviews.length === 0) {
      alert('يرجى التقاط صورة واحدة على الأقل كدليل');
      return;
    }

    this.isSubmitting = true;

    const failureData = {
      reason: this.selectedReason,
      photos: this.photoPreviews,
      photoFiles: this.photos,
      notes: this.notes
    };

    this.onSubmit.emit(failureData);
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
}
