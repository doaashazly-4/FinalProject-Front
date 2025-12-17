import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CourierDataService, DeliveryJob } from '../../services/courier-data.service';

@Component({
  selector: 'app-available-jobs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './available-jobs.component.html',
  styleUrls: ['./available-jobs.component.css']
})
export class AvailableJobsComponent implements OnInit {
  jobs: DeliveryJob[] = [];
  isLoading = true;
  isRefreshing = false;

  constructor(private dataService: CourierDataService) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.isLoading = true;
    this.dataService.getAvailableJobs().subscribe({
      next: (jobs) => {
        this.jobs = jobs;
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
        this.jobs = this.jobs.filter(j => j.id !== job.id);
        alert('تم قبول المهمة بنجاح! يمكنك رؤيتها في قسم مهامي.');
      },
      error: (err) => {
        console.error('Error accepting job:', err);
        alert('حدث خطأ أثناء قبول المهمة');
      }
    });
  }

  rejectJob(job: DeliveryJob, reason?: string): void {
    this.dataService.rejectJob(job.id, reason).subscribe({
      next: () => {
        this.jobs = this.jobs.filter(j => j.id !== job.id);
        alert('تم رفض المهمة.');
      },
      error: (err) => {
        console.error('Error rejecting job:', err);
        alert('حدث خطأ أثناء رفض المهمة');
      }
    });
  }

  callSender(phone: string, event: Event): void {
    event.stopPropagation();
    window.open(`tel:${phone}`, '_self');
  }
}

