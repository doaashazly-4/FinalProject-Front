import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CustomerDataService, IncomingDelivery, DeliveryStatus } from '../../services/customer-data.service';

@Component({
  selector: 'app-deliveries',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './deliveries.component.html',
  styleUrls: ['./deliveries.component.css']
})
export class DeliveriesComponent implements OnInit {
  deliveries: IncomingDelivery[] = [];
  phoneNumber = '01012345678'; // TODO: replace later with real source

  filteredDeliveries: IncomingDelivery[] = [];
  filter: DeliveryStatus | 'all' | 'active' = 'all';
  searchTerm = '';
  isLoading = true;

  statusFilters: { value: DeliveryStatus | 'all' | 'active'; label: string; count?: number }[] = [
    { value: 'all', label: 'الكل' },
    { value: 'active', label: 'النشطة' },
    { value: 'out_for_delivery', label: 'قريبة' },
    { value: 'in_transit', label: 'في الطريق' },
    { value: 'delivered', label: 'تم التسليم' }
  ];

  constructor(private dataService: CustomerDataService) { }
  constructor(private dataService: CustomerDataService) { }

  ngOnInit(): void {
    this.loadDeliveries();
  }

  loadDeliveries(): void {
    this.isLoading = true;

    this.dataService.getMyOrders(this.phoneNumber).subscribe({
      next: (packages) => {
        this.deliveries = packages.map(pkg => this.mapBackendPackage(pkg));

    this.dataService.getMyOrders(this.phoneNumber).subscribe({
      next: (packages) => {
        this.deliveries = packages.map(pkg => this.mapBackendPackage(pkg));
        this.updateFilterCounts();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading deliveries:', err);
        this.deliveries = [];
        this.filteredDeliveries = [];
        this.isLoading = false;
      }
    });
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


  mapBackendPackage(pkg: any): IncomingDelivery {
    return {
      id: String(pkg.id),
      trackingNumber: `PKG-${pkg.id}`, // temporary display
      description: pkg.description ?? '—',
      senderName: 'غير محدد',
      senderPhone: undefined,
      pickupAddress: '—',
      deliveryAddress: '—',
      status: this.mapStatus(pkg.status),
      createdAt: new Date(),
      weight: pkg.weight ?? 0,
      courierName: pkg.courier ? `Courier #${pkg.courier.id}` : undefined,
      courierPhone: undefined,
      isFragile: pkg.fragile ?? false,
      requiresSignature: false
    };
  }



  updateFilterCounts(): void {
    this.statusFilters.forEach(filter => {
      if (filter.value === 'all') {
        filter.count = this.deliveries.length;
      } else if (filter.value === 'active') {
        filter.count = this.deliveries.filter(d =>
        filter.count = this.deliveries.filter(d =>
          !['delivered', 'cancelled', 'returned'].includes(d.status)
        ).length;
      } else {
        filter.count = this.deliveries.filter(d => d.status === filter.value).length;
      }
    });
  }

  applyFilters(): void {
    this.filteredDeliveries = this.deliveries.filter(delivery => {
      let matchesStatus = false;
      if (this.filter === 'all') {
        matchesStatus = true;
      } else if (this.filter === 'active') {
        matchesStatus = !['delivered', 'cancelled', 'returned'].includes(delivery.status);
      } else {
        matchesStatus = delivery.status === this.filter;
      }


      const matchesSearch = this.searchTerm === '' ||
        delivery.trackingNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        delivery.senderName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        delivery.description.toLowerCase().includes(this.searchTerm.toLowerCase());


      return matchesStatus && matchesSearch;
    });
  }

  setFilter(status: DeliveryStatus | 'all' | 'active'): void {
    this.filter = status;
    this.applyFilters();
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'في الانتظار',
      'assigned': 'تم التعيين',
      'picked_up': 'تم الاستلام من المُرسل',
      'in_transit': 'في الطريق إليك',
      'out_for_delivery': 'المندوب قريب منك',
      'delivered': 'تم التسليم',
      'failed_delivery': 'فشل التسليم',
      'returned': 'تم الإرجاع',
      'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'assigned': 'bg-blue-100 text-blue-800 border-blue-200',
      'picked_up': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'in_transit': 'bg-purple-100 text-purple-800 border-purple-200',
      'out_for_delivery': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'delivered': 'bg-green-100 text-green-800 border-green-200',
      'failed_delivery': 'bg-red-100 text-red-800 border-red-200',
      'returned': 'bg-orange-100 text-orange-800 border-orange-200',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  callCourier(phone: string | undefined): void {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  }

  callSender(phone: string | undefined): void {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  }
}

