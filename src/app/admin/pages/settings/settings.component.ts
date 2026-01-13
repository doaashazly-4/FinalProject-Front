import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../shared/services/notification.service';

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

  constructor(private notificationService: NotificationService) { }

  save() {
    this.notificationService.showNotification({
      title: '✅ تم الحفظ',
      message: 'تم حفظ الإعدادات بنجاح',
      type: 'success'
    });
  }
}


