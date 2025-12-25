import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import {
  SupplierDataService,
  Parcel,
  ParcelTimelineEvent,
  CarrierLiveLocation,
  RateCarrierDTO
} from '../../services/supplier-data.service';
import { interval, Subscription } from 'rxjs';
import * as L from 'leaflet';

@Component({
  selector: 'app-track',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './track.component.html',
  styleUrl: './track.component.css'
})
export class TrackComponent
  implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  trackingNumber = '';
  parcel: Parcel | null = null;
  timeline: ParcelTimelineEvent[] = [];
  carrierLocation: CarrierLiveLocation | null = null;

  isSearching = false;
  errorMessage = '';

  // Live tracking
  isLiveTracking = false;
  liveTrackingSubscription: Subscription | null = null;
  lastUpdated: Date | null = null;

  // Leaflet
  map?: L.Map;
  carrierMarker?: L.Marker;

  constructor(
    private dataService: SupplierDataService,
    private route: ActivatedRoute
  ) {}

  /* ================= INIT ================= */

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.trackingNumber = params['id'];
        this.searchParcel();
      }
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.stopLiveTracking();
    this.destroyMap();
  }

  /* ================= SEARCH ================= */

  searchParcel(): void {
    if (!this.trackingNumber.trim()) {
      this.errorMessage = 'يرجى إدخال رقم التتبع';
      return;
    }

    this.isSearching = true;
    this.errorMessage = '';
    this.parcel = null;
    this.timeline = [];
    this.stopLiveTracking();
    this.destroyMap();

    this.dataService.trackParcel(this.trackingNumber).subscribe({
      next: (parcel) => {
        this.parcel = parcel;
        this.loadTimeline();
        this.isSearching = false;

        if (this.shouldShowLiveTracking()) {
          this.startLiveTracking();
        }
      },
      error: () => {
        this.errorMessage = 'لم يتم العثور على شحنة بهذا الرقم';
        this.isSearching = false;
      }
    });
  }

  loadTimeline(): void {
    if (!this.parcel) return;

    this.dataService.getParcelTimeline(this.parcel.id).subscribe({
      next: (events) => (this.timeline = events)
    });
  }

  /* ================= LIVE TRACKING ================= */

  shouldShowLiveTracking(): boolean {
    return !!this.parcel &&
      ['assigned', 'picked_up', 'in_transit', 'out_for_delivery']
        .includes(this.parcel.status);
  }

  startLiveTracking(): void {
    if (!this.parcel || this.isLiveTracking) return;

    this.isLiveTracking = true;
    this.initMap();

    this.loadCarrierLocation();
    this.liveTrackingSubscription = interval(10000).subscribe(() => {
      this.loadCarrierLocation();
    });
  }

  stopLiveTracking(): void {
    this.isLiveTracking = false;
    this.liveTrackingSubscription?.unsubscribe();
    this.liveTrackingSubscription = null;
  }

  loadCarrierLocation(): void {
    if (!this.parcel) return;

    this.dataService.getCarrierLiveLocation(this.parcel.id).subscribe({
      next: (location) => {
        this.carrierLocation = location;
        this.lastUpdated = new Date();
        this.updateCarrierMarker(location.lat, location.lng);
      }
    });
  }

  /* ================= MAP ================= */

  initMap(): void {
    if (this.map) return;

    this.map = L.map(this.mapContainer.nativeElement).setView(
      [30.0444, 31.2357],
      12
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);
  }

  updateCarrierMarker(lat: number, lng: number): void {
    if (!this.map) return;

    if (this.carrierMarker) {
      this.carrierMarker.setLatLng([lat, lng]);
    } else {
      this.carrierMarker = L.marker([lat, lng]).addTo(this.map);
    }

    this.map.setView([lat, lng], 14);
  }

  destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
      this.carrierMarker = undefined;
    }
  }

  /* ================= RATING ================= */

  showRatingModal = false;
  rating = 0;
  ratingHover = 0;
  ratingReview = '';
  isSubmittingRating = false;

  canRate(): boolean {
    return !!this.parcel &&
           this.parcel.status === 'delivered' &&
           !this.parcel.carrierRating;
  }

  openRatingModal(): void {
    this.showRatingModal = true;
    this.rating = 0;
    this.ratingReview = '';
  }

  closeRatingModal(): void {
    this.showRatingModal = false;
  }

  setRating(star: number): void {
    this.rating = star;
  }

  submitRating(): void {
    if (!this.parcel || !this.parcel.courierId || this.rating === 0) return;

    this.isSubmittingRating = true;
    const dto: RateCarrierDTO = {
      orderId: this.parcel.id,
      carrierId: this.parcel.courierId,
      rating: this.rating,
      review: this.ratingReview
    };

    this.dataService.rateCarrier(dto).subscribe({
      next: () => {
        this.isSubmittingRating = false;
        this.closeRatingModal();
        if (this.parcel) {
          this.parcel.carrierRating = this.rating;
        }
      },
      error: () => {
        this.isSubmittingRating = false;
        alert('حدث خطأ أثناء إرسال التقييم');
      }
    });
  }

  /* ================= HELPERS ================= */

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'في الانتظار',
      'ready_for_pickup': 'جاهز للاستلام',
      'assigned': 'تم تعيين مندوب',
      'picked_up': 'تم استلام الطرد',
      'in_transit': 'في الطريق',
      'out_for_delivery': 'وصل لمنطقة التسليم',
      'delivered': 'تم التسليم',
      'failed_delivery': 'فشل التسليم',
      'returned': 'مُرتجع',
      'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'ready_for_pickup': 'bg-blue-100 text-blue-800',
      'assigned': 'bg-indigo-100 text-indigo-800',
      'picked_up': 'bg-purple-100 text-purple-800',
      'in_transit': 'bg-cyan-100 text-cyan-800',
      'out_for_delivery': 'bg-teal-100 text-teal-800',
      'delivered': 'bg-green-100 text-green-800',
      'failed_delivery': 'bg-red-100 text-red-800',
      'returned': 'bg-orange-100 text-orange-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'pending': 'bi-clock',
      'ready_for_pickup': 'bi-box-seam',
      'assigned': 'bi-person-check',
      'picked_up': 'bi-box-arrow-up',
      'in_transit': 'bi-truck',
      'out_for_delivery': 'bi-geo-alt',
      'delivered': 'bi-check-circle',
      'failed_delivery': 'bi-x-circle',
      'returned': 'bi-arrow-return-left',
      'cancelled': 'bi-slash-circle'
    };
    return iconMap[status] || 'bi-circle';
  }

  getProgressPercentage(): number {
    if (!this.parcel) return 0;
    
    const statusOrder = ['pending', 'ready_for_pickup', 'assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
    const index = statusOrder.indexOf(this.parcel.status);
    
    if (index === -1) return 0;
    return Math.round((index / (statusOrder.length - 1)) * 100);
  }

  isTimelineEventCompleted(event: ParcelTimelineEvent): boolean {
    if (!this.parcel) return false;
    
    const statusOrder = ['pending', 'ready_for_pickup', 'assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(this.parcel.status);
    const eventIndex = statusOrder.indexOf(event.status);
    
    return eventIndex <= currentIndex;
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateTime(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('ar-EG', {
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
}
