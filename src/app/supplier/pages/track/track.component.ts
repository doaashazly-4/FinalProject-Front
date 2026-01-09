import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { SupplierDataService, Parcel, ParcelTimelineEvent, CarrierLiveLocation, RateCarrierDTO } from '../../services/supplier-data.service';
import { interval, Subscription, timer } from 'rxjs';
import * as L from 'leaflet';
import { AuthService } from '../../../shared/services/auth.service';
import { SignalRService } from '../../../shared/services/signalr.service';
import { LanguageService } from '../../../shared/services/language.service';
import { ThemeService } from '../../../shared/services/theme.service';

@Component({
  selector: 'app-track',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './track.component.html',
  styleUrl: './track.component.css'
})
export class TrackComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  trackingNumber = '';
  parcel: Parcel | null = null;
  timeline: ParcelTimelineEvent[] = [];
  carrierLocation: CarrierLiveLocation | null = null;

  isSearching = false;
  errorMessage = '';

  // Leaflet
  map?: L.Map;
  carrierMarker?: L.Marker;
  routePolyline?: L.Polyline;

  constructor(
    private dataService: SupplierDataService,
    private route: ActivatedRoute,
    private signalR: SignalRService,
    private auth: AuthService,
    public langService: LanguageService,
    public themeService: ThemeService
  ) { }

  ngOnInit(): void {
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

    this.signalR.location$.subscribe(location => {
      if (location) {
        this.updateCarrierMarker(location.lat, location.lng);
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.parcel) {
      this.initMap();
    }
  }

  ngOnDestroy(): void {
    this.signalR.stopConnection();
    this.destroyMap();
  }

  searchParcel(): void {
    if (!this.trackingNumber.trim()) return;

    this.isSearching = true;
    this.errorMessage = '';
    this.parcel = null;
    this.timeline = [];
    this.destroyMap();

    this.dataService.getParcelById(this.trackingNumber).subscribe({
      next: (parcel) => {
        this.parcel = parcel;
        this.loadTimeline();
        this.isSearching = false;

        setTimeout(() => {
          this.initMap();
          const token = this.auth.getToken();
          if (token && this.parcel?.id) {
            this.signalR.startConnection(token).then(() => {
              this.signalR.joinOrderGroup(this.parcel!.id);
            });
          }
        }, 100);
      },
      error: () => {
        this.errorMessage = this.langService.currentLang() === 'ar' ? 'لم يتم العثور على شحنة' : 'Shipment not found';
        this.isSearching = false;
      }
    });
  }

  loadTimeline(): void {
    if (!this.parcel) return;
    this.dataService.getParcelTimeline(this.parcel.id).subscribe({
      next: (events) => (this.timeline = events),
      error: () => {
        this.timeline = [];
      }
    });
  }

  initMap(): void {
    if (this.map || !this.mapContainer || !this.parcel) return;

    const pLat = this.parcel.pickupLat || 30.0444;
    const pLng = this.parcel.pickupLng || 31.2357;
    const dLat = this.parcel.destinationLat || 30.0561;
    const dLng = this.parcel.destinationLng || 31.2394;

    this.map = L.map(this.mapContainer.nativeElement).setView([pLat, pLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

    L.marker([pLat, pLng], {
      icon: L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-4 h-4 rounded-full bg-primary-green border-2 border-white shadow-md"></div>`
      })
    }).addTo(this.map).bindPopup(this.langService.currentLang() === 'ar' ? 'الاستلام' : 'Pickup');

    L.marker([dLat, dLng], {
      icon: L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-md"></div>`
      })
    }).addTo(this.map).bindPopup(this.langService.currentLang() === 'ar' ? 'التسليم' : 'Delivery');

    this.routePolyline = L.polyline([[pLat, pLng], [dLat, dLng]], {
      color: '#192A45',
      weight: 4,
      dashArray: '10, 10'
    }).addTo(this.map);
    this.map.fitBounds(this.routePolyline.getBounds(), { padding: [50, 50] });
  }

  updateCarrierMarker(lat: number, lng: number): void {
    if (!this.map) return;
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-10 h-10 rounded-full bg-primary-dark text-white flex items-center justify-center shadow-xl border-2 border-white animate-bounce-slow">
               <i class="bi bi-truck text-lg"></i>
             </div>`
    });

    if (this.carrierMarker) {
      this.carrierMarker.setLatLng([lat, lng]);
    } else {
      this.carrierMarker = L.marker([lat, lng], { icon }).addTo(this.map);
    }
  }

  destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  getStatusText(status: string): string {
    const ar: any = { 'pending': 'معلق', 'picked_up': 'تم الاستلام', 'delivered': 'تم التسليم' };
    const en: any = { 'pending': 'Pending', 'picked_up': 'Picked Up', 'delivered': 'Delivered' };
    return this.langService.currentLang() === 'ar' ? ar[status] || status : en[status] || status;
  }

  formatCurrency(value: number): string {
    return this.langService.currentLang() === 'ar' ? `${value} ج.م` : `${value} EGP`;
  }
}
