import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourierDataService, DeliveryJob, JobStatus } from '../../../../services/courier-data.service';
import { OfflineService } from '../../../../services/offline.service'; // ✅ جديد
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-workflow',
  imports: [CommonModule, FormsModule],
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.css']
})
export class WorkflowComponent implements OnInit {
  jobId: string = '';
  job: DeliveryJob | null = null;
  isLoading: boolean = true;

  showProofModal: boolean = false;
  showFailedProofModal: boolean = false;

  currentStep: number = 1;
  steps = [
    { id: 1, title: 'تم الاستلام', status: 'pending', action: 'pickup', icon: '📦' },
    { id: 2, title: 'في الطريق', status: 'pending', action: 'startDelivery', icon: '🚗' },
    { id: 3, title: 'وصلت للعميل', status: 'pending', action: 'arrived', icon: '🏠' },
    { id: 4, title: 'إنهاء العملية', status: 'pending', action: 'complete', icon: '✅' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courierService: CourierDataService,
    private offlineService: OfflineService // ✅ جديد
  ) {}

  ngOnInit(): void {
    this.jobId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.jobId) {
      alert('لم يتم تحديد رقم الطلب');
      this.router.navigate(['/courier/my-jobs']);
      return;
    }
    this.loadJobData();
    
    // ✅ مراقبة حالة الإنترنت (اختياري)
    this.monitorNetworkStatus();
  }

  /**
   * 🔥 مراقبة حالة الإنترنت وعرض تنبيهات
   */
  private monitorNetworkStatus(): void {
    this.offlineService.onlineStatus$.subscribe(isOnline => {
      if (!isOnline) {
        console.log('📴 تعمل الآن بدون إنترنت');
        // يمكنك إضافة تنبيه بصري هنا
      }
    });
  }

  loadJobData(): void {
    this.isLoading = true;

    this.courierService.getMyAssignedPackages()?.subscribe({
      next: (jobs: DeliveryJob[]) => this.findJobInList(jobs),
      error: () => this.tryAlternativeLoad()
    });
  }

  findJobInList(jobs: DeliveryJob[]): void {
    const foundJob = jobs.find(j => j.id === this.jobId || j.trackingNumber === this.jobId);
    if (foundJob) {
      this.job = foundJob;
      this.updateStepsBasedOnStatus();
      this.isLoading = false;
    } else {
      this.tryAlternativeLoad();
    }
  }

  tryAlternativeLoad(): void {
    this.courierService.getMyJobs()?.subscribe({
      next: (jobs: DeliveryJob[]) => this.findJobInList(jobs),
      error: () => {
        alert('الطلب غير موجود أو تم تسليمه بالفعل');
        this.router.navigate(['/courier/my-jobs']);
      }
    });
  }

  updateStepsBasedOnStatus(): void {
    if (!this.job) return;

    const statusMap: Partial<Record<JobStatus, number>> = {
      accepted: 0,
      picked_up: 1,
      in_transit: 2,
      out_for_delivery: 3,
      delivered: 4
    };

    const completedStep = this.job.status ? statusMap[this.job.status] ?? 0 : 0;
    this.currentStep = completedStep + 1;

    this.steps.forEach(step => {
      if (step.id <= completedStep) step.status = 'completed';
      else if (step.id === this.currentStep) step.status = 'current';
      else step.status = 'pending';
    });
  }

  executeStep(step: { id: number; action: string; status: string }): void {
    if (step.status === 'completed') return;

    switch (step.action) {
      case 'pickup': this.confirmPickup(); break;
      case 'startDelivery': this.startDelivery(); break;
      case 'arrived': this.confirmArrival(); break;
      case 'complete': this.showCompletionOptions(); break;
    }
  }

  confirmPickup(): void {
    if (!this.job) return;
    if (confirm('هل تأكدت من استلام الطرد من المورد؟')) {
      this.updateJobStatus('picked_up', 'تم الاستلام بنجاح');
    }
  }

  startDelivery(): void {
    if (!this.job) return;
    if (confirm('هل بدأت التوصيل للعميل؟')) {
      this.updateJobStatus('in_transit', 'بدأ التوصيل بنجاح');
    }
  }

  confirmArrival(): void {
    if (!this.job) return;
    if (confirm('هل وصلت لعنوان العميل؟')) {
      this.updateJobStatus('out_for_delivery', 'تم تأكيد الوصول');
    }
  }

