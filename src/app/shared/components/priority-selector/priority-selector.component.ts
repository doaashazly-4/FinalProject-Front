import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

export type DeliveryPriority = 'normal' | 'urgent';

@Component({
    selector: 'app-priority-selector',
    standalone: true,
    imports: [CommonModule],
    animations: [
        trigger('modalEnter', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.9)' }),
                animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.9)' }))
            ])
        ])
    ],
    template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" *ngIf="isVisible">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="close()"></div>
      
      <!-- Modal -->
      <div [@modalEnter] class="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
        
        <!-- Header -->
        <div class="bg-gradient-to-br from-primary-dark to-gray-900 p-8 text-white text-center">
          <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center">
            <i class="bi bi-box-seam-fill text-4xl"></i>
          </div>
          <h2 class="text-2xl font-black mb-2">اختر نوع التوصيل</h2>
          <p class="text-white/70">حدد أولوية شحنتك الجديدة</p>
        </div>
        
        <!-- Options -->
        <div class="p-6 space-y-4">
          
          <!-- Normal Delivery -->
          <button (click)="selectPriority('normal')"
            class="w-full p-6 rounded-2xl border-2 border-gray-200 hover:border-primary-green hover:bg-primary-green/5 transition-all text-right group">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-gray-100 group-hover:bg-primary-green/10 flex items-center justify-center transition-all">
                <i class="bi bi-clock text-3xl text-gray-600 group-hover:text-primary-green"></i>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-black text-primary-dark mb-1">توصيل عادي</h3>
                <p class="text-gray-500 text-sm mb-2">توصيل خلال 24-48 ساعة</p>
                <div class="flex items-center gap-2 text-xs">
                  <span class="px-2 py-1 bg-gray-100 rounded-lg text-gray-600">✓ أقل تكلفة</span>
                  <span class="px-2 py-1 bg-gray-100 rounded-lg text-gray-600">✓ مرونة في الوقت</span>
                </div>
              </div>
              <i class="bi bi-chevron-left text-gray-400 group-hover:text-primary-green text-xl"></i>
            </div>
          </button>
          
          <!-- Urgent Delivery -->
          <button (click)="selectPriority('urgent')"
            class="w-full p-6 rounded-2xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50 hover:border-red-400 transition-all text-right group relative overflow-hidden">
            
            <!-- Recommended Badge -->
            <div class="absolute top-0 left-0 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-1 text-xs font-bold rounded-br-xl">
              <i class="bi bi-stars ml-1"></i>
              موصى به للطلبات الحساسة
            </div>
            
            <div class="flex items-center gap-4 mt-4">
              <div class="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                <i class="bi bi-lightning-charge-fill text-3xl text-red-500"></i>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-black text-primary-dark mb-1">
                  توصيل عاجل
                  <span class="text-red-500 text-sm font-normal mr-2">+20 ج.م</span>
                </h3>
                <p class="text-gray-500 text-sm mb-2">توصيل سريع في أقرب وقت</p>
                <div class="flex items-center gap-2 text-xs flex-wrap">
                  <span class="px-2 py-1 bg-red-100 rounded-lg text-red-600">⚡ أسرع مندوب</span>
                  <span class="px-2 py-1 bg-blue-100 rounded-lg text-blue-600">🎯 تعيين تلقائي</span>
                </div>
              </div>
              <i class="bi bi-chevron-left text-red-400 text-xl"></i>
            </div>
            
            <!-- Lynx Talisman Note -->
            <div class="mt-4 p-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <i class="bi bi-stars text-white text-sm"></i>
              </div>
              <p class="text-xs text-indigo-800 flex-1">
                <strong>Lynx Talisman:</strong> سيتم تعيين أفضل مندوب تلقائياً بناءً على الموقع والأداء
              </p>
            </div>
          </button>
          
        </div>
        
        <!-- Footer -->
        <div class="p-6 pt-0 text-center">
          <button (click)="close()" class="text-gray-500 text-sm hover:text-gray-700">
            إلغاء
          </button>
        </div>
        
      </div>
    </div>
  `
})
export class PrioritySelectorComponent {
    @Output() prioritySelected = new EventEmitter<DeliveryPriority>();
    @Output() closed = new EventEmitter<void>();

    isVisible = false;

    open() {
        this.isVisible = true;
    }

    close() {
        this.isVisible = false;
        this.closed.emit();
    }

    selectPriority(priority: DeliveryPriority) {
        this.prioritySelected.emit(priority);
        this.close();
    }
}
