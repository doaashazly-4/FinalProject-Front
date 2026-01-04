import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Parcel } from '../../services/supplier-data.service';

@Component({
    selector: 'app-shipment-card',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './shipment-card.component.html',
    styleUrl: './shipment-card.component.css'
})
export class ShipmentCardComponent {
    @Input() parcel!: Parcel;
    @Input() index: number = 0;
    @Input() showActions: boolean = true;
    @Input() compact: boolean = false;

    @Output() onTrack = new EventEmitter<Parcel>();
    @Output() onEdit = new EventEmitter<Parcel>();
    @Output() onDelete = new EventEmitter<Parcel>();
    @Output() onDetails = new EventEmitter<Parcel>();
    @Output() onMarkReady = new EventEmitter<Parcel>();
    @Output() onAssign = new EventEmitter<Parcel>();

    isExpanded = false;

    toggleExpand(event: Event): void {
        event.stopPropagation();
        this.isExpanded = !this.isExpanded;
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'pending': return 'bg-gray-100 text-gray-600';
            case 'ready_for_pickup': return 'bg-blue-100 text-blue-600';
            case 'assigned': return 'bg-indigo-100 text-indigo-600';
            case 'picked_up': return 'bg-purple-100 text-purple-600';
            case 'in_transit': return 'bg-blue-100 text-blue-600';
            case 'delivered': return 'bg-green-100 text-green-600';
            case 'failed_delivery': return 'bg-red-100 text-red-600';
            case 'cancelled': return 'bg-red-50 text-red-500';
            default: return 'bg-gray-100 text-gray-600';
        }
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'pending': return 'bi-hourglass-split';
            case 'ready_for_pickup': return 'bi-check2-circle';
            case 'assigned': return 'bi-person-check';
            case 'picked_up': return 'bi-box-seam-fill';
            case 'in_transit': return 'bi-truck';
            case 'delivered': return 'bi-check-circle-fill';
            case 'failed_delivery': return 'bi-exclamation-triangle-fill';
            case 'cancelled': return 'bi-x-circle-fill';
            default: return 'bi-question-circle';
        }
    }

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

    getPriorityClass(priority: string): string {
        return priority === 'urgent' ? 'bg-red-500 text-white' : 'bg-blue-100 text-blue-600';
    }

    formatDate(dateStr: string | undefined): string {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('ar-EG', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatCurrency(amount: number): string {
        return amount.toLocaleString('ar-EG') + ' ج.م';
    }

    track(event: Event): void {
        event.stopPropagation();
        this.onTrack.emit(this.parcel);
    }

    edit(event: Event): void {
        event.stopPropagation();
        this.onEdit.emit(this.parcel);
    }

    delete(event: Event): void {
        event.stopPropagation();
        this.onDelete.emit(this.parcel);
    }

    details(event: Event): void {
        event.stopPropagation();
        this.onDetails.emit(this.parcel);
    }

    markReady(event: Event): void {
        event.stopPropagation();
        this.onMarkReady.emit(this.parcel);
    }

    assign(event: Event): void {
        event.stopPropagation();
        this.onAssign.emit(this.parcel);
    }
}
