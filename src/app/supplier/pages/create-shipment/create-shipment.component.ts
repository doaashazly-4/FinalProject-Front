import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { SupplierDataService, CreateParcelDTO, DeliveryFeeResponse, SupplierProfile, CreateRequestDTO, Customer } from '../../services/supplier-data.service';
import * as L from 'leaflet';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Subscription, of, Subject } from 'rxjs';

@Component({
  selector: 'app-create-shipment',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './create-shipment.component.html',
  styleUrl: './create-shipment.component.css'
})
export class CreateShipmentComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  shipmentForm!: FormGroup;
  profile: SupplierProfile | null = null;
  deliveryFee: { baseFee: number, distanceFee: number, weightFee: number, priorityFee: number, totalFee: number, estimatedDistance: number, estimatedDuration: string } | null = null;

  isLoading = false;
  isCalculatingFee = false;
  isSubmitting = false;
  showSuccessModal = false;
  createdTrackingNumber = '';
  createdId = '';
  statusMessage = '';

  // Map State
  activeField: 'pickup' | 'delivery' = 'pickup'; // Default active field
  private map: L.Map | undefined;
  private pickupMarker: L.Marker | undefined;
  private deliveryMarker: L.Marker | undefined;
  private routeLine: L.Polyline | undefined;

  pickupLat: number | null = null;
  pickupLng: number | null = null;
  deliveryLat: number | null = null;
  deliveryLng: number | null = null;

  debugTools = {
    testBackend: () => {
      this.statusMessage = 'جاري اختبار الاتصال...';
      this.dataService.getCustomers().subscribe({
        next: (res) => this.statusMessage = `نجح الاتصال! تم جلب ${res.length} عملاء.`,
        error: (err) => this.statusMessage = `فشل الاتصال: ${err.message}`
      });
    },
    validateData: () => {
      if (this.shipmentForm.valid) this.statusMessage = 'البيانات صالحة ✅';
      else this.statusMessage = 'البيانات غير مكتملة ❌';
    },
    showLogs: () => {
      console.log('Form Value:', this.shipmentForm.value);
      this.statusMessage = 'تم عرض السجلات في Console';
    }
  };

  // Customers
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  showDropdown = false;

  private subscriptions: Subscription = new Subscription();
  // private addressSearchSubject = new Subject<{ query: string, type: 'pickup' | 'delivery' }>(); // Unused?

  constructor(
    private fb: FormBuilder,
    private dataService: SupplierDataService,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.fixLeafletIcons();
    this.loadProfile();
    this.setupFeeCalculationTriggers();

    this.dataService.getCustomers().subscribe({
      next: (customers) => this.customers = customers,
      error: (error) => console.error('Error fetching customers:', error)
    });

    this.setupPhoneAutocomplete();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
    this.subscriptions.unsubscribe();
  }

  private fixLeafletIcons(): void {
    const iconRetinaUrl = 'assets/Images/marker-icon.svg';
    const iconUrl = 'assets/Images/marker-icon.svg';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;
  }

  private initMap(): void {
    if (!this.mapContainer) return;

    if (this.map) {
      this.map.remove();
    }

    const defaultLat = 30.0444;
    const defaultLng = 31.2357;

    this.map = L.map(this.mapContainer.nativeElement).setView([defaultLat, defaultLng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.handleMapClick(e.latlng.lat, e.latlng.lng);
    });

    // Initial Markers if exists
    if (this.pickupLat && this.pickupLng) this.updateMapVisuals();
    if (this.deliveryLat && this.deliveryLng) this.updateMapVisuals();

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 200);
  }

  setActiveField(field: 'pickup' | 'delivery'): void {
    this.activeField = field;
    this.statusMessage = field === 'pickup' ? 'حدد موقع الاستلام على الخريطة' : 'حدد موقع التسليم على الخريطة';
  }

  handleMapClick(lat: number, lng: number): void {
    if (this.activeField === 'pickup') {
      this.pickupLat = lat;
      this.pickupLng = lng;
      this.reverseGeocode(lat, lng, 'pickup');
    } else {
      this.deliveryLat = lat;
      this.deliveryLng = lng;
      this.reverseGeocode(lat, lng, 'delivery');
    }

    this.updateMapVisuals();
    this.localCalculateFee();
  }

  updateMapVisuals(): void {
    if (!this.map) return;

    if (this.pickupMarker) this.map.removeLayer(this.pickupMarker);
    if (this.deliveryMarker) this.map.removeLayer(this.deliveryMarker);
    if (this.routeLine) this.map.removeLayer(this.routeLine);

    const bounds = L.latLngBounds([]);

    // Pickup Marker (Green)
    if (this.pickupLat && this.pickupLng) {
      const pickupIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      this.pickupMarker = L.marker([this.pickupLat, this.pickupLng], { icon: pickupIcon, draggable: true })
        .bindPopup('موقع الاستلام')
        .addTo(this.map);

      this.pickupMarker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        this.pickupLat = pos.lat;
        this.pickupLng = pos.lng;
        this.localCalculateFee();
      });

      bounds.extend([this.pickupLat, this.pickupLng]);
    }

    // Delivery Marker (Red)
    if (this.deliveryLat && this.deliveryLng) {
      const deliveryIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      this.deliveryMarker = L.marker([this.deliveryLat, this.deliveryLng], { icon: deliveryIcon, draggable: true })
        .bindPopup('موقع التسليم')
        .addTo(this.map);

      this.deliveryMarker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        this.deliveryLat = pos.lat;
        this.deliveryLng = pos.lng;
        this.localCalculateFee();
      });

      bounds.extend([this.deliveryLat, this.deliveryLng]);
    }

    // Draw Route
    if (this.pickupLat && this.pickupLng && this.deliveryLat && this.deliveryLng) {
      this.fetchRouteAndDraw(this.pickupLat, this.pickupLng, this.deliveryLat, this.deliveryLng);
    }

    // Fit bounds only if we have points and not just initialized
    if ((this.pickupLat || this.deliveryLat) && bounds.isValid()) {
      // this.map.fitBounds(bounds, { padding: [50, 50] }); // Optional auto-fit
    }
  }

  fetchRouteAndDraw(lat1: number, lng1: number, lat2: number, lng2: number): void {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;

    this.http.get(osrmUrl).subscribe({
      next: (res: any) => {
        if (res.routes && res.routes.length > 0) {
          const coordinates = res.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);

          if (this.routeLine) this.map?.removeLayer(this.routeLine);

          this.routeLine = L.polyline(coordinates, { color: 'blue', weight: 4, opacity: 0.7 }).addTo(this.map!);

          const distanceMeters = res.routes[0].distance;
          this.updateFeeWithDistance(distanceMeters / 1000);

          // Fit bounds to route
          if (this.map) this.map.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
        }
      },
      error: (err) => {
        console.error('OSRM Routing failed', err);
        if (this.routeLine) this.map?.removeLayer(this.routeLine);
        this.routeLine = L.polyline([[lat1, lng1], [lat2, lng2]], { color: 'blue', weight: 4, dashArray: '10, 10' }).addTo(this.map!);
        this.localCalculateFee();
      }
    });
  }

  // triggered by (blur) or Enter on input
  geocodeAddress(query: string, type: 'pickup' | 'delivery'): void {
    if (!query || query.length < 3) return;

    this.isLoading = true;
    this.http.get<any[]>(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
      .subscribe({
        next: (results) => {
          this.isLoading = false;
          if (results && results.length > 0) {
            const lat = parseFloat(results[0].lat);
            const lng = parseFloat(results[0].lon);

            if (type === 'pickup') {
              this.pickupLat = lat;
              this.pickupLng = lng;
              this.map?.setView([lat, lng], 14);
            } else {
              this.deliveryLat = lat;
              this.deliveryLng = lng;
              this.map?.setView([lat, lng], 14);
            }
            this.updateMapVisuals();
            this.localCalculateFee();
          }
        },
        error: () => this.isLoading = false
      });
  }

  reverseGeocode(lat: number, lng: number, type: 'pickup' | 'delivery'): void {
    this.http.get<any>(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .subscribe(res => {
        if (res && res.display_name) {
          this.shipmentForm.patchValue({
            [type === 'pickup' ? 'pickupAddress' : 'deliveryAddress']: res.display_name
          });
        }
      });
  }

  setupFeeCalculationTriggers(): void {
    this.shipmentForm.get('weight')?.valueChanges.subscribe(() => this.localCalculateFee());
    this.shipmentForm.get('priority')?.valueChanges.subscribe(() => this.localCalculateFee());
  }

  localCalculateFee(): void {
    if (!this.pickupLat || !this.pickupLng || !this.deliveryLat || !this.deliveryLng) {
      this.deliveryFee = null;
      return;
    }

    // Fallback calc if OSRM hasn't run yet
    const dist = this.getDistanceFromLatLonInKm(this.pickupLat, this.pickupLng, this.deliveryLat, this.deliveryLng);
    this.updateFeeWithDistance(dist);
  }

  updateFeeWithDistance(distanceKm: number): void {
    const weight = this.shipmentForm.get('weight')?.value || 1;
    const priority = this.shipmentForm.get('priority')?.value;

    // 20 currency units for the first 10 km
    // +1 currency unit for every 3 km beyond the first 10 km.
    const baseFare = 20;
    let distanceCost = 0;

    if (distanceKm > 10) {
      const excess = distanceKm - 10;
      distanceCost = Math.ceil(excess / 3) * 1;
    }

    const priorityFee = priority === 'urgent' ? 20 : 0;

    const total = baseFare + distanceCost + priorityFee;

    this.deliveryFee = {
      baseFee: baseFare,
      distanceFee: distanceCost,
      weightFee: 0,
      priorityFee: priorityFee,
      totalFee: total,
      estimatedDistance: parseFloat(distanceKm.toFixed(2)),
      estimatedDuration: `${Math.round(distanceKm * 2)} دقيقة` // Estimate 2 min per km driving?
    };
  }

  getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  initForm(): void {
    this.shipmentForm = this.fb.group({
      pickupAddress: ['', Validators.required],
      deliveryAddress: ['', Validators.required],
      receiverName: ['', [Validators.required, Validators.minLength(3)]],
      receiverPhone: ['', [Validators.required, Validators.pattern(/^(01|05)[0-9]{8,9}$/)]],
      receiverEmail: ['', Validators.email],
      customerID: [''],
      expireDate: [new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()],
      description: ['', [Validators.required, Validators.minLength(3)]],
      weight: [1, [Validators.required, Validators.min(0.1), Validators.max(100)]],
      dimensions: [''],
      codAmount: [0, [Validators.required, Validators.min(0)]],
      priority: ['normal', Validators.required],
      notes: [''],
      isFragile: [false],
      requiresSignature: [false]
    });
  }

  setupPhoneAutocomplete(): void {
    this.shipmentForm.get('receiverPhone')?.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(value => {
        if (!value) {
          this.filteredCustomers = [];
          this.showDropdown = false;
          return;
        }
        const filterValue = value.toLowerCase();
        this.filteredCustomers = this.customers.filter(customer =>
          customer.phoneNumber.includes(filterValue)
        );
        this.showDropdown = this.filteredCustomers.length > 0;
      });
  }

  selectCustomer(customer: Customer): void {
    this.shipmentForm.patchValue({
      receiverName: customer.name || '',
      receiverPhone: customer.phoneNumber,
      customerID: customer.id
    });
    this.showDropdown = false;
    this.filteredCustomers = [];
  }

  loadProfile(): void {
    this.isLoading = true;
    this.dataService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        if (!this.shipmentForm.get('pickupAddress')?.value && profile.address) {
          this.shipmentForm.patchValue({ pickupAddress: profile.address });
          // Optional: Geocode the profile address
          this.geocodeAddress(profile.address, 'pickup');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.warn('Could not load profile:', error);
        this.isLoading = false;
      }
    });
  }

  calculateDeliveryFee(): void {
    this.localCalculateFee();
  }

  onSubmit(): void {
    if (this.shipmentForm.invalid) {
      this.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const formValue = this.shipmentForm.value;
    const dto: CreateRequestDTO = {
      source: formValue.pickupAddress,
      priority: formValue.priority,
      pickupLat: this.pickupLat ?? 0,
      pickupLng: this.pickupLng ?? 0,
      packages: [
        {
          description: formValue.description,
          weight: formValue.weight,
          fragile: formValue.isFragile,
          shipmentCost: formValue.codAmount,
          destination: formValue.deliveryAddress,
          lat: this.deliveryLat || 0,
          lng: this.deliveryLng || 0,
          expireDate: formValue.expireDate,
          notes: formValue.notes,
          customerID: formValue.customerID ? Number(formValue.customerID) : 0
        }
      ]
    };

    console.log('Sending DTO:', dto);

    this.dataService.createParcelSafe(dto).subscribe({
      next: (parcel) => {
        this.isSubmitting = false;
        this.createdTrackingNumber = parcel.trackingNumber;
        this.createdId = parcel.id || parcel.trackingNumber; // Fallback if ID not returned
        this.showSuccessModal = true;
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error creating shipment:', err);
      }
    });
  }

  markAllAsTouched(): void {
    Object.keys(this.shipmentForm.controls).forEach(key => {
      this.shipmentForm.controls[key].markAsTouched();
    });
  }

  createAnother(): void {
    this.showSuccessModal = false;
    this.shipmentForm.reset({
      pickupAddress: this.profile?.address || '',
      priority: 'normal',
      weight: 1,
      codAmount: 0,
      isFragile: false,
      requiresSignature: false,
      customerID: '',
      expireDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    this.deliveryFee = null;
    this.deliveryLat = null;
    this.deliveryLng = null;
    this.pickupLat = null;
    this.pickupLng = null;
    this.deliveryMarker = undefined;
    this.pickupMarker = undefined;
    this.routeLine = undefined;

    this.filteredCustomers = [];
    this.showDropdown = false;
    this.activeField = 'pickup';

    if (this.map) {
      this.map.eachLayer((layer) => {
        // Clear markers and lines logic
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          this.map?.removeLayer(layer);
        }
      });
      // Re-add tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);
    }
  }

  trackShipment(): void {
    this.router.navigate(['/supplier/shipments', this.createdId]);
  }

  hasError(controlName: string): boolean {
    const control = this.shipmentForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(controlName: string): string {
    const control = this.shipmentForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'هذا الحقل مطلوب';
    if (control.errors['minlength']) return `يجب أن يحتوي على ${control.errors['minlength'].requiredLength} أحرف على الأقل`;
    if (control.errors['pattern']) return 'صيغة غير صحيحة';
    if (control.errors['email']) return 'بريد إلكتروني غير صالح';
    if (control.errors['min']) return `القيمة أقل من الحد المسموح (${control.errors['min'].min})`;

    return 'خطأ في الحقل';
  }
}
