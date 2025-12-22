import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  SupplierRegisterDTO, 
  CourierRegisterDTO,
  AdminRegisterDTO,
  UserLoginDTO,
  LoginResponse,
  ApiResponse
} from '../../models/user.models';

// ========== EXPORT USER ROLE ==========
export type UserRole = 'customer' | 'supplier' | 'courier' | 'admin' | null;

// Client Login DTO (mobile number only)
export interface ClientLoginDTO {
  mobileNumber: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'pickgo_role';
  private readonly TOKEN_KEY = 'pickgo_token';
  private roleSignal = signal<UserRole>(this.readFromStorage());
  
  // API base - call backend directly
  private apiUrl = 'https://localhost:7180/api/Auth';

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  // ========== DEV MODE - For testing without backend ==========
  /**
   * Set role directly for development/testing purposes
   * Usage: Call this from browser console or component for testing
   * Example: authService.devSetRole('admin')
   */
  devSetRole(role: UserRole): void {
    if (role) {
      localStorage.setItem(this.TOKEN_KEY, 'dev-test-token');
      localStorage.setItem(this.STORAGE_KEY, role);
      localStorage.setItem('user_id', 'dev-user-id');
      localStorage.setItem('user_name', role === 'admin' ? 'مدير النظام' : 'مستخدم تجريبي');
      localStorage.setItem('user_email', `${role}@test.com`);
      localStorage.setItem('token_expiration', new Date(Date.now() + 24*60*60*1000).toISOString());
      this.roleSignal.set(role);
      console.log(`✅ Dev mode: Role set to "${role}". Refresh or navigate to /${role}`);
    }
  }

  // ========== COMPUTED SIGNALS ==========
  role = computed(() => this.roleSignal());
  isAuthenticated = computed(() => !!this.roleSignal());

  // ========== REGISTRATION METHODS ==========

  /**
   * Register a new Supplier
   * Properties stored:
   * - userName, email, password, birthDate, gender (User table)
   * - shopName, address, isDeleted=false (Supplier table)
   */
  registerSupplier(dto: SupplierRegisterDTO): Observable<ApiResponse> {
    // Ensure birthDate is YYYY-MM-DD if an ISO string was provided
    const birthDate = dto.birthDate
      ? (typeof dto.birthDate === 'string' && dto.birthDate.includes('T') ? dto.birthDate.split('T')[0] : dto.birthDate)
      : undefined;

    const supplierData: any = {
      userName: dto.userName,
      email: dto.email,
      password: dto.password,
      shopName: dto.shopName,
      address: dto.address,
      birthDate: birthDate,
      gender: dto.gender
    };
    
    console.log('Registering Supplier with data:', supplierData);
    return this.http.post<ApiResponse>(`${this.apiUrl}/Register/Supplier`, supplierData)
      .pipe(
        tap(response => console.log('Supplier registration response:', response)),
        catchError(error => this.handleRegistrationError(error, 'Supplier'))
      );
  }

  /**
   * Register a new Courier
   * Properties stored:
   * - userName, email, password, birthDate, gender (User table)
   * - vehicleType, licenseNumber, maxWeight, status, isAvailable, isOnline, rating (Courier table)
   * - photoUrl, licensePhotoFront, licensePhotoBack, vehcelLicensePhotoFront, vehcelLicensePhotoBack (Courier table)
   */
  registerCourier(dto: CourierRegisterDTO): Observable<ApiResponse> {
    const courierData = {
      userName: dto.userName,
      email: dto.email,
      password: dto.password,
      address: dto.address,
      birthDate: dto.birthDate,
      gender: dto.gender,
      vehicleType: dto.vehicleType,
      licenseNumber: dto.licenseNumber,
      maxWeight: Number(dto.maxWeight),
      status: dto.status || 'Available',
      isAvailable: dto.isAvailable ?? true,
      isOnline: dto.isOnline ?? false,
      rating: dto.rating ?? 0,
      photoUrl: dto.photoUrl || null,
      licensePhotoFront: dto.licensePhotoFront || null,
      licensePhotoBack: dto.licensePhotoBack || null,
      vehcelLicensePhotoFront: dto.vehcelLicensePhotoFront || null,
      vehcelLicensePhotoBack: dto.vehcelLicensePhotoBack || null
    };
    
    console.log('Registering Courier with data:', courierData);
    return this.http.post<ApiResponse>(`${this.apiUrl}/Register/Courier`, courierData)
      .pipe(
        tap(response => console.log('Courier registration response:', response)),
        catchError(error => this.handleRegistrationError(error, 'Courier'))
      );
  }

