import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourierDataService } from '../../services/courier-data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-confirm-delivery',
  imports: [CommonModule, FormsModule],
  templateUrl: './confirm-delivery.component.html'
})
export class ConfirmDeliveryComponent {
  packageId!: number;
  otp = '';
  isLoading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private courierService: CourierDataService,
    private router: Router
  ) {
    this.packageId = Number(this.route.snapshot.paramMap.get('packageId'));
  }

  confirmDelivery() {
    if (this.otp.length !== 6) {
      this.error = 'OTP غير صحيح';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.courierService.verifyDeliveryOTP(this.packageId, this.otp).subscribe({
      next: () => {
        this.router.navigate(['/courier/dashboard']);
      },
      error: () => {
        this.isLoading = false;
        this.error = 'OTP غير صحيح أو منتهي';
      }
    });
  }
}
