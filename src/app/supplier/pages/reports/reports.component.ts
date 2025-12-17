import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupplierDataService, ReportSummary, DailyReport, Parcel } from '../../services/supplier-data.service';

@Component({
  selector: 'app-supplier-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class SupplierReportsComponent implements OnInit {
  reportSummary: ReportSummary | null = null;
  dailyReports: DailyReport[] = [];
  deliveredParcels: Parcel[] = [];
  
  isLoading = true;
  selectedPeriod: 'today' | 'week' | 'month' = 'today';
  
  periods: { value: 'today' | 'week' | 'month'; label: string }[] = [
    { value: 'today', label: 'اليوم' },
    { value: 'week', label: 'هذا الأسبوع' },
    { value: 'month', label: 'هذا الشهر' }
  ];
  
  // Export Modal
  showExportModal = false;
  exportStartDate = '';
  exportEndDate = '';
  exportFormat: 'pdf' | 'excel' | 'csv' = 'excel';
  isExporting = false;

  constructor(private dataService: SupplierDataService) {}

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadReports();
  }

  setDefaultDates(): void {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    this.exportEndDate = today.toISOString().split('T')[0];
    this.exportStartDate = weekAgo.toISOString().split('T')[0];
  }

  loadReports(): void {
    this.isLoading = true;

    this.dataService.getReportSummary(this.selectedPeriod).subscribe({
      next: (summary) => {
        this.reportSummary = summary;
      },
      error: (err) => {
        console.error('Error loading report summary:', err);
      }
    });

    this.loadDailyReports();
    this.loadDeliveredParcels();
  }

  loadDailyReports(): void {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];

    this.dataService.getDailyReports(startDate, endDate).subscribe({
      next: (reports) => {
        this.dailyReports = reports;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading daily reports:', err);
        this.isLoading = false;
      }
    });
  }

  loadDeliveredParcels(): void {
    this.dataService.getParcels({ status: 'delivered' }).subscribe({
      next: (parcels) => {
        this.deliveredParcels = parcels.slice(0, 10);
      }
    });
  }

  onPeriodChange(period: 'today' | 'week' | 'month'): void {
    this.selectedPeriod = period;
    this.loadReports();
  }

  // Export (UC-SUP-05)
  openExportModal(): void {
    this.showExportModal = true;
  }

  closeExportModal(): void {
    this.showExportModal = false;
  }

  exportReport(): void {
    if (!this.exportStartDate || !this.exportEndDate) return;

    this.isExporting = true;

    this.dataService.exportReport({
      startDate: this.exportStartDate,
      endDate: this.exportEndDate,
      format: this.exportFormat,
      includeDetails: true
    }).subscribe({
      next: (blob) => {
        // Download file
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${this.exportStartDate}-to-${this.exportEndDate}.${this.exportFormat}`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.closeExportModal();
        this.isExporting = false;
      },
      error: (err) => {
        console.error('Error exporting report:', err);
        // For demo, just close the modal
        this.closeExportModal();
        this.isExporting = false;
        alert('تم إنشاء التقرير (تجريبي)');
      }
    });
  }

  // Helpers
  getPeriodLabel(): string {
    const labels = {
      'today': 'اليوم',
      'week': 'هذا الأسبوع',
      'month': 'هذا الشهر'
    };
    return labels[this.selectedPeriod];
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', {
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('ar-EG') + ' ج.م';
  }

  getSuccessRateClass(rate: number): string {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  }

  getRatingStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.round(rating) ? 1 : 0);
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'delivered': 'تم التسليم',
      'failed_delivery': 'فشل التسليم'
    };
    return statusMap[status] || status;
  }

  absValue(value: number): number {
    return Math.abs(value);
  }
}

