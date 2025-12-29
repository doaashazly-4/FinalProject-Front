import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupplierDataService, CreateParcelDTO, DeliveryFeeResponse, SupplierProfile, CreateRequestDTO } from '../../services/supplier-data.service';
import * as L from 'leaflet';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-create-shipment',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-shipment.component.html',
  styleUrl: './create-shipment.component.css'
})
export class CreateShipmentComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  shipmentForm!: FormGroup;
  profile: SupplierProfile | null = null;
  deliveryFee: DeliveryFeeResponse | null = null;

  isLoading = false;
  isCalculatingFee = false;
  isSubmitting = false;
  showSuccessModal = false;
  createdTrackingNumber = '';

  // Leaflet Map
  private map: L.Map | undefined;
  private marker: L.Marker | undefined;
  deliveryLat: number | null = null;
  deliveryLng: number | null = null;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private dataService: SupplierDataService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.fixLeafletIcons();
    this.loadProfile();
    this.setupFeeCalculationTriggers();

   // Get customers
    this.dataService.getCustomers().subscribe({
      next: (customers) => {
        console.log(customers);
      },
      error: (error) => {
        console.error('Error fetching customers:', error);
      }
    });
  }

  ngAfterViewInit(): void {
    // Initialize map once view is ready
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
    // const shadowUrl = 'assets/Images/marker-icon.svg';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      // shadowUrl,
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

    // Check if map is already initialized
    if (this.map) {
      this.map.remove();
    }

    // Default center (Cairo)
    const defaultLat = 30.0444;
    const defaultLng = 31.2357;

    this.map = L.map(this.mapContainer.nativeElement).setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // If we have saved coordinates, restore the marker
    if (this.deliveryLat && this.deliveryLng) {
      this.updateMarker(this.deliveryLat, this.deliveryLng);
    }

    // Click handler
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.updateMarker(e.latlng.lat, e.latlng.lng);
    });

    // Fix for map resizing issues
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 200);
  }

  private updateMarker(lat: number, lng: number): void {
    this.deliveryLat = lat;
    this.deliveryLng = lng;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      if (this.map) {
        this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);

        // Handle drag end
        this.marker.on('dragend', () => {
          const position = this.marker!.getLatLng();
          this.deliveryLat = position.lat;
          this.deliveryLng = position.lng;
          this.updateFormCoordinates();
        });
      }
    }

    this.updateFormCoordinates();
  }

  private updateFormCoordinates(): void {
    if (this.deliveryLat && this.deliveryLng) {
      this.shipmentForm.patchValue({
        deliveryAddress: `${this.deliveryLat.toFixed(6)},${this.deliveryLng.toFixed(6)}`
      });
      this.shipmentForm.get('deliveryAddress')?.markAsTouched();
    }
  }

  initForm(): void {
    this.shipmentForm = this.fb.group({
      // Addresses
      pickupAddress: ['', Validators.required],
      deliveryAddress: ['', Validators.required],

      // Receiver Info
      receiverName: ['', [Validators.required, Validators.minLength(3)]],
      receiverPhone: ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
      receiverEmail: ['', Validators.email],

      // Package Details
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

  loadProfile(): void {
    this.isLoading = true;
    this.dataService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        // Auto-fill pickup address from profile if empty
        if (!this.shipmentForm.get('pickupAddress')?.value) {
          this.shipmentForm.patchValue({
            pickupAddress: profile.address
          });
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  setupFeeCalculationTriggers(): void {
    // Watch for changes in weight, priority, and deliveryAddress
    const weightSub = this.shipmentForm.get('weight')?.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => this.calculateDeliveryFee());

    const prioritySub = this.shipmentForm.get('priority')?.valueChanges
      .subscribe(() => this.calculateDeliveryFee());

    // Even though deliveryAddress is updated programmatically, valueChanges *should* fire when we patchValue.
    // However, patchValue often has emitEvent: true by default.
    const addressSub = this.shipmentForm.get('deliveryAddress')?.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => this.calculateDeliveryFee());

    this.subscriptions.add(weightSub);
    this.subscriptions.add(prioritySub);
    this.subscriptions.add(addressSub);
  }

  calculateDeliveryFee(): void {
    const formValue = this.shipmentForm.value;

    if (!formValue.pickupAddress || !formValue.deliveryAddress || !formValue.weight) {
      return;
    }

    this.isCalculatingFee = true;

    this.dataService.calculateDeliveryFee({
      pickupAddress: formValue.pickupAddress,
      deliveryAddress: formValue.deliveryAddress,
      weight: formValue.weight,
      priority: formValue.priority
    }).subscribe({
      next: (fee) => {
        this.deliveryFee = fee;
        this.isCalculatingFee = false;
      },
      error: () => {
        this.isCalculatingFee = false;
        // Optional: Reset fee or show error
        this.deliveryFee = null;
      }
    });
  }

  onSubmit(): void {
    console.log('Submit clicked');
    if (this.shipmentForm.invalid) {
      this.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const formValue = this.shipmentForm.value;
    const dto: CreateRequestDTO = {
      source: formValue.pickupAddress,
      priority: formValue.priority,
      pickupLat: this.deliveryLat,
      pickupLng: this.deliveryLng,
      packages: [
        {
          description: formValue.description,
          weight: formValue.weight,
          fragile: formValue.isFragile,
          shipmentCost: formValue.codAmount,
          destination: formValue.deliveryAddress,
          lat: 0,
          lng: 0,
          expireDate: formValue.expireDate,
          notes: formValue.notes,
          customerID: formValue.customerID
        }
      ]
    };

    console.log('Sending DTO:', dto);

    this.dataService.createParcel(dto).subscribe({
      next: (parcel) => {
        this.isSubmitting = false;
        this.createdTrackingNumber = parcel.trackingNumber;
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
      requiresSignature: false
    });

    this.deliveryFee = null;
    this.deliveryLat = null;
    this.deliveryLng = null;
    this.marker = undefined;

    // Clear map marker
    if (this.map) {
      this.map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          this.map!.removeLayer(layer);
        }
      });
      // Re-center map to default
      this.map.setView([30.0444, 31.2357], 13);
    }
  }

  goToShipments(): void {
    this.router.navigate(['/supplier/shipments']);
  }

  trackShipment(): void {
    this.router.navigate(['/supplier/track'], {
      queryParams: { id: this.createdTrackingNumber }
    });
  }

  hasError(field: string): boolean {
    const control = this.shipmentForm.get(field);
    return control ? control.invalid && control.touched : false;
  }

  getErrorMessage(field: string): string {
    const control = this.shipmentForm.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'هذا الحقل مطلوب';
    if (control.errors['minlength']) return `الحد الأدنى ${control.errors['minlength'].requiredLength} أحرف`;
    if (control.errors['pattern']) return 'صيغة غير صحيحة';
    if (control.errors['email']) return 'بريد إلكتروني غير صحيح';
    if (control.errors['min']) return `القيمة الدنيا ${control.errors['min'].min}`;
    if (control.errors['max']) return `القيمة القصوى ${control.errors['max'].max}`;

    return 'خطأ في الإدخال';
  }
}
