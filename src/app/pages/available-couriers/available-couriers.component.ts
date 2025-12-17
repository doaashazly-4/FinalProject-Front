import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-available-couriers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './available-couriers.component.html',
  styleUrl: './available-couriers.component.css'
})
export class AvailableCouriersComponent {
  couriers = [
    { name: 'أحمد', rating: 4.9, area: 'القاهرة', completed: 1200, status: 'متاح', img: '/assets/Images/pexels-chevanon-324028.jpg' },
    { name: 'فاطمة', rating: 4.8, area: 'الإسكندرية', completed: 980, status: 'متاح', img: '/assets/Images/pexels-chevanon-302896.jpg' },
    { name: 'محمد', rating: 4.7, area: 'الجيزة', completed: 1100, status: 'في توصيل', img: '/assets/Images/pexels-anfisa-eremina-1021202-1993660.jpg' },
    { name: 'سارة', rating: 4.95, area: 'المنصورة', completed: 1500, status: 'متاح', img: '/assets/Images/pexels-kindelmedia-6868160.jpg' }
  ];
}

