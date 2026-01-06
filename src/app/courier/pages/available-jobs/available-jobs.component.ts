import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CourierDataService, DeliveryJob } from '../../services/courier-data.service';
import { RejectReasonModalComponent } from '../../../shared/components/reject-reason-modal/reject-reason-modal.component';

@Component({
  selector: 'app-available-jobs',
  standalone: true,
  imports: [CommonModule, RouterModule, RejectReasonModalComponent],
  templateUrl: './available-jobs.component.html',
  styleUrls: ['./available-jobs.component.css']
})
export class AvailableJobsComponent implements OnInit {
  jobs: DeliveryJob[] = [];
  isLoading = true;
  isRefreshing = false;
  showRejectModal = false;
  rejectingJob: DeliveryJob | null = null;

  constructor(private dataService: CourierDataService) { }

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.isLoading = true;
    this.dataService.getAvailableJobs().subscribe({
      next: (jobs) => {
        console.log('API jobs:', jobs);
        this.jobs = jobs ?? []; // ✅ حماية إضافية
        this.isLoading = false;
        this.isRefreshing = false;
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
        alert('تم قبول المهمة بنجاح! ستجدها في قسم مهامي.');
        this.jobs = this.jobs.filter(j => j.id !== job.id);
      },
      error: (err) => {
        console.error(err);
        alert('حدث خطأ أثناء قبول المهمة');
      }
    });
  }

  startDelivery(job: any): void {
    this.dataService.startDelivery(job.id).subscribe({
      next: () => {
        job.status = 'out_for_delivery';
        alert('تم بدء التوصيل');
      },
      error: () => {
        alert('حدث خطأ أثناء بدء التوصيل');
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
        alert('تم رفض المهمة.');
        this.showRejectModal = false;
        this.rejectingJob = null;
      },
      error: (err) => {
        console.error('Error rejecting job:', err);
        alert('حدث خطأ أثناء رفض المهمة');
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

