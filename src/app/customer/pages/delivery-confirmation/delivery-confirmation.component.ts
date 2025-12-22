import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CustomerDataService, IncomingDelivery } from '../../services/customer-data.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-delivery-confirmation',
  imports: [CommonModule, RouterModule],
  templateUrl: './delivery-confirmation.component.html'
})
export class DeliveryConfirmationComponent implements OnInit {
  delivery?: IncomingDelivery;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private customerService: CustomerDataService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('packageId');
    if (!id) return;

    this.customerService.getDeliveryById(id).subscribe({
      next: d => {
        this.delivery = d;
        this.isLoading = false;
      }
    });
  }
}
