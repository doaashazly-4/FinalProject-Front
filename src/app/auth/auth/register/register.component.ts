import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { SupplierRegisterDTO, CourierRegisterDTO } from '../../../models/user.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  selectedRole: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Data for dropdowns - matching backend enums
  vehicleTypes = ['Motorcycle', 'Car', 'Truck', 'Van'];
  genders = ['Male', 'Female', 'Other'];

  // Password visibility
  hidePassword = true;
  hideConfirmPassword = true;

  // File uploads for Courier
  photoFile: File | null = null;
  licensePhotoFrontFile: File | null = null;
  licensePhotoBackFile: File | null = null;
  vehicleLicensePhotoFrontFile: File | null = null;
  vehicleLicensePhotoBackFile: File | null = null;

  // Preview URLs
  photoPreview: string | null = null;
  licensePhotoFrontPreview: string | null = null;
  licensePhotoBackPreview: string | null = null;
  vehicleLicensePhotoFrontPreview: string | null = null;
  vehicleLicensePhotoBackPreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.registerForm = this.createForm();
  }

  ngOnInit(): void {
    const roleParam = this.route.snapshot.queryParamMap.get('role');
    if (roleParam && (roleParam.toLowerCase() === 'supplier' || roleParam.toLowerCase() === 'courier')) {
      this.selectedRole = roleParam.charAt(0).toUpperCase() + roleParam.slice(1).toLowerCase();
    } else {
      this.selectedRole = 'Supplier';
    }
    this.updateFormForRole();
  }

  selectRole(role: string): void {
    this.selectedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    this.updateFormForRole();
  }

  createForm(): FormGroup {
    return this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      agreeTerms: [false, [Validators.requiredTrue]],
      address: [''],
      phoneNumber: [''],
      birthDate: [''],
      gender: [''],
      shopName: [''],
      vehicleType: [''],
      licenseNumber: [''],
      maxWeight: [''],
      status: ['Available']
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  updateFormForRole(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      if (key !== 'agreeTerms') control?.clearValidators();
    });

    ['userName', 'email', 'password', 'confirmPassword'].forEach(field => {
      this.registerForm.get(field)?.setValidators([Validators.required]);
    });
    this.registerForm.get('email')?.setValidators([Validators.required, Validators.email]);
    this.registerForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);

    switch (this.selectedRole) {
      case 'Supplier':
        ['address', 'birthDate', 'gender', 'shopName'].forEach(field => {
          this.registerForm.get(field)?.setValidators([Validators.required]);
        });
        break;
      case 'Courier':
        ['address', 'birthDate', 'gender', 'vehicleType', 'licenseNumber', 'maxWeight']
          .forEach(field => {
            this.registerForm.get(field)?.setValidators([Validators.required]);
          });
        break;
    }

    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.updateValueAndValidity();
    });

    this.registerForm.reset();
    this.registerForm.get('agreeTerms')?.setValue(false);
    this.registerForm.get('status')?.setValue('Available');

    this.resetFileUploads();
    this.errorMessage = '';
    this.successMessage = '';
  }

  resetFileUploads(): void {
    this.photoFile = null;
    this.licensePhotoFrontFile = null;
    this.licensePhotoBackFile = null;
    this.vehicleLicensePhotoFrontFile = null;
    this.vehicleLicensePhotoBackFile = null;
    this.photoPreview = null;
    this.licensePhotoFrontPreview = null;
    this.licensePhotoBackPreview = null;
    this.vehicleLicensePhotoFrontPreview = null;
    this.vehicleLicensePhotoBackPreview = null;
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.photoFile = file;
      this.photoPreview = URL.createObjectURL(file);
    }
  }

  onLicensePhotoFrontSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.licensePhotoFrontFile = file;
      this.licensePhotoFrontPreview = URL.createObjectURL(file);
    }
  }

  onLicensePhotoBackSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.licensePhotoBackFile = file;
      this.licensePhotoBackPreview = URL.createObjectURL(file);
    }
  }

  onVehicleLicensePhotoFrontSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.vehicleLicensePhotoFrontFile = file;
      this.vehicleLicensePhotoFrontPreview = URL.createObjectURL(file);
    }
  }

  onVehicleLicensePhotoBackSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.vehicleLicensePhotoBackFile = file;
      this.vehicleLicensePhotoBackPreview = URL.createObjectURL(file);
    }
  }

  removePhoto(type: string): void {
    switch (type) {
      case 'photo': this.photoFile = null; this.photoPreview = null; break;
      case 'licenseFront': this.licensePhotoFrontFile = null; this.licensePhotoFrontPreview = null; break;
      case 'licenseBack': this.licensePhotoBackFile = null; this.licensePhotoBackPreview = null; break;
      case 'vehicleFront': this.vehicleLicensePhotoFrontFile = null; this.vehicleLicensePhotoFrontPreview = null; break;
      case 'vehicleBack': this.vehicleLicensePhotoBackFile = null; this.vehicleLicensePhotoBackPreview = null; break;
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.isLoading) {
      this.markFormAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

     console.log('Form Data Before Sending:', this.registerForm.value);
    
    const formValue = this.registerForm.value;
    switch (this.selectedRole) {
      case 'Supplier': this.registerSupplier(formValue); break;
      case 'Courier': this.registerCourier(formValue); break;
    }
  }

  private markFormAsTouched(): void {
    Object.values(this.registerForm.controls).forEach(control => control.markAsTouched());
  }

  registerSupplier(data: any): void {
  const supplierDTO: SupplierRegisterDTO = {
  userName: data.userName,
  email: data.email,
  password: data.password,
  address: data.address,
  birthDate: data.birthDate,
  gender: data.gender,
  shopName: data.shopName
};


    console.log('Supplier DTO:', supplierDTO);
 
    this.authService.registerSupplier(supplierDTO).subscribe({
      next: (response) => {
        console.log('Supplier registration success:', response);
        this.successMessage = 'تم إنشاء حساب المُرسل بنجاح!';
        this.isLoading = false;
        // Navigate immediately to supplier login/dashboard flow
        this.router.navigate(['/supplier/dashboard'], { queryParams: { role: 'supplier' } });
      },
      error: (error) => {
        console.error('Supplier registration failed:', error);
        this.errorMessage = typeof error === 'string' ? error : 'فشل في إنشاء الحساب';
        this.isLoading = false;
      }
    });
  }

  registerCourier(data: any): void {
    const hasFiles = this.photoFile || this.licensePhotoFrontFile || this.licensePhotoBackFile ||
                     this.vehicleLicensePhotoFrontFile || this.vehicleLicensePhotoBackFile;

    if (hasFiles) {
      const courierDTO: CourierRegisterDTO = {
        userName: data.userName,
        email: data.email,
        password: data.password,
        address: data.address,
        birthDate: data.birthDate,
        gender: data.gender,
        vehicleType: data.vehicleType,
        licenseNumber: data.licenseNumber,
        maxWeight: Number(data.maxWeight),
        status: 'Available',
        isAvailable: true,
        isOnline: false,
        rating: 0
      };
      const files = {
        photo: this.photoFile || undefined,
        licensePhotoFront: this.licensePhotoFrontFile || undefined,
        licensePhotoBack: this.licensePhotoBackFile || undefined,
        vehicleLicensePhotoFront: this.vehicleLicensePhotoFrontFile || undefined,
        vehicleLicensePhotoBack: this.vehicleLicensePhotoBackFile || undefined
      };

      this.authService.registerCourierWithFiles(courierDTO, files).subscribe({
        next: (response) => {
          console.log('Courier registration with files success:', response);
          this.successMessage = 'تم إنشاء حساب المندوب بنجاح! يرجى انتظار موافقة الإدارة.';
          this.isLoading = false;
          this.router.navigate(['/login'], { queryParams: { role: 'courier' } });
        },
        error: (error) => {
          console.error('Courier registration with files failed:', error);
          this.errorMessage = typeof error === 'string' ? error : 'فشل في إنشاء الحساب';
          this.isLoading = false;
        }
      });
    } else {
      const courierDTO: CourierRegisterDTO = {
        userName: data.userName,
        email: data.email,
        password: data.password,
        address: data.address,
        birthDate: data.birthDate,
        gender: data.gender,
        vehicleType: data.vehicleType,
        licenseNumber: data.licenseNumber,
        maxWeight: Number(data.maxWeight),
        status: 'Available',
        isAvailable: true,
        isOnline: false,
        rating: 0,
        photoUrl: undefined,
        licensePhotoFront: undefined,
        licensePhotoBack: undefined,
        vehcelLicensePhotoFront: undefined,
        vehcelLicensePhotoBack: undefined
      };

      this.authService.registerCourier(courierDTO).subscribe({
        next: (response) => {
          console.log('Courier registration success:', response);
          this.successMessage = 'تم إنشاء حساب المندوب بنجاح! يرجى انتظار موافقة الإدارة.';
          this.isLoading = false;
          this.router.navigate(['/login'], { queryParams: { role: 'courier' } });
        },
        error: (error) => {
          console.error('Courier registration failed:', error);
          this.errorMessage = typeof error === 'string' ? error : 'فشل في إنشاء الحساب';
          this.isLoading = false;
        }
      });
    }
  }

  goBack(): void { this.router.navigate(['/home']); }
  goToLogin(): void { this.router.navigate(['/login']); }
  togglePasswordVisibility(): void { this.hidePassword = !this.hidePassword; }
  toggleConfirmPasswordVisibility(): void { this.hideConfirmPassword = !this.hideConfirmPassword; }

  getRoleTitle(): string {
    if (!this.selectedRole) return '';
    return this.selectedRole.charAt(0).toUpperCase() + this.selectedRole.slice(1);
  }

  getRoleTitleArabic(): string {
    if (!this.selectedRole) return '';
    switch (this.selectedRole.toLowerCase()) {
      case 'supplier': return 'مُرسل';
      case 'courier': return 'مندوب توصيل';
      default: return this.selectedRole;
    }
  }

  getRoleClass(): string {
    return this.selectedRole ? this.selectedRole.toLowerCase() : '';
  }
}
