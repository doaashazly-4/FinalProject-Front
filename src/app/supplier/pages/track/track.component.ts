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
import { interval, Subscription, timer } from 'rxjs';
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
  routePolyline?: L.Polyline;

  // Mock Data for Simulation
  // Cairo Center example
  readonly pickupLocation = { lat: 30.0444, lng: 31.2357 }; // Tahrir
  readonly deliveryLocation = { lat: 30.0561, lng: 31.2394 }; // Ramses Station area (short distance for demo)

  // A simple path between Tahrir and Ramses
  readonly routeCoordinates: [number, number][] = [
    [30.0444, 31.2357], // Start
    [30.0460, 31.2360],
    [30.0480, 31.2370],
    [30.0500, 31.2380],
    [30.0520, 31.2385],
    [30.0540, 31.2390],
    [30.0561, 31.2394]  // End
  ];

  currentRouteIndex = 0;
  simulationTimer: any;
  liveStatus = 'Pending';
  remainingTime = '15 mins';
  remainingDistance = '2.5 km';

  constructor(
    private dataService: SupplierDataService,
    private route: ActivatedRoute
  ) { }

  /* ================= INIT ================= */

  ngOnInit(): void {
    // Correct icon path issue
    const defaultIcon = L.icon({
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = defaultIcon;

    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.trackingNumber = params['id'];
        this.searchParcel();
      }
    });
  }

  ngAfterViewInit(): void {
    // If we already have a parcel loaded (e.g. valid ID in URL), init map
    if (this.parcel && this.shouldShowLiveTracking()) {
      this.initMap();
    }
  }

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

    // Mock search for demo purposes if real API fails or to force success
    // For now, we use the real service, but if it fails we might autofill a mock for the user to see the map
    this.dataService.trackParcel(this.trackingNumber).subscribe({
      next: (parcel) => {
        this.parcel = parcel;
        // Forcing status to in_transit for demo purposes if it's not
        // this.parcel.status = 'in_transit'; 

        this.loadTimeline();
        this.isSearching = false;

        if (this.shouldShowLiveTracking()) {
          // Delay slightly to let DOM render
          setTimeout(() => {
            this.initMap();
            this.startSimulation();
          }, 100);
        }
      },
      error: () => {
        // Fallback or error message
        this.errorMessage = 'لم يتم العثور على شحنة بهذا الرقم';
        this.isSearching = false;
      }
    });
  }

  loadDemoParcel(): void {
    this.isSearching = true;
    this.errorMessage = '';
    this.stopLiveTracking();
    this.destroyMap();
    this.trackingNumber = 'DEMO-123456';

    // Fake Parcel Data
    this.parcel = {
      id: 'demo-123',
      trackingNumber: 'DEMO-123456',
      description: 'Demo Electronics Package',
      weight: 2.5,
      pickupAddress: 'Cairo, Tahrir Square',
      deliveryAddress: 'Cairo, Ramses Station',
      receiverName: 'Ahmed Mohamed',
      receiverPhone: '01012345678',
      status: 'in_transit',
      priority: 'normal',
      createdAt: new Date().toISOString(),
      courierId: 'courier-007',
      courierName: 'Fast Courier',
      courierPhone: '01234567890',
      deliveryFee: 50,
      codAmount: 1500,
      isReadyForPickup: true
    };

    // Fake Timeline
    this.timeline = [
      { id: '1', status: 'pending', title: 'تم إنشاء الشحنة', description: 'تم استلام طلب الشحن', timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: '2', status: 'picked_up', title: 'تم الاستلام', description: 'المندوب استلم الشحنة', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: '3', status: 'in_transit', title: 'في الطريق', description: 'الشحنة في طريقها إليك', timestamp: new Date(Date.now() - 1800000).toISOString() }
    ];

    this.isSearching = false;

    // Start Simulation
    setTimeout(() => {
      this.initMap();
      this.startSimulation();
    }, 100);
  }

  loadTimeline(): void {
    if (!this.parcel) return;
    this.dataService.getParcelTimeline(this.parcel.id).subscribe({
      next: (events) => (this.timeline = events),
      error: () => {
        // Mock timeline if empty
        this.timeline = [
          { id: '1', status: 'pending', title: 'تم إنشاء الشحنة', description: 'تم استلام طلب الشحن', timestamp: new Date().toISOString() },
          { id: '2', status: 'picked_up', title: 'تم الاستلام', description: 'المندوب استلم الشحنة', timestamp: new Date().toISOString() }
        ];
      }
    });
  }

  /* ================= LIVE TRACKING & SIMULATION ================= */

  shouldShowLiveTracking(): boolean {
    // Always true for this demo if parcel exists
    return !!this.parcel;
  }

  startSimulation(): void {
    this.currentRouteIndex = 0;
    this.liveStatus = 'Picked Up';

    if (this.simulationTimer) clearInterval(this.simulationTimer);

    this.simulationTimer = setInterval(() => {
      if (this.currentRouteIndex < this.routeCoordinates.length) {
        const [lat, lng] = this.routeCoordinates[this.currentRouteIndex];
        this.updateCarrierMarker(lat, lng);
        this.updateSimulationStatus(this.currentRouteIndex, this.routeCoordinates.length);
        this.currentRouteIndex++;
      } else {
        this.liveStatus = 'Delivered';
        if (this.parcel) this.parcel.status = 'delivered';
        clearInterval(this.simulationTimer);
      }
    }, 2000); // Update every 2 seconds
  }

  stopLiveTracking(): void {
    this.isLiveTracking = false;
    if (this.simulationTimer) clearInterval(this.simulationTimer);
  }

  updateSimulationStatus(index: number, total: number): void {
    const progress = index / total;

    if (progress < 0.2) this.liveStatus = 'Picked Up';
    else if (progress < 0.8) this.liveStatus = 'In Transit';
    else if (progress < 1.0) this.liveStatus = 'Near Destination';
    else this.liveStatus = 'Delivered';

    // Mock ETA
    const minsLeft = Math.ceil((total - index) * 2); // 2 mins per segment mock
    this.remainingTime = `${minsLeft} mins`;

    const kmLeft = ((total - index) * 0.5).toFixed(1);
    this.remainingDistance = `${kmLeft} km`;

    this.lastUpdated = new Date();
  }

  /* ================= MAP ================= */

  initMap(): void {
    if (this.map || !this.mapContainer) return;

    this.map = L.map(this.mapContainer.nativeElement).setView(
      [this.pickupLocation.lat, this.pickupLocation.lng],
      13
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);

    // 1. Pickup Marker (Green)
    const pickupIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #10B981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
    L.marker([this.pickupLocation.lat, this.pickupLocation.lng], { icon: pickupIcon })
      .addTo(this.map)
      .bindPopup('Pickup Location')
      .openPopup();

    // 2. Delivery Marker (Red)
    const deliveryIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #EF4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
    L.marker([this.deliveryLocation.lat, this.deliveryLocation.lng], { icon: deliveryIcon })
      .addTo(this.map)
      .bindPopup('Delivery Location');

    // 3. Route Polyline
    this.routePolyline = L.polyline(this.routeCoordinates, {
      color: '#3B82F6',
      weight: 4,
      opacity: 0.7,
      dashArray: '10, 10' // Dashed line for effect
    }).addTo(this.map);

    // Fit bounds to show whole route
    this.map.fitBounds(this.routePolyline.getBounds(), { padding: [50, 50] });

    // 4. Carrier Marker (Truck/Bike) initialized at start
    // We'll create it in updateCarrierMarker
  }

  updateCarrierMarker(lat: number, lng: number): void {
    if (!this.map) return;

    const courierIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #2563EB; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                <i class="bi bi-truck" style="font-size: 16px;"></i>
               </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    if (this.carrierMarker) {
      this.carrierMarker.setLatLng([lat, lng]);
    } else {
      this.carrierMarker = L.marker([lat, lng], { icon: courierIcon }).addTo(this.map);
    }

    // Optional: Pan map to follow driver?
    // this.map.panTo([lat, lng]);
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

    // Use liveStatus if we are simulating, else parcel.status
    const current = this.liveStatus.toLowerCase().replace(' ', '_');
    // Map live status to parcel status if needed, or just use parcel status logic
    // For demo using parcel status mainly

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
