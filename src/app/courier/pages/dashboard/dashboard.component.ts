import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CourierDataService, DeliveryJob, CourierStat, CourierEarnings } from '../../services/courier-data.service';

@Component({
  selector: 'app-courier-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class CourierDashboardComponent implements OnInit {
  stats: CourierStat[] = [];
  activeJobs: DeliveryJob[] = [];
  availableJobs: DeliveryJob[] = [];
  jobs: DeliveryJob[] = [];
  earnings: CourierEarnings | null = null;
  isLoading = true;
  isAvailable = false;
  locationInterval: any;
  isOnline = navigator.onLine;
  showEndShiftSummary = false;
  endShiftSummary: any = null;
  newOrderNotification: DeliveryJob | null = null;

  constructor(private dataService: CourierDataService) {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.loadEarnings();
    this.checkForNewOrders();
    // Check for new orders every 30 seconds
    setInterval(() => this.checkForNewOrders(), 30000);
  }

  loadEarnings(): void {
    this.dataService.getEarnings().subscribe({
      next: (earnings) => {
        this.earnings = earnings;
      },
      error: (err) => {
        console.error('Error loading earnings:', err);
      }
    });
  }

  checkForNewOrders(): void {
    if (!this.isAvailable || !this.isOnline) return;
    
    this.dataService.getAvailableJobs().subscribe({
      next: (jobs) => {
        // Check for new orders (not shown before)
        const newJobs = jobs.filter(job => 
          !this.availableJobs.find(aj => aj.id === job.id)
        );
        if (newJobs.length > 0) {
          this.showNewOrderNotification(newJobs[0]);
        }
      },
      error: (err) => console.error('Error checking for new orders:', err)
    });
  }

  showNewOrderNotification(job: DeliveryJob): void {
    this.newOrderNotification = job;
    // Play sound notification
    this.playNotificationSound();
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (this.newOrderNotification?.id === job.id) {
        this.newOrderNotification = null;
      }
    }, 10000);
  }

  playNotificationSound(): void {
    // Create and play notification sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURAJR6Hh8sBpJAUwgM/z1oQ1Bhxqvu3knlEQCEWf4fK+bCEFMYfR89OCMwYebsDv45lREAlHoOHywGkkBTCAz/PWhDUGHGq+7eSeURAIRZ/h8r5sIQUxh9Hz04IzBh5uwO/jmVEQCUeg4fLAaSQFMIDP89aENQYcar7t5J5REAhFn+HyvmwhBTGH0fPTgjMGHm7A7+OZURA=');
    audio.volume = 0.5;
    audio.play().catch(() => {}); // Ignore errors
  }

  dismissNotification(): void {
    this.newOrderNotification = null;
  }

  viewNewOrder(): void {
    if (this.newOrderNotification) {
      window.location.href = `/courier/delivery/${this.newOrderNotification.id}`;
    }
  }

  syncOfflineData(): void {
    // Sync queued actions when coming back online
    // This would sync cached tasks, status updates, photos, etc.
    console.log('Syncing offline data...');
    // Implementation would use IndexedDB or similar to queue actions
  }

  loadData(): void {
    this.isLoading = true;

    this.dataService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (err) => {
        console.error('Error loading stats:', err);
        this.stats = [];
      }
    });

    this.dataService.getActiveJobs().subscribe({
      next: (jobs) => {
        this.activeJobs = jobs;
      },
      error: (err) => {
        console.error('Error loading active jobs:', err);
        this.activeJobs = [];
      }
    });

    this.dataService.getAvailableJobs().subscribe({
      next: (jobs) => {
        this.availableJobs = jobs.slice(0, 3);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading available jobs:', err);
        this.availableJobs = [];
        this.isLoading = false;
      }
    });

    this.dataService.getMyJobs().subscribe({
      next: (jobs) => {
        this.jobs = jobs;
      },
      error: (err) => {
        console.error('Error loading jobs:', err);
        this.jobs = [];
      }
    });
  }

  toggleAvailability(): void {
    const newAvailability = !this.isAvailable;
    this.dataService.toggleAvailability(newAvailability).subscribe({
      next: () => {
        if (newAvailability) {
          this.startLocationTracking();
        } else {
          this.stopLocationTracking();
          this.showEndShiftSummaryModal();
        }
        this.isAvailable = newAvailability;
      },
      error: (err) => console.error('Error toggling availability:', err)
    });
  }

  showEndShiftSummaryModal(): void {
    // Calculate today's summary
    const todayDeliveries = this.jobs?.filter(job => 
      job.status === 'delivered' && 
      job.deliveredAt && 
      new Date(job.deliveredAt).toDateString() === new Date().toDateString()
    ) || [];

    const todayEarnings = todayDeliveries.reduce((sum, job) => sum + job.courierEarning, 0);
    const codCollected = todayDeliveries
      .filter(job => job.codAmount > 0)
      .reduce((sum, job) => sum + job.codAmount, 0);

    this.endShiftSummary = {
      deliveries: todayDeliveries.length,
      earnings: todayEarnings,
      codCollected: codCollected,
      date: new Date()
    };

    this.showEndShiftSummary = true;
  }

  closeEndShiftSummary(): void {
    this.showEndShiftSummary = false;
    this.endShiftSummary = null;
  }

  startLocationTracking(): void {
    if (navigator.geolocation) {
      this.locationInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.dataService.updateLocation(position.coords.latitude, position.coords.longitude).subscribe({
              error: (err) => console.error('Error updating location:', err)
            });
          },
          (error) => {
            console.error('Error getting location:', error);
          }
        );
      }, 10000); // Every 10 seconds
    }
  }

  stopLocationTracking(): void {
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
      this.locationInterval = null;
    }
  }

  acceptJob(job: DeliveryJob): void {
    this.dataService.acceptJob(job.id).subscribe({
      next: () => {
        // Move job to active jobs
        this.availableJobs = this.availableJobs.filter(j => j.id !== job.id);
        job.status = 'accepted';
        this.activeJobs.push(job);
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
        // Remove job from available jobs
        this.availableJobs = this.availableJobs.filter(j => j.id !== job.id);
      },
      error: (err) => {
        console.error('Error rejecting job:', err);
        alert('حدث خطأ أثناء رفض المهمة');
      }
    });
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'available': 'متاح',
      'accepted': 'تم القبول',
      'picked_up': 'تم الاستلام',
      'in_transit': 'قيد التوصيل',
      'out_for_delivery': 'وصلت للمنطقة',
      'delivered': 'تم التسليم',
      'failed': 'فشل',
      'returned': 'مُرتجع'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'available': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-blue-100 text-blue-800',
      'picked_up': 'bg-indigo-100 text-indigo-800',
      'in_transit': 'bg-purple-100 text-purple-800',
      'out_for_delivery': 'bg-cyan-100 text-cyan-800',
      'delivered': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'returned': 'bg-orange-100 text-orange-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }

  getStatIconBg(index: number): string {
    const colors = [
      'from-primary-green to-secondary-teal',
      'from-blue-500 to-blue-600',
      'from-emerald-500 to-emerald-600',
      'from-yellow-500 to-yellow-600'
    ];
    return colors[index % colors.length];
  }

  callSender(phone: string): void {
    window.open(`tel:${phone}`, '_self');
  }

  callReceiver(phone: string): void {
    window.open(`tel:${phone}`, '_self');
  }
}
