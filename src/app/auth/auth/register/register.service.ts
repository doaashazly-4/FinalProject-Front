import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SupplierRegisterDTO, CourierRegisterDTO } from '../../../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  private apiUrl = 'http://localhost:5000/api/Auth';


  constructor(private http: HttpClient) { }

  // -------- Supplier Register --------
  registerSupplier(data: SupplierRegisterDTO): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/Register/Supplier`,
      data
    );
  }

  // -------- Courier Register (no files) --------
  registerCourier(data: CourierRegisterDTO): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/Register/Courier`,
      data
    );
  }

  // -------- Courier Register (with files) --------
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
    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    // Append files
    Object.keys(files).forEach(key => {
      const file = (files as any)[key];
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
