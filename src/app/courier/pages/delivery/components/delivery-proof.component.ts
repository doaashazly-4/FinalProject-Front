import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryJob } from '../../../services/courier-data.service';

@Component({
  selector: 'app-delivery-proof',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery-proof.component.html'
})
export class DeliveryProofComponent {
  @Input() isVisible = false;
  @Input() job: DeliveryJob | null = null;
  @Input() isSubmitting = false; // Controlled by parent
  @Input() expectedOtp?: string; // For Demo purposes

  otp = '';
  notes = '';
  error: string | null = null;
  // State controlled by parent via isSubmitting

  @Output() onComplete = new EventEmitter<{ otp: string; notes?: string }>();
  @Output() onCancel = new EventEmitter<void>();
  @Output() onRefresh = new EventEmitter<void>();

  submit() {
    if (!this.otp || this.otp.length < 4) {
      this.error = 'يرجى إدخال رمز OTP صحيح';
      return;
    }

    // this.isSubmitting = true; // Let parent control this
    this.error = null;

    this.onComplete.emit({
      otp: this.otp,
      notes: this.notes
    });
  }

  cancel() {
    this.onCancel.emit();
  }

  refresh() {
    this.onRefresh.emit();
  }
}
