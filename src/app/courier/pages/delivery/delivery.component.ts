import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CourierDataService } from '../../services/courier-data.service';
import { DeliveryProofComponent } from './components/delivery-proof.component';
import { FailedDeliveryProofComponent } from './components/failed-delivery-proof.component';



/* ================= UI TYPES (FIX-1) ================= */

type DeliveryUIStatus = 'assigned' | 'out_for_delivery' | 'delivered';

interface DeliveryUIJob {
  id: number;
  status: DeliveryUIStatus;
  awaitingOTP: boolean;
  otp?: string; // Exposed from backend

  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;

  dropoffAddress?: string;
  destinationLat?: number;
  destinationLng?: number;

  customerName?: string;
  customerPhone?: string;
}
/* ================= COMPONENT ================= */

@Component({
  selector: 'app-delivery',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DeliveryProofComponent,
    FailedDeliveryProofComponent

  ],
  templateUrl: './delivery.component.html'
})
export class DeliveryComponent implements OnInit, OnDestroy {

  /* ================= STATE ================= */

  packageId!: number;
  job: DeliveryUIJob | null = null;

  isLoading = true;
  error: string | null = null;

  showProofModal = false;
  showFailedModal = false;
  otpVerified = false;
  isVerifying = false;

  /* ================= INIT ================= */

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courierService: CourierDataService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.packageId = Number(this.route.snapshot.paramMap.get('id'));

    const navState = history.state?.job;

