import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourierDataService, DeliveryJob, JobStatus } from '../../services/courier-data.service';
import { DeliveryProofComponent } from './components/delivery-proof.component';
import { FailedDeliveryProofComponent } from './components/failed-delivery-proof.component';

@Component({
  selector: 'app-delivery',
  standalone: true,
  imports: [CommonModule, DeliveryProofComponent, FailedDeliveryProofComponent],
  templateUrl: './delivery.component.html',
  styleUrls: ['./delivery.component.css']
})
export class DeliveryComponent implements OnInit {
  job: DeliveryJob | null = null;
  isLoading = true;

  // ===== Modals =====
  showProofModal = false;
  showFailedModal = false;       // استخدمها بدل showFailedProofModal
  newProofData: any = null;      // لتخزين بيانات Proof قبل الإرسال

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: CourierDataService
  ) {}

  ngOnInit(): void {
    const jobId = this.route.snapshot.paramMap.get('id');
    if (jobId) this.loadJob(+jobId);
  }

  // ===== Load Job =====
  loadJob(id: number): void {
    this.isLoading = true;
    this.dataService.getJobById(id.toString()).subscribe({
      next: (job) => { this.job = job; this.isLoading = false; },
      error: (err) => { console.error('Error loading job:', err); this.isLoading = false; }
    });
  }

  // ===== Navigation =====
  navigateToPickup(): void {
    if (!this.job) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${this.job.pickupLocation.lat},${this.job.pickupLocation.lng}`;
    window.open(url, '_blank');
  }

  navigateToDropoff(): void {
    if (!this.job) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${this.job.dropoffLocation.lat},${this.job.dropoffLocation.lng}`;
    window.open(url, '_blank');
  }

  // ===== Status Updates =====
  markPickedUp(): void {
    if (!this.job) return;

    const updateStatus = () => {
      this.dataService.updateJobStatus(this.job!.id, 'picked_up' as JobStatus).subscribe({
        next: () => this.job!.status = 'picked_up' as JobStatus,
        error: (err) => console.error('Error updating status:', err)
      });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const pickupData = { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: new Date() };
          this.dataService.updateJobStatus(this.job!.id, 'picked_up' as JobStatus, undefined, pickupData).subscribe({
            next: () => this.job!.status = 'picked_up' as JobStatus,
            error: (err) => console.error('Error updating status with location:', err)
          });
        },
        () => updateStatus()
      );
    } else updateStatus();
  }

  markOutForDelivery(): void {
    if (!this.job) return;
    this.dataService.updateJobStatus(this.job.id, 'out_for_delivery' as JobStatus).subscribe({
      next: () => this.job!.status = 'out_for_delivery' as JobStatus,
      error: (err) => console.error('Error updating status:', err)
    });
  }

  completeDelivery(): void { this.showProofModal = true; }

  unableToDeliver(reason: string): void {
    this.showFailedModal = true;
  }

  // ===== Call =====
  callSender(phone: string): void { window.open(`tel:${phone}`, '_self'); }
  callReceiver(phone: string): void { window.open(`tel:${phone}`, '_self'); }
  callCustomer(): void { if (this.job) window.open(`tel:${this.job.receiverPhone}`, '_self'); }

  // ===== Helpers =====
  getStatusText(status: JobStatus): string {
    const statusMap: { [key in JobStatus]: string } = {
      available: 'متاح',
      accepted: 'تم القبول',
      picked_up: 'تم الاستلام',
      in_transit: 'قيد التوصيل',
      out_for_delivery: 'وصلت للمنطقة',
      delivered: 'تم التسليم',
      failed: 'فشل',
      returned: 'مُرتجع'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: JobStatus): string {
    const classMap: { [key in JobStatus]: string } = {
      available: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-indigo-100 text-indigo-800',
      in_transit: 'bg-purple-100 text-purple-800',
      out_for_delivery: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      returned: 'bg-orange-100 text-orange-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }

  // ===== Proof Modals =====
  handleDeliveryComplete(event: any): void {
    if (!this.job) return;
    this.showProofModal = false;
    this.dataService.completeJob(this.job.id, event).subscribe({
      next: () => { this.job!.status = 'delivered' as JobStatus; this.router.navigate(['/courier/my-jobs']); },
      error: (err) => { console.error('Error completing delivery:', err); alert('حدث خطأ أثناء إتمام المهمة'); }
    });
  }

  handleDeliveryFailure(event: any): void {
    if (!this.job) return;
    this.showFailedModal = false;
    this.dataService.updateJobStatus(this.job.id, 'failed' as JobStatus, event.reason, event).subscribe({
      next: () => { this.job!.status = 'failed' as JobStatus; this.router.navigate(['/courier/my-jobs']); },
      error: (err) => { console.error('Error updating failure:', err); alert('حدث خطأ أثناء تحديث حالة المهمة'); }
    });
  }

  cancelModal(): void { this.showProofModal = false; this.showFailedModal = false; }

  onProofComplete(event: any): void { this.handleDeliveryComplete(event); }
  onProofCancel(): void { this.cancelModal(); }

  onFailedSubmit(event: any): void { this.handleDeliveryFailure(event); }
  onFailedCancel(): void { this.cancelModal(); }
}