  /**
   * Register a new Courier with file uploads
   * Uses FormData to send files along with other data
   */
  registerCourierWithFiles(
    dto: CourierRegisterDTO,
    files: {
      photo?: File;
      licensePhotoFront?: File;
      licensePhotoBack?: File;
      vehicleLicensePhotoFront?: File;
      vehicleLicensePhotoBack?: File;
    }
  ): Observable<ApiResponse> {
    const formData = new FormData();
    
    // Add text fields
    formData.append('userName', dto.userName);
    formData.append('email', dto.email);
    formData.append('password', dto.password);
    formData.append('address', dto.address);
    formData.append('birthDate', dto.birthDate);
    formData.append('gender', dto.gender);
    formData.append('vehicleType', dto.vehicleType);
    formData.append('licenseNumber', dto.licenseNumber);
    formData.append('maxWeight', String(dto.maxWeight));
    formData.append('status', dto.status || 'Available');
    formData.append('isAvailable', 'true');
    formData.append('isOnline', 'false');
    formData.append('rating', '0');
    
    // Add file fields
    if (files.photo) {
      formData.append('photoUrl', files.photo, files.photo.name);
    }
    if (files.licensePhotoFront) {
      formData.append('licensePhotoFront', files.licensePhotoFront, files.licensePhotoFront.name);
    }
    if (files.licensePhotoBack) {
      formData.append('licensePhotoBack', files.licensePhotoBack, files.licensePhotoBack.name);
    }
    if (files.vehicleLicensePhotoFront) {
      formData.append('vehcelLicensePhotoFront', files.vehicleLicensePhotoFront, files.vehicleLicensePhotoFront.name);
    }
    if (files.vehicleLicensePhotoBack) {
      formData.append('vehcelLicensePhotoBack', files.vehicleLicensePhotoBack, files.vehicleLicensePhotoBack.name);
    }
    
    console.log('Registering Courier with files');
    
    // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
    return this.http.post<ApiResponse>(`${this.apiUrl}/Register/Courier`, formData)
      .pipe(
        tap(response => console.log('Courier registration with files response:', response)),
        catchError(error => this.handleRegistrationError(error, 'Courier'))
      );
  }

  /**
   * Register a new Admin
   */
  registerAdmin(dto: AdminRegisterDTO): Observable<ApiResponse> {
    const adminData = {
      userName: dto.userName,
      email: dto.email,
      password: dto.password
    };
    
    console.log('Registering Admin with data:', adminData);
    return this.http.post<ApiResponse>(`${this.apiUrl}/Register/Admin`, adminData)
      .pipe(
        tap(response => console.log('Admin registration response:', response)),
        catchError(error => this.handleRegistrationError(error, 'Admin'))
      );
  }

  private handleRegistrationError(error: any, role: string): Observable<never> {
    console.error(`${role} registration error:`, error);
    let errorMessage = `فشل في تسجيل ${role}`;
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.errors) {
      const errors = Object.values(error.error.errors).flat();
      errorMessage = errors.join(', ');
    } else if (error.status === 400) {
      errorMessage = 'بيانات غير صالحة. يرجى التحقق من جميع الحقول.';
    } else if (error.status === 409) {
      errorMessage = 'البريد الإلكتروني أو اسم المستخدم مسجل مسبقاً';
    }
    
