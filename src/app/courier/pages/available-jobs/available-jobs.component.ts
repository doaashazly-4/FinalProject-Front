import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CourierDataService, DeliveryJob } from '../../services/courier-data.service';
import { RejectReasonModalComponent } from '../../../shared/components/reject-reason-modal/reject-reason-modal.component';
import { NotificationService } from '../../../shared/services/notification.service';
import { NotificationHubService, DeliveryEvent } from '../../../shared/services/notification-hub.service';

@Component({
  selector: 'app-available-jobs',
  standalone: true,
  imports: [CommonModule, RouterModule, RejectReasonModalComponent],
  templateUrl: './available-jobs.component.html',
  styleUrls: ['./available-jobs.component.css']
})
export class AvailableJobsComponent implements OnInit, OnDestroy {
  jobs: DeliveryJob[] = [];
  isLoading = true;
  isRefreshing = false;
  showRejectModal = false;
  rejectingJob: DeliveryJob | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private dataService: CourierDataService,
    private notificationService: NotificationService,
    private hubService: NotificationHubService
  ) { }

  ngOnInit(): void {
    this.loadJobs();
    this.subscribeToNotifications();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Subscribe to real-time notifications for new jobs
   */
  private subscribeToNotifications(): void {
    // Start SignalR connection
    this.hubService.startConnection();

    // Listen for new request events (includes urgent & direct assignments)
    const newRequestSub = this.hubService.newRequest$.subscribe((event: DeliveryEvent) => {
      console.log('🔔 Received new request event:', event);

      // Trigger tier-specific notification
      if (event.type === 'urgent_request' || event.supplierTier === 'platinum') {
        this.notificationService.notifyUrgentRequest({
          requestId: event.requestId,
          description: event.description,
          source: event.source,
          destination: event.destination
        });
      } else if (event.type === 'direct_assignment' || event.supplierTier === 'plus') {
        this.notificationService.notifyDirectAssignment({
          requestId: event.requestId,
          description: event.description,
          source: event.source,
          destination: event.destination,
          supplierName: event.supplierName
        });
      } else {
        this.notificationService.notifyNewRequest({
          requestId: event.requestId,
          description: event.description,
          source: event.source,
          destination: event.destination,
          priority: event.priority,
          supplierTier: event.supplierTier
        });
      }

      // Refresh jobs list to get the new job
      this.refresh();
    });

    this.subscriptions.push(newRequestSub);
  }

  loadJobs(): void {
    this.isLoading = true;
    this.dataService.getAvailableJobs().subscribe({
      next: (jobs) => {
        console.log('API jobs:', jobs);
        this.jobs = jobs ?? []; // ✅ حماية إضافية
        this.isLoading = false;
        this.isRefreshing = false;

        // Check for urgent/plus jobs and highlight them
        const urgentJobs = this.jobs.filter(j => j.supplierTier === 'platinum');
        const plusJobs = this.jobs.filter(j => j.supplierTier === 'plus');

        if (urgentJobs.length > 0) {
          this.notificationService.showNotification({
            title: `🔥 ${urgentJobs.length} طلب عاجل متاح!`,
            message: 'لديك طلبات عاجلة تنتظر الاستجابة',
            type: 'warning',
            icon: 'bi-lightning-charge-fill',
            duration: 8000
          });
        }

        if (plusJobs.length > 0) {
          this.notificationService.showNotification({
            title: `⚡ ${plusJobs.length} تعيين مباشر`,
            message: 'موردون اختاروك للتوصيل',
            type: 'info',
            icon: 'bi-person-check-fill',
            duration: 6000
          });
        }
      },

      error: (err) => {
        console.error('Error loading jobs:', err);
        this.jobs = [];
        this.isLoading = false;
        this.isRefreshing = false;
      }
    });
  }

  refresh(): void {
    this.isRefreshing = true;
    this.loadJobs();
  }

  acceptJob(job: DeliveryJob): void {
    this.dataService.acceptJob(job.id).subscribe({
      next: () => {
        this.notificationService.showNotification({
          title: '✅ تم قبول المهمة',
          message: 'ستجدها في قسم مهامي',
          type: 'success',
          icon: 'bi-check-circle-fill'
        });
        this.jobs = this.jobs.filter(j => j.id !== job.id);
      },
      error: (err) => {
        console.error(err);
        this.notificationService.showNotification({
          title: '❌ خطأ',
          message: 'حدث خطأ أثناء قبول المهمة',
          type: 'error',
          icon: 'bi-x-circle-fill'
        });
      }
    });
  }

  startDelivery(job: any): void {
    this.dataService.startDelivery(job.id).subscribe({
      next: () => {
        job.status = 'out_for_delivery';
        this.notificationService.showNotification({
          title: '🚚 تم بدء التوصيل',
          message: 'توجه لاستلام الشحنة',
          type: 'info',
          icon: 'bi-truck'
        });
      },
      error: () => {
        this.notificationService.showNotification({
          title: '❌ خطأ',
          message: 'حدث خطأ أثناء بدء التوصيل',
          type: 'error',
          icon: 'bi-x-circle-fill'
        });
      }
    });
  }

  onRejectClick(job: DeliveryJob): void {
    this.rejectingJob = job;
    this.showRejectModal = true;
  }

  handleRejectConfirm(reason?: string): void {
    if (!this.rejectingJob) return;
    this.dataService.rejectJob(this.rejectingJob.id, reason).subscribe({
      next: () => {
        this.jobs = this.jobs.filter(j => j.id !== this.rejectingJob!.id);
        this.notificationService.showNotification({
          title: 'تم رفض المهمة',
          message: 'تم إزالة المهمة من قائمتك',
          type: 'info',
          icon: 'bi-dash-circle'
        });
        this.showRejectModal = false;
        this.rejectingJob = null;
      },
      error: (err) => {
        console.error('Error rejecting job:', err);
        this.notificationService.showNotification({
          title: '❌ خطأ',
          message: 'حدث خطأ أثناء رفض المهمة',
          type: 'error',
          icon: 'bi-x-circle-fill'
        });
        this.showRejectModal = false;
        this.rejectingJob = null;
      }
    });
  }

  handleRejectCancel(): void {
    this.showRejectModal = false;
    this.rejectingJob = null;
  }

  callSender(phone: string, event: Event): void {
    event.stopPropagation();
    window.open(`tel:${phone}`, '_self');
  }
}

