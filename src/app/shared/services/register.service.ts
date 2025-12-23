import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // مهم جدًا
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
  private apiUrl = `${environment.apiUrl}/Auth`; //ضفنا دا 

  constructor(private http: HttpClient) {}

  /**
   * Register a new Supplier
   */
  registerSupplier(dto: SupplierRegisterDTO): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/Register/Supplier`, dto);
  }

  /**
   * Register a new Courier without files
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
      vehicleLicenseFront?: File;
      vehicleLicenseBack?: File;
    }
  ): Observable<ApiResponse> {
    const formData = new FormData();
    
    // إضافة البيانات النصية
    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
    // إضافة الملفات
    if (files.photo) {
      formData.append('photoUrl', files.photo, files.photo.name);
    }
    if (files.licensePhotoFront) {
      formData.append('licensePhotoFront', files.licensePhotoFront, files.licensePhotoFront.name);
    }
    if (files.licensePhotoBack) {
      formData.append('licensePhotoBack', files.licensePhotoBack, files.licensePhotoBack.name);
    }
    if (files.vehicleLicenseFront) {
      formData.append('vehcelLicensePhotoFront', files.vehicleLicenseFront, files.vehicleLicenseFront.name);
    }
    if (files.vehicleLicenseBack) {
      formData.append('vehcelLicensePhotoBack', files.vehicleLicenseBack, files.vehicleLicenseBack.name);
    }
    
    return this.http.post<ApiResponse>(`${this.apiUrl}/Register/Courier`, formData);
  }
}
