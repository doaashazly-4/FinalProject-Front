import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourierDataService } from '../../services/courier-data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-confirm-delivery',
  imports: [CommonModule, FormsModule],
  templateUrl: './confirm-delivery.component.html'
})
export class ConfirmDeliveryComponent implements OnInit, OnDestroy {

  packageId!: number;
  otp = '';
  isLoading = false;
  error = '';

  status: 'waiting' | 'confirmed' = 'waiting';

  private pollingSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private courierService: CourierDataService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('packageId');

    if (!id) {
      this.error = 'رقم الشحنة غير صالح';
      return;
    }

    this.packageId = Number(id);

    if (isNaN(this.packageId)) {
      this.error = 'رقم الشحنة غير صالح';
      return;
    }

    this.startPolling();
  }

  ngOnDestroy(): void {
    this.pollingSub?.unsubscribe();
  }

  // ==============================
  // OTP STATUS POLLING
  // ==============================

  startPolling(): void {
    this.pollingSub = interval(5000).subscribe(() => {
      this.checkOTPStatus();
    });
  }

  checkOTPStatus(): void {
    this.courierService.checkOTPStatus(this.packageId).subscribe({
      next: (res: { otpVerified: boolean }) => {
        if (res.otpVerified) {
          this.status = 'confirmed';
          this.pollingSub?.unsubscribe(); // stop polling once confirmed
        }
      },
      error: () => {
        // silent fail — polling should not break UX
      }
    });
  }

  // ==============================
  // CONFIRM DELIVERY
  // ==============================

  confirmDelivery() {
    if (this.otp.length !== 6) {
      this.error = 'OTP غير صحيح';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.courierService.verifyDeliveryOTP(this.packageId, this.otp).subscribe({
      next: () => {
        this.status = 'confirmed'; // 🔓 UNLOCK PROOF UI
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.error = 'OTP غير صحيح أو منتهي';
      }
    });
  }

}
