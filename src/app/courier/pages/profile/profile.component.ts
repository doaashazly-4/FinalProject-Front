import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourierDataService, CourierCompleteProfileDTO } from '../../services/courier-data.service';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-courier-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class CourierProfileComponent implements OnInit {
    private courierService = inject(CourierDataService);
    private fb = inject(FormBuilder);

    profile: CourierCompleteProfileDTO | null = null;
    profileForm: FormGroup;
    isEditing = false;
    isLoading = false;

    // Image previews
    photoPreview: string | null = null;
    licenseFrontPreview: string | null = null;
    licenseBackPreview: string | null = null;
    vehicleLicenseFrontPreview: string | null = null;
    vehicleLicenseBackPreview: string | null = null;
    idPhotoPreview: string | null = null;

    // Selected files
    selectedFiles: { [key: string]: File } = {};

    imageBaseUrl = environment.apiUrl.replace('/api', '');

    constructor() {
        this.profileForm = this.fb.group({
            phone: ['', Validators.required],
            address: ['', Validators.required],
            licenseNumber: ['', Validators.required],
            vehicleType: ['', Validators.required],
            isAvailable: [false],
            isOnline: [false]
        });
    }

    ngOnInit(): void {
        this.loadProfile();
    }

    loadProfile() {
        this.isLoading = true;
        this.courierService.getProfile().subscribe({
            next: (data) => {
                // Normalize keys (handle PascalCase if backend returns it)
                const raw: any = data;
                this.profile = {
                    ...data,
                    photoUrl: raw.photoUrl || raw.PhotoUrl,
                    licensePhotoFront: raw.licensePhotoFront || raw.LicensePhotoFront,
                    licensePhotoBack: raw.licensePhotoBack || raw.LicensePhotoBack,
                    vehicleLicensePhotoFront: raw.vehicleLicensePhotoFront || raw.VehicleLicensePhotoFront || raw.VehcelLicensePhotoFront, // Check for typo
                    vehicleLicensePhotoBack: raw.vehicleLicensePhotoBack || raw.VehicleLicensePhotoBack || raw.VehcelLicensePhotoBack,
                    idPhotoUrl: raw.idPhotoUrl || raw.IdPhotoUrl
                };

                console.log('Loaded Profile:', this.profile);
                this.initForm();
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Failed to load profile', err);
                this.isLoading = false;
            }
        });
    }

    initForm() {
        if (!this.profile) return;

        this.profileForm.patchValue({
            phone: this.profile.phone,
            address: this.profile.address,
            licenseNumber: this.profile.licenseNumber,
            vehicleType: this.profile.vehicleType,
            isAvailable: this.profile.isAvailable,
            isOnline: this.profile.isOnline
        });

        this.profileForm.disable(); // Start read-only
    }

    toggleEdit() {
        this.isEditing = !this.isEditing;
        if (this.isEditing) {
            this.profileForm.enable();
        } else {
            this.profileForm.disable();
        }
    }

    cancelEdit() {
        this.isEditing = false;
        this.initForm(); // Reset form
        this.selectedFiles = {};
        this.photoPreview = null;
        this.licenseFrontPreview = null;
        this.licenseBackPreview = null;
        this.vehicleLicenseFrontPreview = null;
        this.vehicleLicenseBackPreview = null;
        this.idPhotoPreview = null;
    }

    onFileSelected(event: Event, field: string) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            this.selectedFiles[field] = file;

            // Create preview
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                switch (field) {
                    case 'photo': this.photoPreview = result; break;
                    case 'licensePhotoFront': this.licenseFrontPreview = result; break;
                    case 'licensePhotoBack': this.licenseBackPreview = result; break;
                    case 'vehicleLicensePhotoFront': this.vehicleLicenseFrontPreview = result; break;
                    case 'vehicleLicensePhotoBack': this.vehicleLicenseBackPreview = result; break;
                    case 'idPhoto': this.idPhotoPreview = result; break;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    saveChanges() {
        if (this.profileForm.invalid) {
            console.error('Form is invalid', this.profileForm.errors);
            // Log individual control errors
            Object.keys(this.profileForm.controls).forEach(key => {
                const controlErrors = this.profileForm.get(key)?.errors;
                if (controlErrors) {
                    console.error(`Control: ${key}, Errors:`, controlErrors);
                }
            });
            return;
        }

        this.isLoading = true;
        const formData = new FormData();
        const formValues = this.profileForm.getRawValue();

        formData.append('Phone', formValues.phone);
        formData.append('Address', formValues.address);
        formData.append('LicenseNumber', formValues.licenseNumber);
        formData.append('VehicleType', formValues.vehicleType);
        formData.append('IsAvailable', String(formValues.isAvailable));
        formData.append('IsOnline', String(formValues.isOnline));

        // Append files
        if (this.selectedFiles['photo']) formData.append('Photo', this.selectedFiles['photo']);
        if (this.selectedFiles['licensePhotoFront']) formData.append('LicensePhotoFront', this.selectedFiles['licensePhotoFront']);
        if (this.selectedFiles['licensePhotoBack']) formData.append('LicensePhotoBack', this.selectedFiles['licensePhotoBack']);
        if (this.selectedFiles['vehicleLicensePhotoFront']) formData.append('VehicleLicensePhotoFront', this.selectedFiles['vehicleLicensePhotoFront']);
        if (this.selectedFiles['vehicleLicensePhotoBack']) formData.append('VehicleLicensePhotoBack', this.selectedFiles['vehicleLicensePhotoBack']);
        if (this.selectedFiles['idPhoto']) formData.append('IdPhoto', this.selectedFiles['idPhoto']);

        this.courierService.updateProfile(formData).subscribe({
            next: (res) => {
                console.log('Profile updated', res);
                this.isEditing = false;
                this.selectedFiles = {};

                // Clear previews to force display of server persistence
                this.photoPreview = null;
                this.licenseFrontPreview = null;
                this.licenseBackPreview = null;
                this.vehicleLicenseFrontPreview = null;
                this.vehicleLicenseBackPreview = null;
                this.idPhotoPreview = null;

                this.loadProfile();
            },
            error: (err) => {
                console.error('Update failed', err);
                this.isLoading = false;
            }
        });
    }

    getImageUrl(path: string | undefined): string {
        if (!path) return 'assets/placeholder-user.png';
        if (path.startsWith('http')) return path;

        // Ensure strictly one slash between base and path
        const baseUrl = this.imageBaseUrl.endsWith('/') ? this.imageBaseUrl.slice(0, -1) : this.imageBaseUrl;
        const relativePath = path.startsWith('/') ? path : `/${path}`;

        return `${baseUrl}${relativePath}`;
    }

    handleImageError(event: any) {
        // Prevent infinite loop if placeholder fails
        if (event.target.src.includes('assets/placeholder-user.png')) return;
        event.target.src = 'assets/placeholder-user.png';
    }

    getVehicleTypeLabel(type: string | undefined): string {
        switch (type) {
            case 'Car': return 'سيارة';
            case 'Bike': return 'دراجة نارية';
            case 'Van': return 'شاحنة صغيرة (Van)';
            case 'Scooter': return 'سكوتر';
            default: return type || '';
        }
    }
}
