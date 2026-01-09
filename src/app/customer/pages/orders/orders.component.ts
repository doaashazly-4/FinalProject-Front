import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerDataService, CustomerOrder } from '../../services/customer-data.service';

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class CustomerOrdersComponent implements OnInit {
  orders: CustomerOrder[] = [];
  filter = 'الكل';
  isLoading = true;

  constructor(private data: CustomerDataService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.data.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.orders = [];
        this.isLoading = false;
      }
    });
  }

  filteredOrders(): CustomerOrder[] {
    if (this.filter === 'الكل') return this.orders;
    return this.orders.filter(o => o.status === this.filter);
  }
}