    return throwError(() => errorMessage);
  }

  // ========== LOGIN METHODS ==========
  
  login(dto: UserLoginDTO, role: UserRole): Observable<LoginResponse> {
    if (!role) {
      return throwError(() => 'Role is required');
    }
    
    const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);
    return this.http.post<LoginResponse>(`${this.apiUrl}/Login/${roleCapitalized}`, dto)
      .pipe(
        tap(response => this.handleLoginResponse(response, role)),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => this.parseError(error));
        })
      );
  }

  /**
   * Client Login - uses mobile number only (no registration required)
   */
  loginClient(dto: ClientLoginDTO): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/Login/Client`, dto)
      .pipe(
        tap(response => this.handleLoginResponse(response, 'customer')),
        catchError(error => {
          console.error('Client login error:', error);
          return throwError(() => this.parseError(error));
        })
      );
  }

  // ========== PASSWORD METHODS ==========
  forgotPassword(email: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/ForgotPassword`, { email });
  }

  resetPassword(token: string, email: string, newPassword: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/ResetPassword`, {
      token,
      email,
      newPassword,
      confirmPassword: newPassword
    });
  }

  // ========== UTILITY METHODS ==========
  private handleLoginResponse(response: LoginResponse, role: UserRole): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.STORAGE_KEY, role!);
    localStorage.setItem('user_id', response.userId || '');
    localStorage.setItem('user_name', response.userName || '');
    localStorage.setItem('user_email', response.email || '');
    localStorage.setItem('token_expiration', response.expiration);
    
    this.roleSignal.set(role);
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const role = localStorage.getItem(this.STORAGE_KEY) as UserRole;
    const expiration = localStorage.getItem('token_expiration');
    
    if (token && role && expiration && new Date(expiration) > new Date()) {
      this.roleSignal.set(role);
    } else {
      this.clearStorage();
    }
  }

  private readFromStorage(): UserRole {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved && ['customer', 'supplier', 'courier', 'admin'].includes(saved)) {
      return saved as UserRole;
    }
    return null;
  }

  logout(): void {
    this.roleSignal.set(null);
    this.clearStorage();
  }

  private clearStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    localStorage.removeItem('token_expiration');
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): { 
    role: UserRole; 
    userId: string; 
    userName: string; 
    email: string; 
  } {
    return {
      role: this.roleSignal(),
      userId: localStorage.getItem('user_id') || '',
      userName: localStorage.getItem('user_name') || '',
      email: localStorage.getItem('user_email') || ''
    };
  }

  /**
   * Set user role manually (useful for OTP login and other scenarios)
   */
  setUserRole(role: UserRole, token?: string, userData?: { userId?: string; userName?: string; email?: string }): void {
    if (role) {
      if (token) {
        localStorage.setItem(this.TOKEN_KEY, token);
      }
      localStorage.setItem(this.STORAGE_KEY, role);
      if (userData) {
        if (userData.userId) localStorage.setItem('user_id', userData.userId);
        if (userData.userName) localStorage.setItem('user_name', userData.userName);
        if (userData.email) localStorage.setItem('user_email', userData.email);
      }
      localStorage.setItem('token_expiration', new Date(Date.now() + 24*60*60*1000).toISOString());
      this.roleSignal.set(role);
    }
  }

  hasRole(requiredRole: UserRole | UserRole[]): boolean {
    const currentRole = this.roleSignal();
    if (!currentRole) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(currentRole);
    }
    return currentRole === requiredRole;
  }

  getDashboardRoute(): string {
    const role = this.roleSignal();
    switch (role) {
      case 'customer':
        return '/customer/dashboard';
      case 'supplier':
        return '/supplier/dashboard';
      case 'courier':
        return '/courier/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/role-selection';
    }
  }

  private parseError(error: any): string {
    if (error.status === 401) {
      return error.error?.message || 'بيانات الدخول غير صحيحة';
    }
    if (error.status === 400) {
      return error.error?.message || 'طلب غير صالح';
    }
    if (error.status === 404) {
      return 'الخدمة غير موجودة';
    }
    if (error.status === 500) {
      return 'خطأ في الخادم. يرجى المحاولة لاحقاً.';
    }
    return 'حدث خطأ غير متوقع';
  }
}
