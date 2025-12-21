import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CustomerDataService, IncomingDelivery, DeliveryStatus, CarrierLocation } from '../../services/customer-data.service';
import { Subscription, interval } from 'rxjs';

interface StatusStep {
  status: DeliveryStatus;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-customer-track',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './track.component.html',
  styleUrls: ['./track.component.css']
})
export class CustomerTrackComponent implements OnInit, OnDestroy {
  trackingNumber = '';
  selectedDelivery: IncomingDelivery | null = null;
  isLoading = false;
  searchPerformed = false;
  error = '';
  carrierLocation: CarrierLocation | null = null;
  locationSubscription: Subscription | null = null;
  mapUrl = '';

  statusSteps: StatusStep[] = [
    { status: 'pending', label: 'تم الطلب', icon: 'bi-clock', description: 'المُرسل أنشأ الشحنة' },
    { status: 'assigned', label: 'تم التعيين', icon: 'bi-person-check', description: 'تم تعيين مندوب' },
    { status: 'picked_up', label: 'تم الاستلام', icon: 'bi-box-arrow-up', description: 'المندوب استلم الشحنة' },
    { status: 'in_transit', label: 'في الطريق', icon: 'bi-truck', description: 'الشحنة في الطريق إليك' },
    { status: 'out_for_delivery', label: 'قريب منك', icon: 'bi-geo-alt', description: 'المندوب في منطقتك' },
    { status: 'delivered', label: 'تم التسليم', icon: 'bi-check-circle', description: 'استلمت الشحنة بنجاح' }
  ];

  constructor(
    private dataService: CustomerDataService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.loadDeliveryById(params['id']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
    }
  }

  // search(): void {
  //   if (!this.trackingNumber.trim()) {
  //     this.error = 'الرجاء إدخال رقم التتبع';
  //     return;
  //   }

  //   this.isLoading = true;
  //   this.error = '';
  //   this.searchPerformed = true;

  //   this.dataService.trackDelivery(this.trackingNumber).subscribe({
  //     next: (delivery) => {
  //       this.selectedDelivery = delivery;
  //       this.isLoading = false;
  //       this.startLocationTracking(delivery.id);
  //     },
  //     error: () => {
  //       this.loadFromMock();
  //     }
  //   });
  // }

  search() {
  this.searchPerformed = true;
  this.error = '';
  this.selectedDelivery = null;

  if (!this.trackingNumber) {
    this.error = 'من فضلك أدخل رقم التتبع';
    return;
  }

  // ⚠️ Backend expects packageId (number)
  const packageId = Number(this.trackingNumber);

  if (isNaN(packageId)) {
    this.error = 'رقم التتبع غير صالح حالياً (يجب أن يكون رقم)';
    return;
  }

  this.isLoading = true;

  this.dataService.trackPackage(packageId).subscribe({
    next: (data) => {
      this.selectedDelivery = data;
      this.isLoading = false;
    },
    error: () => {
      this.error = 'لم يتم العثور على الشحنة';
      this.isLoading = false;
    }
  });
}
  
  mapBackendPackage(pkg: any) {
  return {
    id: pkg.id,
    trackingNumber: `PKG-${pkg.id}`, // temporary
    description: 'شحنة قيد التتبع',
    senderName: 'غير محدد',
    pickupAddress: '',
    deliveryAddress: '',
    status: this.mapStatus(pkg.status),
    createdAt: new Date(),
    weight: 0,
    courierName: pkg.courier ? `Courier #${pkg.courier.id}` : null,
    courierPhone: null,
    isFragile: false,
    requiresSignature: false
  };
}

mapStatus(status: number | string): any {
  // adapt if enum is numeric
  switch (status) {
    case 0: return 'pending';
    case 1: return 'assigned';
    case 2: return 'picked_up';
    case 3: return 'in_transit';
    case 4: return 'out_for_delivery';
    case 5: return 'delivered';
    default: return 'pending';
  }
}

  loadDeliveryById(id: string): void {
    this.isLoading = true;
    this.searchPerformed = true;

    this.dataService.getDeliveryById(id).subscribe({
      next: (delivery) => {
        this.selectedDelivery = delivery;
        this.trackingNumber = delivery.trackingNumber;
        this.isLoading = false;
        this.startLocationTracking(delivery.id);
      },
      error: () => {
        this.loadFromMock();
      }
    });
  }

  private loadFromMock(): void {
    this.dataService.getDeliveries().subscribe({
      next: (deliveries) => {
        const found = deliveries.find(d => 
          d.trackingNumber.toLowerCase() === this.trackingNumber.toLowerCase() ||
          d.id === this.trackingNumber
        );
        if (found) {
          this.selectedDelivery = found;
          this.trackingNumber = found.trackingNumber;
          this.startLocationTracking(found.id);
        } else if (deliveries.length > 0) {
          this.selectedDelivery = deliveries[0];
          this.trackingNumber = deliveries[0].trackingNumber;
          this.startLocationTracking(deliveries[0].id);
        } else {
          this.error = 'لم يتم العثور على الشحنة';
        }
        this.isLoading = false;
      },
      error: () => {
        this.error = 'حدث خطأ أثناء البحث';
        this.isLoading = false;
      }
    });
  }

  getStatusProgress(): number {
    if (!this.selectedDelivery) return 0;
    if (['cancelled', 'failed_delivery', 'returned'].includes(this.selectedDelivery.status)) return 0;
    
    const currentIndex = this.statusSteps.findIndex(s => s.status === this.selectedDelivery!.status);
    return ((currentIndex + 1) / this.statusSteps.length) * 100;
  }

  isStepCompleted(step: StatusStep): boolean {
    if (!this.selectedDelivery) return false;
    const currentIndex = this.statusSteps.findIndex(s => s.status === this.selectedDelivery!.status);
    const stepIndex = this.statusSteps.findIndex(s => s.status === step.status);
    return stepIndex <= currentIndex;
  }

  isStepCurrent(step: StatusStep): boolean {
    return this.selectedDelivery?.status === step.status;
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

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'في الانتظار',
      'assigned': 'تم التعيين',
      'picked_up': 'تم الاستلام',
      'in_transit': 'في الطريق إليك',
      'out_for_delivery': 'المندوب قريب منك',
      'delivered': 'تم التسليم',
      'failed_delivery': 'فشل التسليم',
      'returned': 'تم الإرجاع',
      'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  callCourier(): void {
    if (this.selectedDelivery?.courierPhone) {
      window.open(`tel:${this.selectedDelivery.courierPhone}`, '_self');
    }
  }

  callSender(): void {
    if (this.selectedDelivery?.senderPhone) {
      window.open(`tel:${this.selectedDelivery.senderPhone}`, '_self');
    }
  }

  startLocationTracking(deliveryId: string): void {
    // Only track if in transit
    if (!this.selectedDelivery || !['in_transit', 'out_for_delivery', 'picked_up'].includes(this.selectedDelivery.status)) {
      return;
    }

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
        this.mapUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}&z=15`;
      },
      error: (err) => {
        // Mock location for demo
        if (this.selectedDelivery) {
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
}

