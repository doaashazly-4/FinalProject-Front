import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupplierDataService, Parcel } from '../../services/supplier-data.service';
import { LynxTalismanComponent } from '../../../shared/components/lynx-talisman/lynx-talisman.component';
import { AssignmentObservation } from '../../../models/assignment-observation.model';

interface PackageDetail {
    description: string;
    weight: number;
    fragile: boolean;
    expireDate: string;
    shipmentCost: number;
    destination: string;
    lat: number;
    lng: number;
    notes: string;
    customerID: string;
    status: string;
    isExpanded?: boolean;
}

interface ShipmentDetails {
    source: string;
    pickupLat: number;
    pickupLng: number;
    priority: string;
    packages: PackageDetail[];
}

@Component({
    selector: 'app-shipment-details',
    standalone: true,
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

    constructor(
        private route: ActivatedRoute,
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
                this.shipment = {
                    source: parcel.pickupAddress,
                    pickupLat: 30.0444,
                    pickupLng: 31.2357,
                    priority: parcel.priority,
                    packages: [
                        {
                            description: parcel.description,
                            weight: parcel.weight,
                            fragile: parcel.isFragile || false,
                            expireDate: parcel.estimatedDelivery || new Date().toISOString(),
                            shipmentCost: parcel.codAmount,
                            destination: parcel.deliveryAddress,
                            lat: 30.0444,
                            lng: 31.2357,
                            notes: parcel.notes || '',
                            customerID: parcel.receiverName,
                            status: parcel.status,
                            isExpanded: false
                        }
                    ]
                };
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading shipment:', err);
                this.loadMockData();
                this.isLoading = false;
            }
        });
    }

    loadMockData(): void {
        this.shipment = {
            source: "Cairo Industrial Zone, Warehouse B4",
            pickupLat: 30.0444,
            pickupLng: 31.2357,
            priority: "high",
            packages: [
                {
                    description: "Electronics - Smart Devices",
                    weight: 15.5,
                    fragile: true,
                    expireDate: "2026-01-10T14:30:00.000Z",
                    shipmentCost: 200,
                    destination: "123 Main St, New Cairo, Egypt",
                    lat: 30.0263,
                    lng: 31.4913,
                    notes: "Handle with care, delicate sensors inside.",
                    customerID: "CUST-001",
                    status: 'pending',
                    isExpanded: false
                },
                {
                    description: "Office Supplies - Batch A",
                    weight: 42.0,
                    fragile: false,
                    expireDate: "2026-02-15T12:00:00.000Z",
                    shipmentCost: 150,
                    destination: "45 Business Ave, Maadi",
                    lat: 29.9602,
                    lng: 31.2569,
                    notes: "Leave at reception if no one is available.",
                    customerID: "CUST-104",
                    status: 'in_transit',
                    isExpanded: false
                },
                {
                    description: "Perishable Goods - Fresh Produce",
                    weight: 8.2,
                    fragile: true,
                    expireDate: "2026-01-05T09:00:00.000Z",
                    shipmentCost: 350,
                    destination: "78 Garden City, Cairo",
                    lat: 30.0355,
                    lng: 31.2327,
                    notes: "Urgent delivery required due to expiration.",
                    customerID: "CUST-089",
                    status: 'delayed',
                    isExpanded: false
                },
                {
                    description: "Industrial Parts - Steel Gears",
                    weight: 120.0,
                    fragile: false,
                    expireDate: "2026-03-20T17:00:00.000Z",
                    shipmentCost: 500,
                    destination: "Warehouse 12, 10th of Ramadan City",
                    lat: 30.2974,
                    lng: 31.7377,
                    notes: "Heavy load, requires forklift at destination.",
                    customerID: "CUST-256",
                    status: 'delivered',
                    isExpanded: false
                }
            ]
        };
    }

    toggleExpand(pkg: PackageDetail): void {
        pkg.isExpanded = !pkg.isExpanded;
    }

    get filteredPackages(): PackageDetail[] {
        if (!this.shipment) return [];

        let filtered = this.shipment.packages.filter(pkg => {
            const matchesSearch = pkg.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                pkg.destination.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                pkg.customerID.toLowerCase().includes(this.searchQuery.toLowerCase());

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
        return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
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
        console.log('Edit package:', pkg.customerID);
    }

    deletePackage(pkg: PackageDetail, event: Event): void {
        event.stopPropagation();
        console.log('Delete package:', pkg.customerID);
    }

    trackPackage(pkg: PackageDetail, event: Event): void {
        event.stopPropagation();
        console.log('Track package:', pkg.customerID);
    }
}
