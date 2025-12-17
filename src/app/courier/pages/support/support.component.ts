import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourierDataService, CourierTicket } from '../../services/courier-data.service';

@Component({
  selector: 'app-courier-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.component.html',
  styleUrl: './support.component.css'
})
export class CourierSupportComponent implements OnInit {
  tickets: CourierTicket[] = [];
  newTicket = { subject: '', message: '', photos: [] as File[], photoPreviews: [] as string[] };
  isLoading = true;
  isSubmitting = false;

  constructor(private data: CourierDataService) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading = true;
    this.data.getTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading tickets:', err);
        // Load mock data for demo
        this.tickets = this.getMockTickets();
        this.isLoading = false;
      }
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (this.newTicket.photos.length < 3) {
        if (!file.type.startsWith('image/')) {
          alert('يرجى اختيار صورة فقط');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert('حجم الصورة كبير جداً (الحد الأقصى 5MB)');
          return;
        }
        this.newTicket.photos.push(file);
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.newTicket.photoPreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        alert('يمكنك إضافة 3 صور كحد أقصى');
      }
    }
  }

  addPhoto(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e: any) => {
      if (e.target.files && e.target.files.length > 0) {
        this.onPhotoSelected(e);
      }
    };
    input.click();
  }

  removePhoto(index: number): void {
    this.newTicket.photos.splice(index, 1);
    this.newTicket.photoPreviews.splice(index, 1);
  }

  submitTicket() {
    if (!this.newTicket.subject || !this.newTicket.message) {
      alert('يرجى إدخال العنوان والرسالة');
      return;
    }
    
    this.isSubmitting = true;
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('subject', this.newTicket.subject);
    formData.append('message', this.newTicket.message);
    this.newTicket.photos.forEach((photo, index) => {
      formData.append(`photo${index}`, photo);
    });
    
    this.data.createTicket({ 
      subject: this.newTicket.subject,
      message: this.newTicket.message,
      photos: this.newTicket.photoPreviews
    }).subscribe({
      next: () => {
        alert('تم إرسال التذكرة، سنتواصل معك قريباً');
        this.newTicket = { subject: '', message: '', photos: [], photoPreviews: [] };
        this.isSubmitting = false;
        this.loadTickets();
      },
      error: (err) => {
        console.error('Error creating ticket:', err);
        // For demo, add locally
        const newTicket: CourierTicket = {
          id: `TKT-${Date.now()}`,
          subject: this.newTicket.subject,
          message: this.newTicket.message,
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.tickets.unshift(newTicket);
        this.newTicket = { subject: '', message: '', photos: [], photoPreviews: [] };
        this.isSubmitting = false;
        alert('تم إرسال التذكرة، سنتواصل معك قريباً');
      }
    });
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'open': 'مفتوحة',
      'in_progress': 'قيد المعالجة',
      'resolved': 'تم الحل',
      'closed': 'مغلقة'
    };
    return statusMap[status] || status;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private getMockTickets(): CourierTicket[] {
    return [
      {
        id: 'TKT-C001',
        subject: 'مشكلة في تحديد الموقع',
        message: 'التطبيق لا يحدد موقعي بدقة',
        status: 'resolved',
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date(Date.now() - 86400000)
      },
      {
        id: 'TKT-C002',
        subject: 'استفسار عن الأرباح',
        message: 'متى يتم تحويل أرباح الأسبوع الماضي؟',
        status: 'closed',
        createdAt: new Date(Date.now() - 432000000),
        updatedAt: new Date(Date.now() - 345600000)
      }
    ];
  }
}
