import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/* ========= DTOs (محلي عشان مفيش Errors) ========= */
export interface SupplierRegisterDTO {
  userName: string;
  email: string;
  password: string;
  address: string;
  birthDate: string;
  gender: string;
  shopName: string;
}

export interface CourierRegisterDTO {
  userName: string;
  email: string;
  password: string;
  address: string;
  birthDate: string;
  gender: string;
  vehicleType: number;
  licenseNumber: string;
  maxWeight: number;
  status?: string;
  isAvailable?: boolean;
  isOnline?: boolean;
  rating?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  // ✅ Backend URL
  private apiUrl = 'http://localhost:5000/api/Auth';

  constructor(private http: HttpClient) { }

  // -------- Supplier Register --------
  registerSupplier(data: SupplierRegisterDTO): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/Register/Supplier`,
      data
    );
  }

  // -------- Courier Register (بدون صور) --------
  registerCourier(data: CourierRegisterDTO): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/Register/Courier`,
      data
    );
  }

  // -------- Courier Register (بصور) --------
  registerCourierWithFiles(
    data: CourierRegisterDTO,
    files: {
      photo?: File;
      licensePhotoFront?: File;
      licensePhotoBack?: File;
      vehicleLicensePhotoFront?: File;
      vehicleLicensePhotoBack?: File;
    }
  ): Observable<any> {
    const formData = new FormData();

    // Append DTO fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value as any);
      }
    });

    // Append Files
    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        formData.append(key, file);
      }
    });

    return this.http.post(
      `${this.apiUrl}/Register/Courier`,
      formData
    );
  }
}
