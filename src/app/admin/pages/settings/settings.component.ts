import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class AdminSettingsComponent {
  config = {
    maintenance: false,
    supportEmail: 'support@example.com',
    defaultCity: 'القاهرة'
  };

  save() {
    alert('تم حفظ الإعدادات');
  }
}

