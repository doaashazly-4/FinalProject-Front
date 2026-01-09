import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerDataService, CustomerProfile } from '../../services/customer-data.service';

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

  constructor(
    private data: CustomerDataService,
    private router: Router
  ) {}

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
        alert('تم حفظ البيانات');
        this.isSaving = false;
      },
      error: (err) => {
        console.error('Error saving profile:', err);
        alert('حدث خطأ أثناء حفظ البيانات');
        this.isSaving = false;
      }
    });
  }

  requestSupplierUpgrade(): void {
    if (confirm('هل تريد أن تصبح مُرسل؟ سيتم تحويلك إلى لوحة تحكم المُرسل.')) {
      this.isRequestingUpgrade = true;
      this.data.requestSupplierUpgrade().subscribe({
        next: (response) => {
          this.isRequestingUpgrade = false;
          if (response.success) {
            alert('تم قبول طلبك! سيتم تحويلك إلى لوحة تحكم المُرسل.');
            // Switch to supplier role
            this.router.navigate(['/supplier/dashboard']);
          } else {
            alert(response.message || 'حدث خطأ أثناء معالجة الطلب');
          }
        },
        error: (err) => {
          this.isRequestingUpgrade = false;
          console.error('Error requesting upgrade:', err);
          // For demo, redirect to supplier registration
          if (confirm('سيتم تحويلك إلى صفحة التسجيل كـ مُرسل. هل تريد المتابعة؟')) {
            this.router.navigate(['/register'], { queryParams: { role: 'supplier' } });
          }
        }
      });
    }
  }
}
