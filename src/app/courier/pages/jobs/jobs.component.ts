import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourierDataService, DeliveryJob as CourierJob } from '../../services/courier-data.service';
import { ChatService } from '../../../shared/services/chat.service';

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

  constructor(
    private data: CourierDataService,
    private chatService: ChatService
  ) { }

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.isLoading = true;
    this.data.getMyJobs().subscribe({
      next: (jobs: CourierJob[]) => {
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

  openChat(job: any): void {
    // Assuming senderId or supplierId exists, fallback to senderPhone if not
    const supplierId = job.senderId || job.supplierId || job.senderPhone;
    this.chatService.triggerChat(supplierId, job.senderName || 'Supplier', job.id);
  }
}