    if (navState) {
      // Job came from My Jobs
      this.job = {
        id: navState.id,
        status: this.normalizeStatus(navState.status),
        awaitingOTP: false,

        pickupAddress: navState.pickupAddress,
        pickupLat: navState.pickupLat,
        pickupLng: navState.pickupLng,

        dropoffAddress: navState.dropoffAddress,
        destinationLat: navState.destinationLat,
        destinationLng: navState.destinationLng,

        customerName: navState.customerName,
        customerPhone: navState.receiverPhone
      };

      this.loadOTPStatusOnly();
    } else {
      // Fallback (direct reload)
      this.loadOTPStatusOnly();
    }
  }


  /* ================= CORE LOGIC ================= */

  loadOTPStatusOnly(): void {
    this.isLoading = true;

    this.courierService.checkOTPStatus(this.packageId).subscribe({
      next: (otpRes: { otpVerified: boolean; status: number | string; otp?: string }) => {

        const normalizedStatus = this.normalizeStatus(otpRes.status);

        if (this.job) {
          this.job.status = normalizedStatus;
          this.job.awaitingOTP =
            !otpRes.otpVerified && normalizedStatus === 'out_for_delivery';
          if (otpRes.otp) this.job.otp = otpRes.otp;
        } else {
          // Direct reload case
          this.job = {
            id: this.packageId,
            status: normalizedStatus,
            awaitingOTP:
              !otpRes.otpVerified && normalizedStatus === 'out_for_delivery',
            otp: otpRes.otp
          };
        }

        this.isLoading = false;
      },
      error: () => {
        this.error = 'تعذر تحميل حالة التوصيل';
        this.isLoading = false;
      }
    });
  }


  /* ================= STATUS NORMALIZER ================= */

  private normalizeStatus(
    status: number | string
  ): DeliveryUIStatus {

    if (typeof status === 'number') {
      switch (status) {
        case 1:
          return 'assigned';
        case 3:
          return 'out_for_delivery';
        case 4:
          return 'delivered';
        default:
          throw new Error(`Unsupported numeric status: ${status}`);
      }
    }

    switch (status) {
      case 'Assigned':
      case 'assigned':
        return 'assigned';

      case 'OutForDelivery':
      case 'out_for_delivery':
        return 'out_for_delivery';

      case 'Delivered':
      case 'delivered':
        return 'delivered';

      default:
        throw new Error(`Unsupported string status: ${status}`);
    }
  }

  /* ================= ACTIONS ================= */

  startDelivery(): void {
    if (!this.job || this.job.status !== 'assigned') return;

    this.courierService.startDelivery(this.packageId).subscribe({
      next: () => {
        this.job!.status = 'out_for_delivery';
      },
      error: () => {
        this.error = 'فشل بدء التوصيل';
      }
    });
  }

  openConfirmDelivery(): void {
    this.showProofModal = true;
  }

  onProofComplete(payload: { otp: string; notes?: string }): void {
    if (!payload?.otp) {
      this.error = 'رمز OTP مطلوب';
      return;
    }

    this.isVerifying = true;
    this.courierService.verifyDeliveryOTP(this.packageId, payload.otp).subscribe({
      next: () => {
        this.courierService.deliverPackage(this.packageId, payload.notes ?? '')
          .subscribe({
            next: () => {
              this.isVerifying = false;
              this.showProofModal = false;
              this.router.navigate(['/courier/dashboard']);
            },
            error: () => {
              this.isVerifying = false;
              this.error = 'فشل إنهاء التوصيل';
            }
          });
      },
      error: () => {
        this.isVerifying = false;
        this.error = 'رمز OTP غير صحيح';
      }
    });
  }

  onProofCancel(): void {
    this.showProofModal = false;
  }

  unableToDeliver(): void {
    this.showFailedModal = true;
  }

  onFailedSubmit(event: { reason: string; notes?: string }): void {
    this.courierService
      .updateJobStatus(this.packageId, 'failed', event.reason, { notes: event.notes })
      .subscribe({
        next: () => {
          this.showFailedModal = false;
          this.router.navigate(['/courier/dashboard']);
        },
        error: () => {
          this.error = 'فشل تحديث الحالة';
        }
      });
  }

  onFailedCancel(): void {
    this.showFailedModal = false;
  }

  /* ================= TEMPLATE HELPERS ================= */

  getStatusClass(status: DeliveryUIStatus): string {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-700';
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  getStatusText(status: DeliveryUIStatus): string {
    const map: Record<DeliveryUIStatus, string> = {
      assigned: 'تم التعيين',
      out_for_delivery: 'جاري التوصيل',
      delivered: 'تم التسليم'
    };
    return map[status];
  }

  navigateToPickup() {
    if (!this.job?.pickupLat || !this.job?.pickupLng) return;

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${this.job.pickupLat},${this.job.pickupLng}`,
      '_blank'
    );
  }

  navigateToDropoff() {
    if (!this.job?.destinationLat || !this.job?.destinationLng) return;

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${this.job.destinationLat},${this.job.destinationLng}`,
      '_blank'
    );
  }

  getMapEmbedUrl(lat?: number, lng?: number): SafeResourceUrl | null {
    if (!lat || !lng) return null;

    const url = `https://www.google.com/maps?q=${lat},${lng}&hl=ar&z=16&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getRouteMapUrl(
    pickupLat?: number,
    pickupLng?: number,
    dropLat?: number,
    dropLng?: number
  ) {
    // 1. Full Route
    if (pickupLat && pickupLng && dropLat && dropLng) {
      const url =
        `https://www.google.com/maps?saddr=${pickupLat},${pickupLng}` +
        `&daddr=${dropLat},${dropLng}` +
        `&hl=ar&z=14&output=embed`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    // 2. Only Pickup (Fallback)
    if (pickupLat && pickupLng) {
      const url = `https://www.google.com/maps?q=${pickupLat},${pickupLng}&hl=ar&z=15&output=embed`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    // 3. Only Dropoff (Fallback)
    if (dropLat && dropLng) {
      const url = `https://www.google.com/maps?q=${dropLat},${dropLng}&hl=ar&z=15&output=embed`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    return null;
  }

  ngOnDestroy(): void {
    this.showProofModal = false;
    this.showFailedModal = false;
  }


}
