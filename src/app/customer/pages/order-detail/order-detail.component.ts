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
import { LynxTalismanComponent } from '../../../shared/components/lynx-talisman/lynx-talisman.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
  showDemoControls = true;

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
  safeMapUrl: SafeResourceUrl | null = null;

  // ---------- OTP ----------
  otp: string | null = null;
  otpInput = '';
  isVerifyingOtp = false;
  otpError = '';

  // ---------- DEMO STATE ----------
  demoPhase = 0;
  isDemoRunning = false;

  constructor(
    private route: ActivatedRoute,
    private dataService: CustomerDataService,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer
  ) { }

  // ================= LIFECYCLE =================

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDelivery(Number(id));
    }
  }

  ngOnDestroy(): void {
    this.locationSubscription?.unsubscribe();
    this.statusSubscription?.unsubscribe();
  }

  // ================= DATA =================

  loadDelivery(id: number): void {
    this.isLoading = true;

    this.dataService.trackPackage(id).subscribe({
      next: (pkg: any) => {
        this.delivery = this.mapBackendPackage(pkg);
        this.deliveryNote = this.delivery.notes ?? '';

        if (this.delivery.deliveryOTP) {
          this.otp = this.delivery.deliveryOTP;
        }

        this.isLoading = false;

        if (this.delivery.status === 'delivered' || (this.delivery.status === 'out_for_delivery' && this.delivery.otpVerified)) {
          this.handleDeliveryComplete();
        }

        if (['picked_up', 'in_transit', 'out_for_delivery'].includes(this.delivery.status)) {
          this.startLocationTracking(String(id));
          if (!this.statusSubscription) {
            this.startStatusPolling(id);
          }
        }
      },
      error: () => {
        // Use mock data for demo
        this.loadMockDelivery(id);
        this.isLoading = false;
      }
    });
  }

  loadMockDelivery(id: number): void {
    this.delivery = {
      id: String(id),
      trackingNumber: `PKG-${id}`,
      description: 'إلكترونيات - أجهزة ذكية',
      senderName: 'متجر التقنية الحديثة',
      senderPhone: '01012345678',
      pickupAddress: 'المنطقة الصناعية، القاهرة',
      deliveryAddress: 'شارع النيل 123، الجيزة',
      status: 'assigned',
      createdAt: new Date(),
      estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000),
      weight: 2.5,
      courierName: 'أحمد محمد',
      courierPhone: '01098765432',
      notes: ''
    };
    this.error = '';
  }

  statusSubscription?: Subscription;

  startStatusPolling(id: number) {
    this.statusSubscription = interval(5000).subscribe(() => {
      this.dataService.trackPackage(id).subscribe((pkg: any) => {
        const newStatus = this.mapStatus(pkg.status);
        const otpVerified = pkg.courier?.otpVerified;

        if (newStatus === 'delivered' || (newStatus === 'out_for_delivery' && otpVerified)) {
          if (this.delivery?.status !== 'delivered') {
            this.handleDeliveryComplete();
            this.delivery!.status = 'delivered';
            this.statusSubscription?.unsubscribe();
          }
        }
      });
    });
  }

  handleDeliveryComplete() {
    this.showRatingModal = true;
    this.notificationService.notifyDeliveryPhase({
      deliveryId: this.delivery?.id || '',
      phase: 'delivered'
    });
  }

  // ================= MAPPING =================

  mapBackendPackage(pkg: any): IncomingDelivery {
    console.log('📦 Raw package data:', pkg);

    return {
      id: String(pkg.id || pkg.Id),
      trackingNumber: `PKG-${pkg.id || pkg.Id}`,
      // Use new backend fields
      description: pkg.description || pkg.Description || '—',
      senderName: pkg.supplierName || pkg.source || pkg.Source || 'غير محدد',
      senderPhone: pkg.senderPhone || '',
      pickupAddress: pkg.source || pkg.Source || pkg.pickupAddress || '—',
      deliveryAddress: pkg.destination || pkg.Destination || pkg.deliveryAddress || '—',
      status: this.mapStatus(pkg.status || pkg.Status),
      createdAt: new Date(pkg.createdAt || pkg.CreatedAt || new Date()),
      estimatedDelivery: pkg.estimatedDelivery ? new Date(pkg.estimatedDelivery) : undefined,
      weight: pkg.weight || pkg.Weight || 0,
      // Courier info - new format has courierName/courierPhone or nested courier
      courierName: pkg.courierName || (pkg.courier ? `${pkg.courier.userName || pkg.courier.name || 'Courier #' + pkg.courier.id}` : undefined),
      courierPhone: pkg.courierPhone || pkg.courier?.phone || pkg.courier?.phoneNumber,
      notes: pkg.notes || pkg.shipmentNotes || pkg.Notes || '',
      // OTP - check multiple locations
      deliveryOTP: pkg.deliveryOTP || pkg.DeliveryOTP || pkg.otp || pkg.courier?.deliveryOTP,
      otpVerified: pkg.otpVerified || pkg.OTPVerified || pkg.courier?.otpVerified || false,
      isFragile: pkg.fragile || pkg.Fragile || false,
      deliveryFee: pkg.shipmentCost || pkg.ShipmentCost || 0
    };
  }

  mapStatus(status: number | string): DeliveryStatus {
    if (typeof status === 'string') {
      // Handle string status from backend
      const statusMap: Record<string, DeliveryStatus> = {
        'pending': 'pending',
        'assigned': 'assigned',
        'outfordelivery': 'out_for_delivery',
        'out_for_delivery': 'out_for_delivery',
        'delivered': 'delivered',
        'failed': 'failed_delivery',
        'cancelled': 'cancelled'
      };
      return statusMap[status.toLowerCase()] || 'pending';
    }

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
        this.updateMapUrl(loc.lat, loc.lng);
      },
      error: () => {
        // Fallback: Show pickup location if carrier location unavailable
        if (!this.carrierLocation) {
          // Mock Cairo location for demo
          this.carrierLocation = {
            courierId: '0',
            lat: 30.0444,
            lng: 31.2357,
            timestamp: new Date()
          };
          this.updateMapUrl(30.0444, 31.2357);
        }
      }
    });
  }

  updateMapUrl(lat: number, lng: number): void {
    this.mapUrl = `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    this.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.mapUrl);
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

  // ================= OTP VERIFICATION =================

  verifyOtp(): void {
    if (!this.otpInput || this.otpInput.length < 4) {
      this.otpError = 'الرجاء إدخال رمز التحقق كاملاً';
      return;
    }

    if (this.otpInput === this.otp) {
      this.isVerifyingOtp = true;
      // Simulate verification
      setTimeout(() => {
        this.isVerifyingOtp = false;
        this.delivery!.status = 'delivered';
        this.handleDeliveryComplete();
      }, 1000);
    } else {
      this.otpError = 'رمز التحقق غير صحيح';
    }
  }

  // ================= DEMO SIMULATION =================

  runFullDemo(): void {
    if (!this.delivery || this.isDemoRunning) return;

    this.isDemoRunning = true;
    this.demoPhase = 1;

    // Phase 1: Accepted
    this.delivery.status = 'assigned';
    this.notificationService.notifyDeliveryPhase({
      deliveryId: this.delivery.id,
      phase: 'accepted'
    });

    // Phase 2: Courier Assigned (3s)
    setTimeout(() => {
      if (!this.delivery) return;
      this.demoPhase = 2;
      this.delivery.courierName = 'أحمد محمد';
      this.notificationService.notifyDeliveryPhase({
        deliveryId: this.delivery.id,
        phase: 'courier_assigned',
        courierName: 'أحمد محمد'
      });
    }, 3000);

    // Phase 3: On the way (6s)
    setTimeout(() => {
      if (!this.delivery) return;
      this.demoPhase = 3;
      this.delivery.status = 'in_transit';
      this.carrierLocation = {
        courierId: '99',
        lat: 30.0500,
        lng: 31.2400,
        timestamp: new Date()
      };
      this.updateMapUrl(30.0500, 31.2400);
      this.notificationService.notifyDeliveryPhase({
        deliveryId: this.delivery.id,
        phase: 'on_the_way',
        eta: '12 دقيقة'
      });
    }, 6000);

    // Phase 4: Nearby (10s)
    setTimeout(() => {
      if (!this.delivery) return;
      this.demoPhase = 4;
      this.carrierLocation = {
        courierId: '99',
        lat: 30.0450,
        lng: 31.2360,
        timestamp: new Date()
      };
      this.updateMapUrl(30.0450, 31.2360);
      this.notificationService.notifyDeliveryPhase({
        deliveryId: this.delivery.id,
        phase: 'nearby'
      });
    }, 10000);

    // Phase 5: Arrived + OTP Required (14s)
    setTimeout(() => {
      if (!this.delivery) return;
      this.demoPhase = 5;
      this.delivery.status = 'out_for_delivery';
      this.otp = '4829';
      this.carrierLocation = {
        courierId: '99',
        lat: 30.0444,
        lng: 31.2357,
        timestamp: new Date()
      };
      this.updateMapUrl(30.0444, 31.2357);
      this.notificationService.notifyDeliveryPhase({
        deliveryId: this.delivery.id,
        phase: 'arrived'
      });
      setTimeout(() => {
        this.notificationService.notifyDeliveryPhase({
          deliveryId: this.delivery!.id,
          phase: 'otp_required'
        });
      }, 1500);
      this.isDemoRunning = false;
    }, 14000);
  }

  simulateSingleStep(step: 'pickup' | 'transit' | 'nearby' | 'arrived'): void {
    if (!this.delivery) return;

    switch (step) {
      case 'pickup':
        this.delivery.status = 'picked_up';
        this.notificationService.notifyDeliveryPhase({
          deliveryId: this.delivery.id,
          phase: 'on_the_way',
          eta: '20 دقيقة'
        });
        break;

      case 'transit':
        this.delivery.status = 'in_transit';
        this.carrierLocation = {
          courierId: '99',
          lat: 30.0500,
          lng: 31.2400,
          timestamp: new Date()
        };
        this.updateMapUrl(30.0500, 31.2400);
        break;

      case 'nearby':
        this.notificationService.notifyDeliveryPhase({
          deliveryId: this.delivery.id,
          phase: 'nearby'
        });
        this.carrierLocation = {
          courierId: '99',
          lat: 30.0450,
          lng: 31.2360,
          timestamp: new Date()
        };
        this.updateMapUrl(30.0450, 31.2360);
        break;

      case 'arrived':
        this.delivery.status = 'out_for_delivery';
        this.otp = '4829';
        this.carrierLocation = {
          courierId: '99',
          lat: 30.0444,
          lng: 31.2357,
          timestamp: new Date()
        };
        this.updateMapUrl(30.0444, 31.2357);
        this.notificationService.notifyDeliveryPhase({
          deliveryId: this.delivery.id,
          phase: 'otp_required'
        });
        break;
    }
  }

  simulateDeliveryComplete(): void {
    if (!this.delivery) return;
    this.delivery.status = 'delivered';
    this.handleDeliveryComplete();
  }
}

