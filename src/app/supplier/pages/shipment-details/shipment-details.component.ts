import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupplierDataService, Parcel } from '../../services/supplier-data.service';
import { LynxTalismanComponent } from '../../../shared/components/lynx-talisman/lynx-talisman.component';
import { AssignmentObservation } from '../../../models/assignment-observation.model';
import { LynxTalismanComponent } from '../../../shared/components/lynx-talisman/lynx-talisman.component';
import { AssignmentObservation } from '../../../models/assignment-observation.model';

interface PackageDetail {
    description: string;
    weight: number;
    dimensions: string;
    fragile: boolean;
    requiresSignature: boolean;
    expireDate: string;
    shipmentCost: number;
    deliveryFee: number;
    destination: string;
    lat: number;
    lng: number;
    notes: string;
    receiverName: string;
    receiverPhone: string;
    receiverEmail: string;
    customerID: string;
    status: string;
    isExpanded?: boolean;
}

interface ShipmentDetails {
    id: string;
    source: string;
    pickupLat: number;
    pickupLng: number;
    priority: string;
    createdAt: string;
    packages: PackageDetail[];
}

@Component({
    selector: 'app-shipment-details',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, LynxTalismanComponent],
    imports: [CommonModule, RouterModule, FormsModule, LynxTalismanComponent],
    templateUrl: './shipment-details.component.html',
    styleUrl: './shipment-details.component.css'
})
export class ShipmentDetailsComponent implements OnInit {
    shipment: ShipmentDetails | null = null;
    searchQuery: string = '';
    filterStatus: string = 'all';
    sortBy: string = 'description';
    isLoading = false;
    trackingId: string | null = null;
    explanation: AssignmentObservation | null = null;
    explanation: AssignmentObservation | null = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private dataService: SupplierDataService
    ) { }

    ngOnInit(): void {
        this.trackingId = this.route.snapshot.paramMap.get('id');
        if (this.trackingId) {
            this.loadShipmentData(this.trackingId);
        } else {
            this.loadMockData();
        }
    }

    loadShipmentData(id: string): void {
        this.isLoading = true;

        // Fetch explanation non-blocking
        this.dataService.getAssignmentExplanation(id).subscribe({
            next: (explanation) => this.explanation = explanation,
            error: () => this.explanation = null
        });

        this.dataService.getParcelById(id).subscribe({
            next: (parcel: Parcel) => {
                console.log('Received parcel data mapped:', parcel);
                this.shipment = {
                    id: String(parcel.trackingNumber || parcel.id || ''),
                    source: String(parcel.pickupAddress || parcel.source || ''),
                    pickupLat: Number(parcel.pickupLat || 0),
                    pickupLng: Number(parcel.pickupLng || 0),
                    priority: String(parcel.priority || 'normal'),
                    createdAt: String(parcel.createdAt || new Date().toISOString()),
                    packages: [
                        {
                            description: String(parcel.description || ''),
                            weight: Number(parcel.weight || 0),
                            dimensions: String(parcel.dimensions || ''),
                            fragile: Boolean(parcel.isFragile),
                            requiresSignature: Boolean(parcel.requiresSignature),
                            expireDate: String(parcel.estimatedDelivery || parcel.createdAt || new Date().toISOString()),
                            shipmentCost: Number(parcel.codAmount || 0),
                            deliveryFee: Number(parcel.deliveryFee || 0),
                            destination: String(parcel.deliveryAddress || ''),
                            lat: Number(parcel.destinationLat || 0),
                            lng: Number(parcel.destinationLng || 0),
                            notes: String(parcel.notes || ''),
                            receiverName: String(parcel.receiverName || 'عميل'),
                            receiverPhone: String(parcel.receiverPhone || '-'),
                            receiverEmail: String(parcel.receiverEmail || ''),
                            customerID: String(parcel.customerID || '-'),
                            status: String(parcel.status || 'pending'),
                            isExpanded: false
                        }
                    ]
                };
                console.log('Formatted shipment object for view:', this.shipment);
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading shipment from API:', err);
                this.loadMockData();
                this.isLoading = false;
            }
        });
    }

    loadMockData(): void {
        this.shipment = {
            id: 'TRK-MOCK-123',
            source: "Cairo Industrial Zone, Warehouse B4",
            pickupLat: 30.0444,
            pickupLng: 31.2357,
            priority: "high",
            createdAt: new Date().toISOString(),
            packages: [
                {
                    description: "Electronics - Smart Devices",
                    weight: 15.5,
                    dimensions: '40x40x20',
                    fragile: true,
                    requiresSignature: true,
                    expireDate: "2026-01-10T14:30:00.000Z",
                    shipmentCost: 200,
                    deliveryFee: 45,
                    destination: "123 Main St, New Cairo, Egypt",
                    lat: 30.0263,
                    lng: 31.4913,
                    notes: "Handle with care, delicate sensors inside.",
                    receiverName: "Ahmed Mohamed",
                    receiverPhone: "01012345678",
                    receiverEmail: "ahmed@example.com",
                    customerID: "CUST-334",
                    status: 'pending',
                    isExpanded: false
                }
            ]
        };
    }

    toggleExpand(pkg: PackageDetail): void {
        pkg.isExpanded = !pkg.isExpanded;
    }

    deleteShipment(): void {
        if (!this.shipment) return;

        const confirmMsg = 'هل أنت متأكد من حذف هذه الشحنة نهائياً؟ سيؤدي هذا لإزالتها من قاعدة البيانات.';
        if (confirm(confirmMsg)) {
            this.isLoading = true;
            this.dataService.deleteRequest(this.shipment.id).subscribe({
                next: () => {
                    console.log('Shipment deleted successfully');
                    this.router.navigate(['/supplier/shipments']);
                },
                error: (err) => {
                    console.error('Error during shipment deletion:', err);

                    // Check for database constraint error in the 500 response
                    if (err.status === 500 && err.error?.includes('REFERENCE constraint')) {
                        alert('فشل الحذف بسبب وجود محتويات (Packages) مرتبطة بهذه الشحنة. يجب تفعيل الحذف التلقائي (Cascade Delete) في خادم قاعدة البيانات أو حذف المحتويات أولاً.');
                    } else {
                        alert('حدث خطأ أثناء محاولة حذف الشحنة. يرجى مراجعة سجلات النظام.');
                    }

                    this.isLoading = false;
                }
            });
        }
    }

    get filteredPackages(): PackageDetail[] {
        if (!this.shipment) return [];

        let filtered = this.shipment.packages.filter(pkg => {
            const matchesSearch = pkg.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                pkg.destination.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                pkg.receiverName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                pkg.receiverPhone.includes(this.searchQuery);

            const matchesFilter = this.filterStatus === 'all' ||
                (this.filterStatus === 'fragile' && pkg.fragile) ||
                (this.filterStatus === 'urgent' && this.shipment?.priority === 'urgent') ||
                pkg.status === this.filterStatus;

            return matchesSearch && matchesFilter;
        });

        return filtered.sort((a, b) => {
            if (this.sortBy === 'cost') return b.shipmentCost - a.shipmentCost;
            if (this.sortBy === 'weight') return b.weight - a.weight;
            if (this.sortBy === 'expiry') return new Date(a.expireDate).getTime() - new Date(b.expireDate).getTime();
            return a.description.localeCompare(b.description);
        });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'pending': return 'bg-gray-100 text-gray-600';
            case 'in_transit': return 'bg-blue-100 text-blue-600';
            case 'delivered': return 'bg-green-100 text-green-600';
            case 'delayed': return 'bg-orange-100 text-orange-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'pending': return 'bi-hourglass-split';
            case 'in_transit': return 'bi-truck';
            case 'delivered': return 'bi-check-circle-fill';
            case 'delayed': return 'bi-exclamation-triangle-fill';
            default: return 'bi-question-circle';
        }
    }

    getStatusText(status: string): string {
        const statuses: { [key: string]: string } = {
            'pending': 'في الانتظار',
            'ready_for_pickup': 'جاهز للاستلام',
            'assigned': 'تم تعيين مندوب',
            'picked_up': 'تم استلام الشحنة',
            'in_transit': 'قيد التوصيل',
            'out_for_delivery': 'خرجت للتوصيل',
            'delivered': 'تم التسليم بنجاح',
            'failed_delivery': 'فشل التسليم',
            'returned': 'مرتجع',
            'cancelled': 'ملغى'
        };
        return statuses[status.toLowerCase()] || status;
    }

    formatDate(dateStr: string): string {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('ar-EG', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getPriorityClass(priority: string): string {
        switch (priority) {
            case 'urgent': return 'bg-red-500 text-white';
            case 'high': return 'bg-red-100 text-red-600';
            default: return 'bg-blue-100 text-blue-600';
        }
    }

    editPackage(pkg: PackageDetail, event: Event): void {
        event.stopPropagation();
        console.log('Edit package:', pkg.receiverName);
    }

    deletePackage(pkg: PackageDetail, event: Event): void {
        event.stopPropagation();
        console.log('Delete package:', pkg.receiverName);
    }

    trackPackage(pkg: PackageDetail, event: Event): void {
        event.stopPropagation();
        console.log('Track package:', pkg.receiverName);
    }
}
