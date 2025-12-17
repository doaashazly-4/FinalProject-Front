import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CourierDataService, DeliveryJob, JobStatus } from '../../services/courier-data.service';

@Component({
  selector: 'app-my-jobs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-jobs.component.html',
  styleUrls: ['./my-jobs.component.css']
})
export class MyJobsComponent implements OnInit {
  jobs: DeliveryJob[] = [];
  filteredJobs: DeliveryJob[] = [];
  filter: 'all' | 'active' | 'completed' = 'active';
  isLoading = true;

  constructor(private dataService: CourierDataService) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.isLoading = true;
    this.dataService.getMyJobs().subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading jobs:', err);
        this.jobs = [];
        this.filteredJobs = [];
        this.isLoading = false;
      }
    });
  }

  applyFilter(): void {
    if (this.filter === 'all') {
      this.filteredJobs = this.jobs;
    } else if (this.filter === 'active') {
      this.filteredJobs = this.jobs.filter(j => !['delivered', 'failed', 'returned'].includes(j.status));
    } else {
      this.filteredJobs = this.jobs.filter(j => ['delivered', 'failed', 'returned'].includes(j.status));
    }
  }

  setFilter(filter: 'all' | 'active' | 'completed'): void {
    this.filter = filter;
    this.applyFilter();
  }

  updateJobStatus(job: DeliveryJob, newStatus: JobStatus): void {
    switch (newStatus) {
      case 'picked_up':
        this.dataService.pickupJob(job.id).subscribe({
          next: () => {
            job.status = 'picked_up';
            job.pickedUpAt = new Date();
          },
          error: (err) => {
            console.error('Error updating job:', err);
            alert('حدث خطأ أثناء تحديث حالة المهمة');
          }
        });
        break;
      case 'in_transit':
        this.dataService.startDelivery(job.id).subscribe({
          next: () => {
            job.status = 'in_transit';
          },
          error: (err) => {
            console.error('Error updating job:', err);
            alert('حدث خطأ أثناء تحديث حالة المهمة');
          }
        });
        break;
      case 'delivered':
        this.dataService.completeJob(job.id, {
          jobId: job.id,
          imageUrl: '',
          timestamp: new Date()
        }).subscribe({
          next: () => {
            job.status = 'delivered';
            job.deliveredAt = new Date();
            this.applyFilter();
          },
          error: (err) => {
            console.error('Error completing job:', err);
            alert('حدث خطأ أثناء إتمام المهمة');
          }
        });
        break;
    }
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'available': 'متاح',
      'accepted': 'في انتظار الاستلام',
      'picked_up': 'تم الاستلام',
      'in_transit': 'في الطريق للمستلم',
      'out_for_delivery': 'وصلت للمنطقة',
      'delivered': 'تم التسليم',
      'failed': 'فشل التسليم',
      'returned': 'تم الإرجاع'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'accepted': 'bg-blue-100 text-blue-800 border-blue-200',
      'picked_up': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'in_transit': 'bg-purple-100 text-purple-800 border-purple-200',
      'out_for_delivery': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'delivered': 'bg-green-100 text-green-800 border-green-200',
      'failed': 'bg-red-100 text-red-800 border-red-200',
      'returned': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getNextAction(status: string): { label: string; action: JobStatus; class: string } | null {
    const actions: { [key: string]: { label: string; action: JobStatus; class: string } } = {
      'accepted': { label: 'تأكيد الاستلام', action: 'picked_up', class: 'from-blue-500 to-blue-600' },
      'picked_up': { label: 'بدء التوصيل', action: 'in_transit', class: 'from-purple-500 to-purple-600' },
      'in_transit': { label: 'تأكيد التسليم', action: 'delivered', class: 'from-primary-green to-secondary-teal' },
      'out_for_delivery': { label: 'تأكيد التسليم', action: 'delivered', class: 'from-primary-green to-secondary-teal' }
    };
    return actions[status] || null;
  }

  callSender(phone: string): void {
    window.open(`tel:${phone}`, '_self');
  }

  callReceiver(phone: string): void {
    window.open(`tel:${phone}`, '_self');
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

