import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CustomerDataService, IncomingDelivery, CarrierLocation } from '../../services/customer-data.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css'
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  delivery: IncomingDelivery | null = null;
  isLoading = true;
  showRatingModal = false;
  showNoteModal = false;
  showTimeChangeModal = false;
  
  // Rating
  rating = 0;
  ratingComment = '';
  
  // Notes
  deliveryNote = '';
  
  // Time Change
  newTime: Date = new Date();
  timeChangeReason = '';
  
  // Real-time tracking
  carrierLocation: CarrierLocation | null = null;
  locationSubscription: Subscription | null = null;
  mapUrl = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: CustomerDataService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDelivery(id);
    }
  }

  ngOnDestroy(): void {
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
    }
  }

  loadDelivery(id: string): void {
    this.isLoading = true;
    this.dataService.getDeliveryById(id).subscribe({
      next: (delivery) => {
        this.delivery = delivery;
        this.deliveryNote = delivery.notes || '';
        this.isLoading = false;
        
        // Start real-time tracking if in transit
        if (['in_transit', 'out_for_delivery', 'picked_up'].includes(delivery.status)) {
          this.startLocationTracking(id);
        }
        
        // Show rating modal if delivered and not rated
        if (delivery.status === 'delivered' && !delivery.deliveryProofImage) {
          // Check if already rated (would need backend check)
          setTimeout(() => {
            this.showRatingModal = true;
          }, 1000);
        }
      },
      error: (err) => {
        console.error('Error loading delivery:', err);
        this.isLoading = false;
      }
    });
  }

  startLocationTracking(deliveryId: string): void {
    // Update location every 5 seconds
    this.updateCarrierLocation(deliveryId);
    this.locationSubscription = interval(5000).subscribe(() => {
      this.updateCarrierLocation(deliveryId);
    });
  }

  updateCarrierLocation(deliveryId: string): void {
    this.dataService.getCarrierLocation(deliveryId).subscribe({
      next: (location) => {
        this.carrierLocation = location;
        // Update map URL
        if (this.delivery) {
          this.mapUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}&z=15`;
        }
      },
      error: (err) => {
        // Mock location for demo
        if (this.delivery) {
          this.carrierLocation = {
            lat: 30.0444 + (Math.random() * 0.01),
            lng: 31.2357 + (Math.random() * 0.01),
            timestamp: new Date(),
            courierId: 'courier-1'
          };
          this.mapUrl = `https://www.google.com/maps?q=${this.carrierLocation.lat},${this.carrierLocation.lng}&z=15`;
        }
      }
    });
  }

  callCarrier(): void {
    if (this.delivery?.courierPhone) {
      // For masked call, would need backend API
      window.open(`tel:${this.delivery.courierPhone}`, '_self');
    }
  }

  callSupplier(): void {
    if (this.delivery?.senderPhone) {
      window.open(`tel:${this.delivery.senderPhone}`, '_self');
    }
  }

  updateDeliveryNote(): void {
    if (!this.delivery || !this.deliveryNote.trim()) return;
    
    this.dataService.updateDeliveryNote(this.delivery.id, this.deliveryNote).subscribe({
      next: () => {
        if (this.delivery) {
          this.delivery.notes = this.deliveryNote;
        }
        this.showNoteModal = false;
        alert('تم تحديث الملاحظات بنجاح');
      },
      error: (err) => {
        console.error('Error updating note:', err);
        alert('حدث خطأ أثناء تحديث الملاحظات');
      }
    });
  }

  requestTimeChange(): void {
    if (!this.delivery) return;
    
    this.dataService.requestTimeChange(this.delivery.id, this.newTime, this.timeChangeReason).subscribe({
      next: () => {
        this.showTimeChangeModal = false;
        alert('تم إرسال طلب تغيير الوقت للمورد');
      },
      error: (err) => {
        console.error('Error requesting time change:', err);
        alert('حدث خطأ أثناء إرسال الطلب');
      }
    });
  }

  markNotAvailableToday(): void {
    if (!this.delivery) return;
    
    if (confirm('هل أنت متأكد أنك غير متاح اليوم؟ سيتم إشعار المورد.')) {
      this.dataService.markNotAvailableToday(this.delivery.id).subscribe({
        next: () => {
          alert('تم إشعار المورد بعدم تواجدك اليوم');
        },
        error: (err) => {
          console.error('Error marking not available:', err);
          alert('حدث خطأ أثناء إرسال الإشعار');
        }
      });
    }
  }

  submitRating(): void {
    if (!this.delivery || this.rating === 0) {
      alert('يرجى اختيار تقييم');
      return;
    }
    
    this.dataService.rateDelivery(this.delivery.id, this.rating, this.ratingComment).subscribe({
      next: () => {
        this.showRatingModal = false;
        alert('شكراً لك على تقييمك!');
        this.rating = 0;
        this.ratingComment = '';
      },
      error: (err) => {
        console.error('Error submitting rating:', err);
        alert('حدث خطأ أثناء إرسال التقييم');
      }
    });
  }

  setRating(rating: number): void {
    this.rating = rating;
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'في الانتظار',
      'assigned': 'تم التعيين',
      'picked_up': 'تم الاستلام من المُرسل',
      'in_transit': 'في الطريق إليك',
      'out_for_delivery': 'المندوب قريب منك',
      'delivered': 'تم التسليم',
      'failed_delivery': 'فشل التسليم',
      'returned': 'تم الإرجاع',
      'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'picked_up': 'bg-indigo-100 text-indigo-800',
      'in_transit': 'bg-purple-100 text-purple-800',
      'out_for_delivery': 'bg-cyan-100 text-cyan-800',
      'delivered': 'bg-green-100 text-green-800',
      'failed_delivery': 'bg-red-100 text-red-800',
      'returned': 'bg-orange-100 text-orange-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

