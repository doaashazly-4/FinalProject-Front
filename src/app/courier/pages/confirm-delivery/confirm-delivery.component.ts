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
export class ConfirmDeliveryComponent implements OnInit {
  packageId!: number;
  otp = '';
  otpVerified = false;
  isLoading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private courierService: CourierDataService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.packageId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadOtpStatus();
  }

  loadOtpStatus() {
    this.courierService.checkOTPStatus(this.packageId).subscribe({
      next: res => {
        this.otpVerified = res.otpVerified;
      },
      error: () => {
        this.error = 'تعذر تحميل حالة الشحنة';
      }
    });
  }

  verifyOtp() {
    if (!this.otp) return;

    this.isLoading = true;
    this.error = '';

    this.courierService.verifyDeliveryOTP(this.packageId, this.otp)
      .subscribe({
        next: () => {
          this.otpVerified = true;
          this.isLoading = false;
        },
        error: err => {
          this.error = err.error ?? 'رمز OTP غير صحيح';
          this.isLoading = false;
        }
      });
  }

  completeDelivery() {
    this.isLoading = true;

    this.courierService.deliverPackage(this.packageId, '')
      .subscribe({
        next: () => {
          this.router.navigate(['/courier/dashboard']);
        },
        error: err => {
          this.error = err.error ?? 'فشل تأكيد التسليم';
          this.isLoading = false;
        }
      });
  }
}
