import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-courier-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class CourierProfileComponent {
  profile = {
    name: 'عبدالله القحطاني',
    phone: '+966501112233',
    vehicle: 'دراجة نارية',
    plate: 'أ ب ج 1234',
    city: 'القاهرة'
  };

  save() {
    alert('تم حفظ بيانات الموصل');
  }
}

