import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  CustomerDataService,
  IncomingDelivery,
  CarrierLocation,
  DeliveryStatus
} from '../../services/customer-data.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Subscription, interval } from 'rxjs';
import { LynxTalismanComponent } from '../../../shared/components/lynx-talisman/lynx-talisman.component'; // AI Dispatcher UI

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LynxTalismanComponent],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit, OnDestroy {

  // ---------- CORE ----------
  delivery: IncomingDelivery | null = null;
  isLoading = true;
  error = '';

  // ---------- UI STATE ----------
  showRatingModal = false;
  showNoteModal = false;
  showTimeChangeModal = false;

  // ---------- RATING ----------
  rating = 0;
  ratingComment = '';

  // ---------- NOTES ----------
  deliveryNote = '';

  // ---------- TIME CHANGE ----------
  newTime: Date = new Date();
  timeChangeReason = '';

  // ---------- TRACKING ----------
  carrierLocation: CarrierLocation | null = null;
  locationSubscription?: Subscription;
  mapUrl = '';

  constructor(
    private route: ActivatedRoute,
    private dataService: CustomerDataService,
    private notificationService: NotificationService // Injected
  ) { }

  // ================= LIFECYCLE =================

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDelivery(Number(id));
      this.loadOTP();

    }
  }

  ngOnDestroy(): void {
    this.locationSubscription?.unsubscribe();
  }

  // ================= DATA =================

  loadDelivery(id: number): void {
    this.isLoading = true;

    this.dataService.trackPackage(id).subscribe({
      next: (pkg: any) => {
        this.delivery = this.mapBackendPackage(pkg);
        this.deliveryNote = this.delivery.notes ?? '';

        // Extract OTP if present from backend
        if (this.delivery.deliveryOTP) {
          this.otp = this.delivery.deliveryOTP;
        }

        this.isLoading = false;

        if (
          ['picked_up', 'in_transit', 'out_for_delivery'].includes(this.delivery.status)
        ) {
          this.startLocationTracking(String(id));
        }

        if (this.delivery.status === 'delivered') {
          this.showRatingModal = true;
        }
      },
      error: () => {
        this.error = 'لم يتم العثور على الشحنة';
        this.isLoading = false;
      }
    });
  }

  // ================= MAPPING =================

  mapBackendPackage(pkg: any): IncomingDelivery {
    return {
      id: String(pkg.id),
      trackingNumber: `PKG-${pkg.id}`,
      description: pkg.description ?? '—',
      senderName: 'غير محدد',
      senderPhone: undefined,
      pickupAddress: '—',
      deliveryAddress: '—',
      status: this.mapStatus(pkg.status),
      createdAt: new Date(),
      estimatedDelivery: undefined,
      weight: pkg.weight ?? 0,
      courierName: pkg.courier ? `Courier #${pkg.courier.id}` : undefined,
      courierPhone: undefined,
      notes: pkg.shipmentNotes ?? '',
      deliveryOTP: pkg.courier?.deliveryOTP
    };
  }

  mapStatus(status: number | string): DeliveryStatus {
    if (typeof status === 'string') return status as DeliveryStatus;

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

  // ================= STATUS UI =================

  getStatusText(status: DeliveryStatus): string {
    const map: Record<DeliveryStatus, string> = {
      pending: 'في الانتظار',
      assigned: 'تم التعيين',
      picked_up: 'تم الاستلام من المُرسل',
      in_transit: 'في الطريق إليك',
      out_for_delivery: 'المندوب قريب منك',
      delivered: 'تم التسليم',
      failed_delivery: 'فشل التسليم',
      returned: 'تم الإرجاع',
      cancelled: 'ملغي'
    };
    return map[status];
  }

  getStatusClass(status: DeliveryStatus): string {
    const map: Record<DeliveryStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-indigo-100 text-indigo-800',
      in_transit: 'bg-purple-100 text-purple-800',
      out_for_delivery: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-green-100 text-green-800',
      failed_delivery: 'bg-red-100 text-red-800',
      returned: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return map[status];
  }

  formatDate(date?: Date | string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ================= TRACKING =================

  startLocationTracking(deliveryId: string): void {
    this.updateCarrierLocation(deliveryId);
    this.locationSubscription = interval(5000).subscribe(() => {
      this.updateCarrierLocation(deliveryId);
    });
  }

  updateCarrierLocation(deliveryId: string): void {
    this.dataService.getCarrierLocation(deliveryId).subscribe({
      next: (loc) => {
        this.carrierLocation = loc;
        this.mapUrl = `https://www.google.com/maps?q=${loc.lat},${loc.lng}&z=15`;
      }
    });
  }

  // ================= ACTIONS =================

  callCarrier(): void {
    if (this.delivery?.courierPhone) {
      window.open(`tel:${this.delivery.courierPhone}`, '_self');
    }
  }

  callSupplier(): void {
    if (this.delivery?.senderPhone) {
      window.open(`tel:${this.delivery.senderPhone}`, '_self');
    }
  }

  updateDeliveryNote(): void {
    if (!this.delivery) return;

    this.dataService.updateDeliveryNote(this.delivery.id, this.deliveryNote).subscribe(() => {
      this.showNoteModal = false;
    });
  }

  requestTimeChange(): void {
    if (!this.delivery) return;

    this.dataService.requestTimeChange(
      this.delivery.id,
      this.newTime,
      this.timeChangeReason
    ).subscribe(() => {
      this.showTimeChangeModal = false;
    });
  }

  markNotAvailableToday(): void {
    if (!this.delivery) return;

    this.dataService.markNotAvailableToday(this.delivery.id).subscribe();
  }

  submitRating(): void {
    if (!this.delivery || this.rating === 0) return;

    this.dataService.rateDelivery(
      this.delivery.id,
      this.rating,
      this.ratingComment
    ).subscribe(() => {
      this.showRatingModal = false;
    });
  }

  setRating(value: number): void {
    this.rating = value;
  }

  otp: string | null = null;

  loadOTP() {
    // If mocking, return a fake OTP
    if (this.delivery?.status === 'out_for_delivery' && !this.otp) {
      this.otp = '8921'; // Mock OTP
    }

    if (!this.delivery || this.delivery.status !== 'out_for_delivery') return;

    this.dataService.getPackageOTP(Number(this.delivery.id)).subscribe({
      next: res => {
        if (!res.verified) {
          this.otp = res.otp;
        }
      }
    });
  }

  // ================= DEMO / SIMULATION =================

  simulateCourierArrival(): void {
    if (!this.delivery) return;

    this.isLoading = true;
    setTimeout(() => {
      this.delivery!.status = 'out_for_delivery';
      this.isLoading = false;
      this.otp = '4492'; // Demo OTP

      // Trigger Notification
      this.notificationService.showNotification({
        title: 'المندوب وصل! 🚴',
        message: 'المندوب بالخارج الآن. يرجى إعطاءه رمز التسليم: ' + this.otp,
        type: 'success',
        sound: 'assets/sounds/notification.mp3'
      });

      // Mock Location near user
      // Mock Location near user
      this.carrierLocation = {
        courierId: '99',
        lat: 30.0444, // Cairo example
        lng: 31.2357,
        timestamp: new Date()
      };
      this.mapUrl = `https://www.google.com/maps?q=${this.carrierLocation.lat},${this.carrierLocation.lng}&z=15`;
    }, 1500);
  }

  simulateDeliveryComplete(): void {
    if (!this.delivery) return;
    this.delivery.status = 'delivered';
    this.showRatingModal = true;
    this.notificationService.showNotification({
      title: 'تم التسليم ✅',
      message: 'شكراً لاستخدامك Lynx. نتمنى لك يوماً سعيداً!',
      type: 'success'
    });
  }

}
