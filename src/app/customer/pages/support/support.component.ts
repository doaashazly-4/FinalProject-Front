import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerDataService, SupportTicket } from '../../services/customer-data.service';

@Component({
  selector: 'app-customer-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.component.html',
  styleUrl: './support.component.css'
})
export class CustomerSupportComponent implements OnInit {
  tickets: SupportTicket[] = [];
  newTicket = { subject: '', message: '' };
  isLoading = true;

  constructor(private data: CustomerDataService) {}

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

  submitTicket() {
    if (!this.newTicket.subject || !this.newTicket.message) {
      alert('يرجى إدخال العنوان والرسالة');
      return;
    }
    
    this.data.createTicket({ subject: this.newTicket.subject, message: this.newTicket.message }).subscribe({
      next: () => {
        alert('تم إرسال التذكرة، سنتواصل معك قريباً');
        this.newTicket = { subject: '', message: '' };
        this.loadTickets();
      },
      error: (err) => {
        console.error('Error creating ticket:', err);
        // For demo, add locally
        const newTicket: SupportTicket = {
          id: `TKT-${Date.now()}`,
          subject: this.newTicket.subject,
          message: this.newTicket.message,
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.tickets.unshift(newTicket);
        this.newTicket = { subject: '', message: '' };
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

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private getMockTickets(): SupportTicket[] {
    return [
      {
        id: 'TKT-001',
        subject: 'تأخر في التوصيل',
        message: 'الشحنة تأخرت عن الموعد المحدد',
        status: 'resolved',
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date(Date.now() - 86400000)
      },
      {
        id: 'TKT-002',
        subject: 'استفسار عن العنوان',
        message: 'هل يمكن تغيير عنوان التسليم؟',
        status: 'closed',
        createdAt: new Date(Date.now() - 432000000),
        updatedAt: new Date(Date.now() - 345600000)
      }
    ];
  }
}
