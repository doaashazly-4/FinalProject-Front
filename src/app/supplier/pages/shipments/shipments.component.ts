import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { SupplierDataService, Parcel, ParcelStatus, AvailableCarrier } from '../../services/supplier-data.service';

@Component({
  selector: 'app-shipments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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

  statusFilters: { value: ParcelStatus | 'all'; label: string; count?: number }[] = [
    { value: 'all', label: 'الكل' },
    { value: 'pending', label: 'في الانتظار' },
    { value: 'ready_for_pickup', label: 'جاهز للاستلام' },
    { value: 'assigned', label: 'تم التعيين' },
    { value: 'picked_up', label: 'تم الاستلام' },
    { value: 'in_transit', label: 'قيد التوصيل' },
    { value: 'delivered', label: 'تم التسليم' },
    { value: 'failed_delivery', label: 'فشل التسليم' }
  ];

  constructor(
    private dataService: SupplierDataService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadParcels();
    
    // Check for assign query param
    this.route.queryParams.subscribe(params => {
      if (params['assign']) {
        this.openAssignModalById(params['assign']);
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
    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return;
    
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
      'pending': 'في الانتظار',
      'ready_for_pickup': 'جاهز للاستلام',
      'assigned': 'تم التعيين',
      'picked_up': 'تم الاستلام',
      'in_transit': 'قيد التوصيل',
      'out_for_delivery': 'في الطريق',
      'delivered': 'تم التسليم',
      'failed_delivery': 'فشل التسليم',
      'returned': 'مُرتجع',
      'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'ready_for_pickup': 'bg-blue-100 text-blue-800 border-blue-200',
      'assigned': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'picked_up': 'bg-purple-100 text-purple-800 border-purple-200',
      'in_transit': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'out_for_delivery': 'bg-teal-100 text-teal-800 border-teal-200',
      'delivered': 'bg-green-100 text-green-800 border-green-200',
      'failed_delivery': 'bg-red-100 text-red-800 border-red-200',
      'returned': 'bg-orange-100 text-orange-800 border-orange-200',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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
      'Motorcycle': 'موتوسيكل',
      'Car': 'سيارة',
      'Van': 'فان',
      'Truck': 'شاحنة'
    };
    return texts[type] || type;
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('ar-EG') + ' ج.م';
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
}
