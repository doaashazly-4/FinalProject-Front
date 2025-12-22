import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  CustomerDataService,
  IncomingDelivery
} from '../../services/customer-data.service';

@Component({
  standalone: true,
  selector: 'app-delivery-confirmation',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule        // ✅ required for ngModel
  ],
  templateUrl: './delivery-confirmation.component.html'
})
export class DeliveryConfirmationComponent implements OnInit {

  delivery?: IncomingDelivery;
  packageId!: number;

  otp = '';
  isLoading = true;
  submitting = false;
  errorMessage = '';
  success = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerDataService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('packageId');
    if (!id) {
      this.isLoading = false;
      return;
    }

    this.packageId = Number(id);

    // Load delivery info
    this.customerService.getDeliveryById(id).subscribe({
      next: (delivery) => {
        this.delivery = delivery;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'لم يتم العثور على الشحنة';
        this.isLoading = false;
      }
    });
  }

  submitOTP(): void {
    if (this.otp.length !== 6 || this.submitting) {
      this.errorMessage = 'يرجى إدخال رمز OTP صحيح';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    this.customerService.confirmDeliveryOTP(this.packageId, this.otp).subscribe({
      next: () => {
        this.success = true;
        this.submitting = false;

        // Redirect after success
        setTimeout(() => {
          this.router.navigate(['/customer/deliveries']);
        }, 2000);
      },
      error: () => {
        this.errorMessage = 'رمز OTP غير صحيح';
        this.submitting = false;
      }
    });
  }
}
