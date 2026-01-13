import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerDataService, CustomerProfile } from '../../services/customer-data.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class CustomerProfileComponent implements OnInit {
  profile: CustomerProfile = {
    name: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    plan: ''
  };
  isLoading = true;
  isSaving = false;
  showUpgradeModal = false;
  isRequestingUpgrade = false;
  showConfirmUpgradeModal = false;

  constructor(
    private data: CustomerDataService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.data.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.isLoading = false;
      }
    });
  }

  save() {
    this.isSaving = true;
    this.data.updateProfile(this.profile).subscribe({
      next: () => {
        this.notificationService.showNotification({
          title: '✅ تم الحفظ',
          message: 'تم حفظ البيانات بنجاح',
          type: 'success',
          icon: 'bi-check-circle-fill'
        });
        this.isSaving = false;
      },
      error: (err) => {
        console.error('Error saving profile:', err);
        this.notificationService.showNotification({
          title: '❌ خطأ',
          message: 'حدث خطأ أثناء حفظ البيانات',
          type: 'error',
          icon: 'bi-x-circle-fill'
        });
        this.isSaving = false;
      }
    });
  }

  requestSupplierUpgrade(): void {
    // Show upgrade modal instead of confirm()
    this.showConfirmUpgradeModal = true;
  }

  confirmUpgrade(): void {
    this.showConfirmUpgradeModal = false;
    this.isRequestingUpgrade = true;
    this.data.requestSupplierUpgrade().subscribe({
      next: (response) => {
        this.isRequestingUpgrade = false;
        if (response.success) {
          this.notificationService.showNotification({
            title: '🎉 تم قبول طلبك!',
            message: 'سيتم تحويلك إلى لوحة تحكم المُرسل',
            type: 'success',
            icon: 'bi-check-circle-fill',
            sound: 'assets/sounds/ringtone-you-would-be-glad-to-know.ogg'
          });
          // Switch to supplier role
          setTimeout(() => this.router.navigate(['/supplier/dashboard']), 1500);
        } else {
          this.notificationService.showNotification({
            title: '⚠️ تنبيه',
            message: response.message || 'حدث خطأ أثناء معالجة الطلب',
            type: 'warning'
          });
        }
      },
      error: (err) => {
        this.isRequestingUpgrade = false;
        console.error('Error requesting upgrade:', err);
        this.notificationService.showNotification({
          title: 'ℹ️ معلومات',
          message: 'سيتم تحويلك إلى صفحة التسجيل كـ مُرسل',
          type: 'info'
        });
        setTimeout(() => this.router.navigate(['/register'], { queryParams: { role: 'supplier' } }), 1500);
      }
    });
  }

  cancelUpgrade(): void {
    this.showConfirmUpgradeModal = false;
  }
}

