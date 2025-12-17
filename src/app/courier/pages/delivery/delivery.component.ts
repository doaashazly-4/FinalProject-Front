import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourierDataService, DeliveryJob } from '../../services/courier-data.service';
import { DeliveryProofComponent } from './components/delivery-proof.component';
import { FailedDeliveryProofComponent } from './components/failed-delivery-proof.component';

@Component({
  selector: 'app-delivery',
  standalone: true,
  imports: [CommonModule, DeliveryProofComponent, FailedDeliveryProofComponent],
  templateUrl: './delivery.component.html',
  styleUrl: './delivery.component.css'
})
export class DeliveryComponent implements OnInit {
  job: DeliveryJob | null = null;
  isLoading = true;
  showProofModal = false;
  showFailedModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: CourierDataService
  ) {}

  ngOnInit(): void {
    const jobId = this.route.snapshot.paramMap.get('id');
    if (jobId) {
      this.loadJob(+jobId);
    }
  }

  loadJob(id: number): void {
    this.isLoading = true;
    this.dataService.getJobById(id.toString()).subscribe({
      next: (job) => {
        this.job = job;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading job:', err);
        this.isLoading = false;
      }
    });
  }

  navigateToPickup(): void {
    // Open Google Maps or offline map
    if (this.job) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${this.job.pickupLocation.lat},${this.job.pickupLocation.lng}`;
      window.open(url, '_blank');
    }
  }

  navigateToDropoff(): void {
    if (this.job) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${this.job.dropoffLocation.lat},${this.job.dropoffLocation.lng}`;
      window.open(url, '_blank');
    }
  }

  markPickedUp(): void {
    if (this.job) {
      // Record pickup location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pickupData = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: new Date()
            };
            this.dataService.updateJobStatus(this.job!.id, 'picked_up', undefined, pickupData).subscribe({
              next: () => {
                this.job!.status = 'picked_up';
                this.job!.pickedUpAt = new Date();
              },
              error: (err) => console.error('Error updating status:', err)
            });
          },
          (error) => {
            // Continue without location if permission denied
            this.dataService.updateJobStatus(this.job!.id, 'picked_up').subscribe({
              next: () => {
                this.job!.status = 'picked_up';
                this.job!.pickedUpAt = new Date();
              },
              error: (err) => console.error('Error updating status:', err)
            });
          }
        );
      } else {
        this.dataService.updateJobStatus(this.job.id, 'picked_up').subscribe({
          next: () => {
            this.job!.status = 'picked_up';
            this.job!.pickedUpAt = new Date();
          },
          error: (err) => console.error('Error updating status:', err)
        });
      }
    }
  }

  markOutForDelivery(): void {
    if (this.job) {
      this.dataService.updateJobStatus(this.job.id, 'out_for_delivery').subscribe({
        next: () => {
          this.job!.status = 'out_for_delivery';
        },
        error: (err) => console.error('Error updating status:', err)
      });
    }
  }

  callSender(phone: string): void {
    window.open(`tel:${phone}`, '_self');
  }

  callReceiver(phone: string): void {
    window.open(`tel:${phone}`, '_self');
  }

  callCustomer(): void {
    // Big call customer button - uses masked call or direct call
    if (this.job) {
      // For direct call, use receiver phone
      // For masked call, would need backend API
      window.open(`tel:${this.job.receiverPhone}`, '_self');
    }
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

  completeDelivery(): void {
    this.showProofModal = true;
  }

  onProofComplete(proof: any): void {
    if (this.job) {
      this.dataService.completeJob(this.job.id, proof).subscribe({
        next: () => {
          this.job!.status = 'delivered';
          this.showProofModal = false;
          this.router.navigate(['/courier/my-jobs']);
        },
        error: (err) => {
          console.error('Error completing job:', err);
          alert('حدث خطأ أثناء إتمام المهمة');
        }
      });
    }
  }

  onProofCancel(): void {
    this.showProofModal = false;
  }

  unableToDeliver(reason: string): void {
    // Store the reason and show modal
    this.showFailedModal = true;
    // The modal component will handle the reason selection
  }

  onFailedSubmit(failureData: {reason: string, photos: string[], notes: string}): void {
    if (this.job) {
      this.dataService.updateJobStatus(this.job.id, 'failed', failureData.reason, failureData).subscribe({
        next: () => {
          this.job!.status = 'failed';
          this.showFailedModal = false;
          this.router.navigate(['/courier/my-jobs']);
        },
        error: (err) => {
          console.error('Error updating status:', err);
          alert('حدث خطأ أثناء تحديث حالة المهمة');
        }
      });
    }
  }

  onFailedCancel(): void {
    this.showFailedModal = false;
  }
}