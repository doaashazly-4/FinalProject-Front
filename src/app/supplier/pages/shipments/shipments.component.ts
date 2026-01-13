import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { SupplierDataService, Parcel, ParcelStatus, AvailableCarrier } from '../../services/supplier-data.service';
import { ChatService } from '../../../shared/services/chat.service';

import { ShipmentCardComponent } from '../../components/shipment-card/shipment-card.component';

@Component({
  selector: 'app-shipments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ShipmentCardComponent],
  templateUrl: './shipments.component.html',
  styleUrl: './shipments.component.css'
})
export class ShipmentsComponent implements OnInit {
  parcels: Parcel[] = [];
  filteredParcels: Parcel[] = [];
  availableCarriers: AvailableCarrier[] = [];

  isLoading = true;
  isLoadingCarriers = false;

  // Filters
  searchQuery = '';
  selectedStatus: ParcelStatus | 'all' = 'all';

  // Assign Carrier Modal
  showAssignModal = false;
  selectedParcel: Parcel | null = null;
  selectedCarrier: AvailableCarrier | null = null;
  isAssigning = false;

  // Order Details Modal
  showDetailsModal = false;
  detailsParcel: Parcel | null = null;

  // Ready for Pickup
  markingReady: string | null = null;
  pendingAssignId: string | null = null;

  statusFilters: { value: ParcelStatus | 'all'; label: string; count?: number }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'ready_for_pickup', label: 'Ready for Pickup' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'picked_up', label: 'Picked Up' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'failed_delivery', label: 'Failed' }
  ];

  constructor(
    private dataService: SupplierDataService,
    private route: ActivatedRoute,
    private chatService: ChatService
  ) { }

  ngOnInit(): void {
    this.loadParcels();

    // Check for assign query param
    this.route.queryParams.subscribe(params => {
      if (params['assign']) {
        this.pendingAssignId = params['assign'];
        if (this.parcels.length > 0) {
          this.openAssignModalById(this.pendingAssignId!);
        }
      }
    });
  }

  loadParcels(): void {
    this.isLoading = true;

    this.dataService.getParcels().subscribe({
      next: (parcels) => {
        this.parcels = parcels;
        this.applyFilters();
        this.updateStatusCounts();

        if (this.pendingAssignId) {
          this.openAssignModalById(this.pendingAssignId);
          this.pendingAssignId = null; // Clear it
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading parcels:', err);
        this.isLoading = false;
      }
    });
  }

  updateStatusCounts(): void {
    this.statusFilters.forEach(filter => {
      if (filter.value === 'all') {
        filter.count = this.parcels.length;
      } else {
        filter.count = this.parcels.filter(p => p.status === filter.value).length;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.parcels];

    // Filter by status
    if (this.selectedStatus !== 'all') {
      result = result.filter(p => p.status === this.selectedStatus);
    }

    // Filter by search
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.trackingNumber.toLowerCase().includes(query) ||
        p.receiverName.toLowerCase().includes(query) ||
        p.receiverPhone.includes(query) ||
        p.deliveryAddress.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    this.filteredParcels = result;
  }

  onStatusChange(status: ParcelStatus | 'all'): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  // UC-SUP-06: Mark Ready for Pickup
  markReadyForPickup(parcel: Parcel): void {
    this.markingReady = parcel.id;

    this.dataService.markReadyForPickup(parcel.id).subscribe({
      next: (updated) => {
        parcel.status = 'ready_for_pickup';
        parcel.isReadyForPickup = true;
        this.updateStatusCounts();
        this.markingReady = null;
      },
      error: (err) => {
        console.error('Error marking ready:', err);
        this.markingReady = null;
      }
    });
  }

  // UC-SUP-03: Assign Carrier
  openAssignModal(parcel: Parcel): void {
    this.selectedParcel = parcel;
    this.selectedCarrier = null;
    this.showAssignModal = true;
    this.loadAvailableCarriers(parcel.id);
  }

  openAssignModalById(parcelId: string): void {
    const parcel = this.parcels.find(p => p.id === parcelId);
    if (parcel) {
      this.openAssignModal(parcel);
    }
  }

  loadAvailableCarriers(orderId: string): void {
    this.isLoadingCarriers = true;

    this.dataService.getAvailableCarriers(orderId).subscribe({
      next: (carriers) => {
        this.availableCarriers = carriers;
        this.isLoadingCarriers = false;
      },
      error: (err) => {
        console.error('Error loading carriers:', err);
        this.isLoadingCarriers = false;
      }
    });
  }

  selectCarrier(carrier: AvailableCarrier): void {
    this.selectedCarrier = carrier;
  }

  assignCarrier(): void {
    if (!this.selectedParcel || !this.selectedCarrier) return;

    this.isAssigning = true;

    this.dataService.assignCarrier({
      orderId: this.selectedParcel.id,
      carrierId: this.selectedCarrier.id
    }).subscribe({
      next: (updated) => {
        // Update parcel in list
        const index = this.parcels.findIndex(p => p.id === this.selectedParcel!.id);
        if (index !== -1) {
          this.parcels[index] = updated;
        }

        this.updateStatusCounts();
        this.applyFilters();
        this.closeAssignModal();
        this.isAssigning = false;
      },
      error: (err) => {
        console.error('Error assigning carrier:', err);
        this.isAssigning = false;
      }
    });
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedParcel = null;
    this.selectedCarrier = null;
    this.availableCarriers = [];
  }

  // Order Details
  openDetailsModal(parcel: Parcel): void {
    this.detailsParcel = parcel;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.detailsParcel = null;
  }

  // Cancel Order
  cancelOrder(parcel: Parcel): void {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    this.dataService.cancelParcel(parcel.id).subscribe({
      next: () => {
        parcel.status = 'cancelled';
        this.updateStatusCounts();
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error cancelling order:', err);
      }
    });
  }

  // Helpers
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'ready_for_pickup': 'Ready for Pickup',
      'assigned': 'Assigned',
      'picked_up': 'Picked Up',
      'in_transit': 'In Transit',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'failed_delivery': 'Failed',
      'returned': 'Returned',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    return 'bg-slate-100 text-slate-800 border-slate-200';
  }

  getVehicleIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'Motorcycle': 'bi-bicycle',
      'Car': 'bi-car-front',
      'Van': 'bi-truck',
      'Truck': 'bi-truck'
    };
    return icons[type] || 'bi-truck';
  }

  getVehicleText(type: string): string {
    const texts: { [key: string]: string } = {
      'Motorcycle': 'Motorcycle',
      'Car': 'Car',
      'Van': 'Van',
      'Truck': 'Truck'
    };
    return texts[type] || type;
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'EGP' });
  }

  canAssignCarrier(parcel: Parcel): boolean {
    return parcel.status === 'ready_for_pickup' && parcel.isReadyForPickup;
  }

  canMarkReady(parcel: Parcel): boolean {
    return parcel.status === 'pending' && !parcel.isReadyForPickup;
  }

  canCancel(parcel: Parcel): boolean {
    return ['pending', 'ready_for_pickup'].includes(parcel.status);
  }

  openChat(parcel: Parcel): void {
    if (parcel.courierId) {
      this.chatService.triggerChat(parcel.courierId, parcel.courierName || 'Carrier', parcel.id);
    }
  }
}
