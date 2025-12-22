import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDataService, Dispute, DisputeResolutionDTO } from '../../services/admin-data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-disputes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './disputes.component.html',
  styleUrl: './disputes.component.css'
})
export class DisputesComponent implements OnInit {
  disputes: Dispute[] = [];
  filteredDisputes: Dispute[] = [];
  selectedDispute: Dispute | null = null;
  isLoading = true;
  isProcessing = false;

  // Filters
  statusFilter = 'all';
  priorityFilter = 'all';
  typeFilter = 'all';

  // Resolution modal
  showResolutionModal = false;
  resolutionType: 'refund' | 'reassign' | 'penalize_carrier' | 'no_action' | 'partial_refund' = 'no_action';
  resolutionNotes = '';
  refundAmount: number | null = null;

  // Success/Error messages
  successMessage = '';
  errorMessage = '';

  // Image viewer
  showImageViewer = false;
  currentImage = '';

  // Stats
  stats = {
    total: 0,
    pending: 0,
    inReview: 0,
    resolved: 0,
    escalated: 0
  };

  constructor(private dataService: AdminDataService) {}

  ngOnInit(): void {
    this.loadDisputes();
  }

  loadDisputes(): void {
    this.isLoading = true;
    this.dataService.getDisputesAdmin().subscribe({
      next: (disputes) => {
        this.disputes = disputes;
        this.calculateStats();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading disputes:', error);
        this.isLoading = false;
        this.errorMessage = 'حدث خطأ أثناء تحميل النزاعات';
      }
    });
  }

  calculateStats(): void {
    this.stats = {
      total: this.disputes.length,
      pending: this.disputes.filter(d => d.status === 'pending').length,
      inReview: this.disputes.filter(d => d.status === 'in_review').length,
      resolved: this.disputes.filter(d => d.status === 'resolved').length,
      escalated: this.disputes.filter(d => d.status === 'escalated').length
    };
  }

  applyFilters(): void {
    this.filteredDisputes = this.disputes.filter(dispute => {
      const matchesStatus = this.statusFilter === 'all' || dispute.status === this.statusFilter;
      const matchesPriority = this.priorityFilter === 'all' || dispute.priority === this.priorityFilter;
      const matchesType = this.typeFilter === 'all' || dispute.type === this.typeFilter;
      return matchesStatus && matchesPriority && matchesType;
    });
  }

  selectDispute(dispute: Dispute): void {
    this.selectedDispute = dispute;
    this.clearMessages();
  }

  closeDetails(): void {
    this.selectedDispute = null;
  }

  openResolutionModal(): void {
    this.resolutionType = 'no_action';
    this.resolutionNotes = '';
    this.refundAmount = null;
    this.showResolutionModal = true;
  }

  closeResolutionModal(): void {
    this.showResolutionModal = false;
  }

  resolveDispute(): void {
    if (!this.selectedDispute || !this.resolutionNotes.trim()) {
      return;
    }

    this.isProcessing = true;
    const dto: DisputeResolutionDTO = {
      disputeId: this.selectedDispute.id,
      resolutionType: this.resolutionType,
      notes: this.resolutionNotes,
      refundAmount: this.refundAmount || undefined
    };

    // Use admin resolve endpoint
    this.dataService.resolveDisputeAdmin(this.selectedDispute.id, this.resolutionType === 'no_action' ? 'NoAction' : 'Resolved', this.resolutionNotes).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'تم الحل', text: 'تم حل النزاع بنجاح' });
        this.loadDisputes();
        this.closeResolutionModal();
        this.selectedDispute = null;
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error resolving dispute:', error);
        Swal.fire({ icon: 'error', title: 'فشل', text: 'حدث خطأ أثناء حل النزاع' });
        this.isProcessing = false;
      }
    });
  }

  escalateDispute(): void {
    if (!this.selectedDispute) return;

    this.isProcessing = true;
    this.dataService.escalateDispute(this.selectedDispute.id, 'تم التصعيد للإدارة العليا').subscribe({
      next: () => {
        this.successMessage = 'تم تصعيد النزاع للإدارة العليا';
        const index = this.disputes.findIndex(d => d.id === this.selectedDispute!.id);
        if (index !== -1) {
          this.disputes[index].status = 'escalated';
        }
        this.calculateStats();
        this.applyFilters();
        this.selectedDispute = null;
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error escalating dispute:', error);
        this.errorMessage = 'حدث خطأ أثناء تصعيد النزاع';
        this.isProcessing = false;
      }
    });
  }

  openImageViewer(imageUrl: string): void {
    this.currentImage = imageUrl;
    this.showImageViewer = true;
  }

  closeImageViewer(): void {
    this.showImageViewer = false;
    this.currentImage = '';
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  getDisputeTypeArabic(type: string): string {
    const types: { [key: string]: string } = {
      'not_delivered': 'لم يتم التسليم',
      'damaged': 'تلف المنتج',
      'wrong_item': 'منتج خاطئ',
      'late_delivery': 'تأخر التوصيل',
      'other': 'أخرى'
    };
    return types[type] || type;
  }

  getDisputeTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'not_delivered': 'bi-x-circle',
      'damaged': 'bi-box-seam',
      'wrong_item': 'bi-arrow-left-right',
      'late_delivery': 'bi-clock-history',
      'other': 'bi-question-circle'
    };
    return icons[type] || 'bi-question-circle';
  }

  getStatusArabic(status: string): string {
    const statuses: { [key: string]: string } = {
      'pending': 'قيد الانتظار',
      'in_review': 'قيد المراجعة',
      'resolved': 'تم الحل',
      'escalated': 'مُصعّد'
    };
    return statuses[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'in_review': 'bg-blue-100 text-blue-700 border-blue-200',
      'resolved': 'bg-green-100 text-green-700 border-green-200',
      'escalated': 'bg-red-100 text-red-700 border-red-200'
    };
    return classes[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  }

  getPriorityArabic(priority: string): string {
    const priorities: { [key: string]: string } = {
      'low': 'منخفضة',
      'medium': 'متوسطة',
      'high': 'عالية',
      'urgent': 'عاجلة'
    };
    return priorities[priority] || priority;
  }

  getPriorityClass(priority: string): string {
    const classes: { [key: string]: string } = {
      'low': 'bg-gray-100 text-gray-700',
      'medium': 'bg-blue-100 text-blue-700',
      'high': 'bg-orange-100 text-orange-700',
      'urgent': 'bg-red-100 text-red-700'
    };
    return classes[priority] || 'bg-gray-100 text-gray-700';
  }

  getComplainantTypeArabic(type: string): string {
    const types: { [key: string]: string } = {
      'sender': 'مُرسل',
      'carrier': 'مندوب',
      'customer': 'عميل'
    };
    return types[type] || type;
  }

  getResolutionTypeArabic(type: string): string {
    const types: { [key: string]: string } = {
      'refund': 'استرداد كامل',
      'partial_refund': 'استرداد جزئي',
      'reassign': 'إعادة تعيين المندوب',
      'penalize_carrier': 'معاقبة المندوب',
      'no_action': 'بدون إجراء'
    };
    return types[type] || type;
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
}

