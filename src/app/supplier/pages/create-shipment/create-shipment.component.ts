import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupplierDataService, CreateParcelDTO, DeliveryFeeResponse, SupplierProfile } from '../../services/supplier-data.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-create-shipment',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-shipment.component.html',
  styleUrl: './create-shipment.component.css'
})
export class CreateShipmentComponent implements OnInit, AfterViewInit {
  shipmentForm!: FormGroup;
  profile: SupplierProfile | null = null;
  deliveryFee: DeliveryFeeResponse | null = null;
  
  isLoading = false;
  isCalculatingFee = false;
  isSubmitting = false;
  showSuccessModal = false;
  createdTrackingNumber = '';
  
  // Form step tracking
  currentStep = 1;
  totalSteps = 3;

  // Leaflet Map
  private map: L.Map | undefined;
  private marker: L.Marker | undefined;
  deliveryLat: number | null = null;
  deliveryLng: number | null = null;

  constructor(
    private fb: FormBuilder,
    private dataService: SupplierDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadProfile();
  }

  ngAfterViewInit(): void {
    // Initialize map if we start at step 1
    if (this.currentStep === 1) {
      setTimeout(() => {
        this.initMap();
      }, 100); // Small delay to ensure DOM is ready
    }
  }

  private initMap(): void {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Default center (Cairo)
    const defaultLat = 30.0444;
    const defaultLng = 31.2357;

    this.map = L.map('map').setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

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
      // Update the form control with a string representation
      // This satisfies the 'required' validator
      this.shipmentForm.patchValue({
        deliveryAddress: `${this.deliveryLat.toFixed(6)},${this.deliveryLng.toFixed(6)}`
      });
      this.shipmentForm.get('deliveryAddress')?.markAsTouched();
    }
  }

  initForm(): void {
    this.shipmentForm = this.fb.group({
      // Step 1: Addresses
      pickupAddress: ['', Validators.required],
      deliveryAddress: ['', Validators.required],
      
      // Step 2: Receiver Info
      receiverName: ['', [Validators.required, Validators.minLength(3)]],
      receiverPhone: ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
      receiverEmail: ['', Validators.email],
      
      // Step 3: Package Details
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
        // Auto-fill pickup address from profile
        this.shipmentForm.patchValue({
          pickupAddress: profile.address
        });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  // Step Navigation
  nextStep(): void {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        
        // Calculate fee when moving to step 3
        if (this.currentStep === 3) {
          this.calculateDeliveryFee();
        }
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      
      // Re-initialize map if going back to step 1
      if (this.currentStep === 1) {
        setTimeout(() => {
          this.initMap();
          // Restore marker if exists
          if (this.deliveryLat && this.deliveryLng) {
            this.updateMarker(this.deliveryLat, this.deliveryLng);
          }
        }, 100);
      }
    }
  }

  goToStep(step: number): void {
    // Only allow going back or to completed steps
    if (step < this.currentStep) {
      this.currentStep = step;
    }
  }

  validateCurrentStep(): boolean {
    const controls = this.shipmentForm.controls;
    
    switch (this.currentStep) {
      case 1:
        return controls['pickupAddress'].valid && controls['deliveryAddress'].valid;
      case 2:
        return controls['receiverName'].valid && controls['receiverPhone'].valid;
      case 3:
        return controls['description'].valid && controls['weight'].valid;
      default:
        return true;
    }
  }

  isStepValid(step: number): boolean {
    const controls = this.shipmentForm.controls;
    
    switch (step) {
      case 1:
        return controls['pickupAddress'].valid && controls['deliveryAddress'].valid;
      case 2:
        return controls['receiverName'].valid && controls['receiverPhone'].valid;
      case 3:
        return controls['description'].valid && controls['weight'].valid;
      default:
        return false;
    }
  }

  // Fee Calculation
  calculateDeliveryFee(): void {
    const formValue = this.shipmentForm.value;
    
    if (!formValue.pickupAddress || !formValue.deliveryAddress) {
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
      }
    });
  }

  onPriorityChange(): void {
    if (this.currentStep === 3) {
      this.calculateDeliveryFee();
    }
  }

  onWeightChange(): void {
    if (this.currentStep === 3) {
      this.calculateDeliveryFee();
    }
  }

  // Form Submission
  onSubmit(): void {
    if (this.shipmentForm.invalid) {
      this.markAllAsTouched();
      return;
    }
    
    this.isSubmitting = true;
    
    const formValue = this.shipmentForm.value;
    const dto: CreateParcelDTO = {
      description: formValue.description,
      weight: formValue.weight,
      dimensions: formValue.dimensions,
      pickupAddress: formValue.pickupAddress,
      deliveryAddress: formValue.deliveryAddress,
      receiverName: formValue.receiverName,
      receiverPhone: formValue.receiverPhone,
      receiverEmail: formValue.receiverEmail,
      notes: formValue.notes,
      isFragile: formValue.isFragile,
      requiresSignature: formValue.requiresSignature,
      codAmount: formValue.codAmount,
      priority: formValue.priority
    };
    
    this.dataService.createParcel(dto).subscribe({
      next: (parcel) => {
        this.isSubmitting = false;
        this.createdTrackingNumber = parcel.trackingNumber;
        this.showSuccessModal = true;
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error creating shipment:', err);
        // Show error message
      }
    });
  }

  markAllAsTouched(): void {
    Object.keys(this.shipmentForm.controls).forEach(key => {
      this.shipmentForm.controls[key].markAsTouched();
    });
  }

  // Success Modal Actions
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
    this.currentStep = 1;
    this.deliveryFee = null;
    this.deliveryLat = null;
    this.deliveryLng = null;
    this.marker = undefined;
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
    // Re-init map for new order
    setTimeout(() => {
        this.initMap();
    }, 100);
  }

  goToShipments(): void {
    this.router.navigate(['/supplier/shipments']);
  }

  trackShipment(): void {
    this.router.navigate(['/supplier/track'], { 
      queryParams: { id: this.createdTrackingNumber } 
    });
  }

  // Helper Methods
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
