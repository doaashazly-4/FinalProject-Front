import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDataService, PendingCarrier } from '../../services/admin-data.service';

@Component({
  selector: 'app-carrier-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carrier-approvals.component.html',
  styleUrl: './carrier-approvals.component.css'
})
export class CarrierApprovalsComponent implements OnInit {
  pendingCarriers: PendingCarrier[] = [];
  selectedCarrier: PendingCarrier | null = null;
  isLoading = true;
  isProcessing = false;
  
  // Rejection modal
  showRejectModal = false;
  rejectionReason = '';
  carrierToReject: PendingCarrier | null = null;

  // Success/Error messages
  successMessage = '';
  errorMessage = '';

  // Image viewer
  showImageViewer = false;
  currentImage = '';
  currentImageTitle = '';

  constructor(private dataService: AdminDataService) {}

  ngOnInit(): void {
    this.loadPendingCarriers();
  }

  loadPendingCarriers(): void {
    this.isLoading = true;
    this.dataService.getPendingCarriers().subscribe({
      next: (carriers) => {
        this.pendingCarriers = carriers;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading pending carriers:', error);
        this.isLoading = false;
        this.errorMessage = 'حدث خطأ أثناء تحميل طلبات المناديب';
      }
    });
  }

  selectCarrier(carrier: PendingCarrier): void {
    this.selectedCarrier = carrier;
    this.clearMessages();
  }

  closeDetails(): void {
    this.selectedCarrier = null;
  }

  approveCarrier(carrier: PendingCarrier): void {
    this.isProcessing = true;
    this.clearMessages();
    
    this.dataService.approveCarrier(carrier.id).subscribe({
      next: () => {
        this.successMessage = `تم قبول طلب المندوب "${carrier.name}" بنجاح! سيتم إرسال إشعار له.`;
        this.pendingCarriers = this.pendingCarriers.filter(c => c.id !== carrier.id);
        this.selectedCarrier = null;
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error approving carrier:', error);
        this.errorMessage = 'حدث خطأ أثناء قبول الطلب. يرجى المحاولة مرة أخرى.';
        this.isProcessing = false;
      }
    });
  }

  openRejectModal(carrier: PendingCarrier): void {
    this.carrierToReject = carrier;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.carrierToReject = null;
    this.rejectionReason = '';
  }

  confirmReject(): void {
    if (!this.carrierToReject || !this.rejectionReason.trim()) {
      return;
    }

    this.isProcessing = true;
    this.clearMessages();
    
    this.dataService.rejectCarrier(this.carrierToReject.id, this.rejectionReason).subscribe({
      next: () => {
        this.successMessage = `تم رفض طلب المندوب "${this.carrierToReject!.name}". سيتم إرسال إشعار له بالسبب.`;
        this.pendingCarriers = this.pendingCarriers.filter(c => c.id !== this.carrierToReject!.id);
        if (this.selectedCarrier?.id === this.carrierToReject!.id) {
          this.selectedCarrier = null;
        }
        this.closeRejectModal();
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error rejecting carrier:', error);
        this.errorMessage = 'حدث خطأ أثناء رفض الطلب. يرجى المحاولة مرة أخرى.';
        this.isProcessing = false;
      }
    });
  }

  openImageViewer(imageUrl: string, title: string): void {
    this.currentImage = imageUrl;
    this.currentImageTitle = title;
    this.showImageViewer = true;
  }

  closeImageViewer(): void {
    this.showImageViewer = false;
    this.currentImage = '';
    this.currentImageTitle = '';
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  getVehicleTypeArabic(type: string): string {
    const types: { [key: string]: string } = {
      'Motorcycle': 'دراجة نارية',
      'Car': 'سيارة',
      'Truck': 'شاحنة',
      'Van': 'فان'
    };
    return types[type] || type;
  }

  getVehicleIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'Motorcycle': 'bi-bicycle',
      'Car': 'bi-car-front',
      'Truck': 'bi-truck',
      'Van': 'bi-truck-front'
    };
    return icons[type] || 'bi-truck';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimeSinceApplication(dateString: string): string {
    const now = new Date();
    const applied = new Date(dateString);
    const diffMs = now.getTime() - applied.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `منذ ${diffDays} ${diffDays === 1 ? 'يوم' : 'أيام'}`;
    } else if (diffHours > 0) {
      return `منذ ${diffHours} ${diffHours === 1 ? 'ساعة' : 'ساعات'}`;
    } else {
      return 'منذ أقل من ساعة';
    }
  }
}