  showCompletionOptions(): void {
    // زر نجاح / فشل التسليم في HTML
  }

  /**
   * 🔥 تحديث حالة الطلب مع دعم العمل بدون إنترنت
   */
  async updateJobStatus(status: JobStatus, successMessage: string): Promise<void> {
    if (!this.job) return;

    const statusData = {
      jobId: this.jobId,
      status: status,
      timestamp: new Date().toISOString(),
      location: await this.getCurrentLocation(),
      courierId: this.getCourierId()
    };

    try {
      if (this.offlineService.isCurrentlyOnline) {
        // إرسال مباشر للـ API
        this.courierService.updateJobStatus(this.jobId, status).subscribe({
          next: () => {
            alert(`✅ ${successMessage}`);
            if (this.job) {
              this.job.status = status;
              this.updateStepsBasedOnStatus();
            }
          },
          error: (err) => {
            console.error('Error updating status:', err);
            this.saveStatusUpdateOffline(status, statusData, err);
          }
        });
      } else {
        // حفظ مباشر للعمل بدون إنترنت
        await this.saveStatusUpdateOffline(status, statusData);
      }
    } catch (error) {
      console.error('Error in updateJobStatus:', error);
      alert('حدث خطأ في تحديث الحالة');
    }
  }

  /**
   * 🔥 حفظ تحديث الحالة للعمل بدون إنترنت
   */
  private async saveStatusUpdateOffline(
    status: JobStatus, 
    statusData: any, 
    originalError?: any
  ): Promise<void> {
    try {
      await this.offlineService.saveStatusUpdate(
        this.jobId,
        status,
        statusData
      );
      
      if (this.job) {
        this.job.status = status;
        this.updateStepsBasedOnStatus();
      }
      
      if (originalError) {
        alert(`💾 تم حفظ التحديث محلياً بعد فشل الإرسال\nسيتم إرساله تلقائياً عند عودة الإنترنت`);
      } else {
        alert(`💾 تم حفظ التحديث\nسيتم إرساله تلقائياً عند عودة الإنترنت`);
      }
      
    } catch (saveError) {
      console.error('Failed to save status update offline:', saveError);
      alert('فشل حفظ التحديث، حاول مرة أخرى');
    }
  }

  /**
   * 🔥 الحصول على الموقع الحالي
   */
  private async getCurrentLocation(): Promise<{lat: number, lng: number} | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  }

  /**
   * 🔥 الحصول على ID الموزع
   */
  private getCourierId(): string {
    return localStorage.getItem('courier_id') || 'unknown';
  }

  openDeliveryProof(): void { this.showProofModal = true; }
  openFailedProof(): void { this.showFailedProofModal = true; }

  async handleDeliveryComplete(proofData: any): Promise<void> {
    this.showProofModal = false;
    
    try {
      await this.updateJobStatus('delivered', 'تم إكمال التسليم');
      
      proofData.jobId = this.jobId;
      proofData.status = 'delivered';
      proofData.timestamp = new Date().toISOString();
      
      alert('✅ تم إرسال إثبات التسليم بنجاح');
      
    } catch (error) {
      console.error('Error handling delivery complete:', error);
    }
  }

  async handleDeliveryFailure(failureData: any): Promise<void> {
    this.showFailedProofModal = false;
    
    try {
      await this.updateJobStatus('failed', 'تم إبلاغ فشل التسليم');
      
      failureData.jobId = this.jobId;
      failureData.status = 'failed';
      failureData.failedAt = new Date().toISOString();
      
      alert('⚠️ تم إرسال إبلاغ الفشل');
      
    } catch (error) {
      console.error('Error handling delivery failure:', error);
    }
  }

  cancelModal(): void {
    this.showProofModal = false;
    this.showFailedProofModal = false;
  }

  openGoogleMaps(): void {
    if (!this.job?.deliveryAddress) return;
    const address = encodeURIComponent(this.job.deliveryAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  }

  callCustomer(): void {
    const phone = this.job?.customerPhone || this.job?.receiverPhone;
    if (!phone) return;
    window.open(`tel:${phone}`, '_self');
  }

  goBack(): void {
    this.router.navigate(['/courier/my-jobs']);
  }
}