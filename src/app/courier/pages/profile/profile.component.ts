import { Component , OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourierDataService, CourierProfile, UpdateProfileDto } from '../../services/courier-data.service';

@Component({
  selector: 'app-courier-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
// export class CourierProfileComponent {
//   profile = {
//     name: 'عبدالله القحطاني',
//     phone: '+966501112233',
//     vehicle: 'دراجة نارية',
//     plate: 'أ ب ج 1234',
//     city: 'القاهرة'
//   };


export class CourierProfileComponent {

  profile: CourierProfile = {
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    vehicleType: '',
    licenseNumber: '',
    rating: 0,
    completedDeliveries: 0,
    isAvailable: false,
    isOnline: false
  };

  save(): void {
    alert('تم الحفظ');
  }
}