import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  SupplierRegisterDTO, 
  CourierRegisterDTO,
  ApiResponse
} from '../../models/user.models';

/**
 * Register Service - Handles user registration for Supplier and Courier
 * Note: Client login does not require registration (uses mobile number only)
 */
@Injectable({ providedIn: 'root' })
export class RegisterService {
  private apiUrl = 'https://localhost:7104/api/Auth';

  constructor(private http: HttpClient) {}

  /**
   * Register a new Supplier
   */
  registerSupplier(dto: SupplierRegisterDTO): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/Register/Supplier`, dto);
  }

  /**
   * Register a new Courier
   */
  registerCourier(dto: CourierRegisterDTO): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/Register/Courier`, dto);
  }

  /**
   * Register a new Courier with file uploads
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
    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
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
    
    return this.http.post<ApiResponse>(`${this.apiUrl}/Register/Courier`, formData);
  }
}
