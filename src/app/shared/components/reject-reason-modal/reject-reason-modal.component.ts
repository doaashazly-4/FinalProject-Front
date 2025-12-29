import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reject-reason-modal',
  standalone: true,
  imports: [CommonModule , FormsModule],
  template: `
  <div *ngIf="isVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div class="bg-white rounded-2xl w-11/12 max-w-md p-6">
      <h3 class="text-lg font-bold mb-3">أسباب الرفض</h3>
      <p class="text-sm text-gray-600 mb-4">اختر سبباً لرفض المهمة (اختياري)</p>
      <div class="space-y-2 mb-4">
        <label *ngFor="let r of reasons" class="flex items-center gap-2">
          <input type="radio" name="rejectReason" [value]="r" [(ngModel)]="selectedReason" />
          <span class="text-sm">{{ r }}</span>
        </label>
      </div>
      <div class="flex justify-end gap-2">
        <button (click)="onCancelClick()" class="px-4 py-2 rounded-xl bg-gray-100">إلغاء</button>
        <button (click)="onConfirmClick()" class="px-4 py-2 rounded-xl bg-red-500 text-white">رفض</button>
      </div>
    </div>
  </div>
  `,
  styles: []
})
export class RejectReasonModalComponent {
  @Input() isVisible = false;
  @Output() onConfirm = new EventEmitter<string | undefined>();
  @Output() onCancel = new EventEmitter<void>();

  selectedReason?: string;

  reasons = [
    'بعيد جداً',
    'مشغول حالياً',
    'العنوان غير واضح',
    'أخرى'
  ];

  onConfirmClick(): void {
    this.onConfirm.emit(this.selectedReason);
    this.selectedReason = undefined;
  }

  onCancelClick(): void {
    this.onCancel.emit();
    this.selectedReason = undefined;
  }
}


