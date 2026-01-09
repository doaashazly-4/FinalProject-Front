import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeInDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-30px)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeInLeft', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-30px)' }),
        animate('0.8s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('fadeInRight', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(30px)' }),
        animate('0.8s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('slideInUp', [
      transition(':enter', [
        query('.stat-item', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('slideInCards', [
      transition(':enter', [
        query('.service-card', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(150, [
            animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('bounceIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    // Removed float/pulse infinite animations to avoid invalid timing errors
  ]
})
export class MainComponent implements OnInit {
  isScrolled = false;
  stats = [
    { value: '50K+', label: 'عميل سعيد', icon: 'bi-emoji-smile' },
    { value: '100K+', label: 'طلب منجز', icon: 'bi-check-circle' },
    { value: '24/7', label: 'خدمة عملاء', icon: 'bi-headset' }
  ];

  services = [
    {
      icon: 'bi-lightning-charge-fill',
      title: 'توصيل سريع',
      description: 'توصيل خلال 24 ساعة لجميع المناطق مع تتبع مباشر لطلبك',
      color: '#3B82F6'
    },
    {
      icon: 'bi-shield-check-fill',
      title: 'آمن ومضمون',
      description: 'ضمان كامل على جميع المنتجات مع سياسة إرجاع سهلة',
      color: '#10B981'
    },
    {
      icon: 'bi-truck-flatbed',
      title: 'توصيل مجاني',
      description: 'توصيل مجاني للطلبات التي تزيد عن 100 ريال',
      color: '#8B5CF6'
    }
  ];

  steps = [
    {
      number: '1',
      title: 'اختر منتجاتك',
      description: 'تصفح مجموعتنا الواسعة من المنتجات واختر ما يناسبك'
    },
    {
      number: '2',
      title: 'أكمل الطلب',
      description: 'أضف المنتجات إلى السلة وأكمل معلومات التوصيل'
    },
    {
      number: '3',
      title: 'استلم طلبك',
      description: 'سنقوم بتوصيل طلبك بسرعة وأمان إلى باب منزلك'
    }
  ];

  features = [
    {
      icon: 'bi-check-circle-fill',
      title: 'سرعة في التوصيل',
      description: 'نضمن وصول طلبك في الوقت المحدد مع خدمة توصيل سريعة'
    },
    {
      icon: 'bi-check-circle-fill',
      title: 'أسعار تنافسية',
      description: 'أفضل الأسعار في السوق مع عروض وخصومات حصرية'
    },
    {
      icon: 'bi-check-circle-fill',
      title: 'جودة عالية',
      description: 'منتجات أصلية 100% مع ضمان الجودة والرضا'
    },
    {
      icon: 'bi-check-circle-fill',
      title: 'دعم فني متواصل',
      description: 'فريق دعم متاح 24/7 لمساعدتك في أي وقت'
    }
  ];

  ngOnInit() {
    console.log('MainComponent initialized');
    console.log('Stats:', this.stats);
    console.log('Services:', this.services);
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  getServiceDelay(index: number): string {
    return `${index * 0.1}s`;
  }
}
