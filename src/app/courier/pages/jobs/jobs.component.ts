import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourierDataService, DeliveryJob, JobStatus } from '../../services/courier-data.service';

@Component({
  selector: 'app-courier-jobs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.css'
})
export class CourierJobsComponent implements OnInit {
  jobs: DeliveryJob[] = [];
  filter = 'الكل';
  isLoading = true;

  constructor(private data: CourierDataService) { }

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.isLoading = true;
    this.data.getMyJobs().subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading jobs:', err);
        this.jobs = [];
        this.isLoading = false;
      }
    });
  }

  filteredJobs(): DeliveryJob[] {
    if (this.filter === 'الكل') return this.jobs;

    return this.jobs.filter(j => {
      if (this.filter === 'جديد') return j.status === 'accepted' || j.status === 'available';
      if (this.filter === 'جارٍ التسليم') return ['picked_up', 'in_transit', 'out_for_delivery'].includes(j.status);
      if (this.filter === 'مكتمل') return j.status === 'delivered';
      if (this.filter === 'مؤجل') return ['failed', 'returned'].includes(j.status);
      return false;
    });
  }
}
