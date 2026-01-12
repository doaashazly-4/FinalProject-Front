import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, AppNotification } from '../../services/notification.service';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
    selector: 'app-toast-notifications',
    standalone: true,
    imports: [CommonModule],
    animations: [
        trigger('slideIn', [
            transition(':enter', [
                style({ transform: 'translateX(100%)', opacity: 0 }),
                animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(100%)', opacity: 0 }))
            ])
        ])
    ],
    template: `
    <div class="fixed top-4 left-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <div *ngFor="let notif of notifications" [@slideIn]
        class="pointer-events-auto bg-white rounded-2xl shadow-2xl border overflow-hidden"
        [ngClass]="getBorderClass(notif.type)">
        
        <div class="flex items-start gap-4 p-4">
          <!-- Icon -->
          <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            [ngClass]="getIconBgClass(notif.type)">
            <i class="bi text-xl" [ngClass]="notif.icon || getDefaultIcon(notif.type)"></i>
          </div>
          
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-primary-dark text-sm mb-0.5">{{ notif.title }}</h4>
            <p class="text-gray-600 text-sm leading-snug">{{ notif.message }}</p>
          </div>
          
          <!-- Close -->
          <button (click)="dismiss(notif.id!)" 
            class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0">
            <i class="bi bi-x text-lg"></i>
          </button>
        </div>
        
        <!-- Progress bar for auto-dismiss -->
        <div *ngIf="notif.duration && notif.duration > 0" 
          class="h-1 bg-gray-100">
          <div class="h-full transition-all ease-linear"
            [ngClass]="getProgressClass(notif.type)"
            [style.animation]="'shrink ' + notif.duration + 'ms linear forwards'">
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    @keyframes shrink {
      from { width: 100%; }
      to { width: 0%; }
    }
  `]
})
export class ToastNotificationsComponent implements OnDestroy {
    notifications: AppNotification[] = [];
    private subscription: Subscription;

    constructor(private notificationService: NotificationService) {
        this.subscription = this.notificationService.toastQueue$.subscribe(queue => {
            this.notifications = queue;
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    dismiss(id: string) {
        this.notificationService.dismissNotification(id);
    }

    getBorderClass(type?: string): string {
        switch (type) {
            case 'success': return 'border-green-200';
            case 'error': return 'border-red-200';
            case 'warning': return 'border-yellow-200';
            case 'lynx': return 'border-indigo-200';
            default: return 'border-blue-200';
        }
    }

    getIconBgClass(type?: string): string {
        switch (type) {
            case 'success': return 'bg-green-100 text-green-600';
            case 'error': return 'bg-red-100 text-red-600';
            case 'warning': return 'bg-yellow-100 text-yellow-600';
            case 'lynx': return 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white';
            default: return 'bg-blue-100 text-blue-600';
        }
    }

    getDefaultIcon(type?: string): string {
        switch (type) {
            case 'success': return 'bi-check-circle-fill';
            case 'error': return 'bi-x-circle-fill';
            case 'warning': return 'bi-exclamation-triangle-fill';
            case 'lynx': return 'bi-stars';
            default: return 'bi-info-circle-fill';
        }
    }

    getProgressClass(type?: string): string {
        switch (type) {
            case 'success': return 'bg-green-500';
            case 'error': return 'bg-red-500';
            case 'warning': return 'bg-yellow-500';
            case 'lynx': return 'bg-gradient-to-r from-indigo-500 to-purple-600';
            default: return 'bg-blue-500';
        }
    }
}
