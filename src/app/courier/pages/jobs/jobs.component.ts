import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourierDataService, CourierJob } from '../../services/courier-data.service';

@Component({
  selector: 'app-courier-jobs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.css'
})
export class CourierJobsComponent implements OnInit {
  jobs: CourierJob[] = [];
  filter = 'الكل';
  isLoading = true;

  constructor(private data: CourierDataService) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.isLoading = true;
    this.data.getJobs().subscribe({
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

  filteredJobs(): CourierJob[] {
    if (this.filter === 'الكل') return this.jobs;
    return this.jobs.filter(j => j.status === this.filter);
  }
}
